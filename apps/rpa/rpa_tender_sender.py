import json
import os
import pika
import requests
from pypdf import PdfReader


def extrair_texto_pdf(caminho_pdf: str, max_paginas=3) -> str:
    """Abre um arquivo PDF e extrai o texto das primeiras páginas

    onde geralmente se concentra o 'Objeto' da licitação.
    """
    if not os.path.exists(caminho_pdf):
        print(f" [❌ ERRO] Arquivo PDF não encontrado em: {caminho_pdf}")
        return ""

    try:
        print(f" [📄 PDF] Extraindo texto do arquivo: {os.path.basename(caminho_pdf)}...")
        reader = PdfReader(caminho_pdf)
        texto_extraido = ""

        # Limita a leitura às primeiras páginas para evitar sobrecarregar o modelo de embedding
        paginas_para_ler = min(len(reader.pages), max_paginas)

        for i in range(paginas_para_ler):
            texto_extraido += reader.pages[i].extract_text() + "\n"

        # Limpeza básica de quebras de linha excessivas
        texto_limpo = " ".join(texto_extraido.split())
        return texto_limpo[:2000]  # Limita a 2000 caracteres (foco no resumo/objeto)

    except Exception as e:
        print(f" [❌ PDF ERROR] Falha ao ler o arquivo PDF: {e}")
        return ""


def gerar_embedding_local(texto: str) -> list:
    """Conecta ao Ollama local e gera o vetor semântico de 768 dimensões."""
    try:
        url = "http://localhost:11434/api/embeddings"
        payload = {"model": "nomic-embed-text:latest", "prompt": texto}

        response = requests.post(url, json=payload, timeout=15)
        if response.status_code != 200:
            print(f"Erro do Ollama: {response.text}")
            response.raise_for_status()

        return response.json()["embedding"]
    except Exception as e:
        print(f" [❌ OLLAMA ERROR] Falha ao gerar embedding: {e}")
        return [0.0] * 768


def extrair_metadados_com_llm(texto_edital: str) -> dict:
    """Extrai metadados estruturados do texto do edital usando LLM local."""
    try:
        url = "http://localhost:11434/api/generate"
        system_prompt = (
            "Você é um assistente especialista em licitações. "
            "Extraia do texto a seguir as informações solicitadas e retorne ESTRITAMENTE em formato JSON com as seguintes chaves:\n"
            "- \"objeto_resumido\": uma string curta descrevendo o que está sendo contratado.\n"
            "- \"valor_estimado\": o valor em float ou null se não houver.\n"
            "- \"amparo_legal\": a lei aplicada (ex: Lei 14.133/2021).\n"
            "- \"criterio_julgamento\": a forma de julgamento (ex: Menor Preço)."
        )
        payload = {
            "model": "gemma:latest",
            "prompt": f"{system_prompt}\n\nTexto do edital:\n{texto_edital}",
            "stream": False,
            "format": "json"
        }

        response = requests.post(url, json=payload, timeout=180)
        if response.status_code != 200:
            print(f"Erro do Ollama: {response.text}")
            response.raise_for_status()

        response_json = response.json()
        
        resultado_str = response_json.get("response", "{}")
        return json.loads(resultado_str)
    except Exception as e:
        print(f" [❌ LLM ERROR] Falha ao extrair metadados com LLM: {e}")
        return {
            "objeto_resumido": "Objeto não identificado",
            "valor_estimado": None,
            "amparo_legal": "Não identificado",
            "criterio_julgamento": "Não identificado"
        }


def disparar_esteira_rpa_real(caminho_pdf: str, numero_edital: str, orgao: str):
    # 1. Extrai o texto do documento real
    texto_edital = extrair_texto_pdf(caminho_pdf)

    if not texto_edital:
        print(" [⚠️ AVISO] Processamento cancelado: Texto do edital está vazio.")
        return

    print(" [🤖 IA] Extraindo metadados do edital com Ollama (gemma)...")
    metadados_llm = extrair_metadados_com_llm(texto_edital)

    # 2. Conexão com o RabbitMQ
    credentials = pika.PlainCredentials("guest", "guest")
    parameters = pika.ConnectionParameters(
        host="localhost", port=5672, virtual_host="/", credentials=credentials
    )
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    channel.queue_declare(queue="notification_queue", durable=True)

    # 3. Vetorização Semântica do texto extraído do PDF
    print(" [🧠 IA] Vetorizando o conteúdo extraído do PDF via Ollama...")
    vetor_real = gerar_embedding_local(texto_edital)

    # Usa o objeto resumido retornado pela LLM, ou faz fallback se não vier
    titulo_llm = metadados_llm.get("objeto_resumido")
    if not titulo_llm or titulo_llm == "Objeto não identificado":
        titulo_llm = texto_edital[:150] + "..." if len(texto_edital) > 150 else texto_edital

    # 4. Payload com dados do documento real
    payload = {
        "tenantId": "tenant-teste-123",
        "externalId": f"LIT-PDF-{numero_edital.replace('/', '-')}",
        "number": numero_edital,
        "organization": orgao,
        "modality": "PREGAO_ELETRONICO",
        "title": titulo_llm,  # Gerado pela LLM
        "embedding": vetor_real,
        "metadata_llm": metadados_llm,
    }

    channel.basic_publish(
        exchange="",
        routing_key="notification_queue",
        body=json.dumps(payload),
        properties=pika.BasicProperties(
            delivery_mode=2, content_type="application/json"
        ),
    )

    print(f" [🚀 RPA] Edital {numero_edital} extraído e enviado com sucesso!")
    connection.close()


if __name__ == "__main__":
    # Coloque um arquivo .pdf de teste na mesma pasta do script ou passe o caminho dele aqui
    caminho_do_edital_pdf = "edital_teste.pdf"

    # Nome do órgão e número da licitação para simulação
    orgao_publico = "Tribunal Regional Eleitoral de Pernambuco - TRE/PE"
    numero_da_licitacao = "210/2026"

    disparar_esteira_rpa_real(caminho_do_edital_pdf, numero_da_licitacao, orgao_publico)