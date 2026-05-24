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
        payload = {"model": "nomic-embed-text", "prompt": texto}

        response = requests.post(url, json=payload, timeout=15)
        return response.json()["embedding"]
    except Exception as e:
        print(f" [❌ OLLAMA ERROR] Falha ao gerar embedding: {e}")
        return [0.0] * 768


def disparar_esteira_rpa_real(caminho_pdf: str, numero_edital: str, orgao: str):
    # 1. Extrai o texto do documento real
    texto_edital = extrair_texto_pdf(caminho_pdf)

    if not texto_edital:
        print(" [⚠️ AVISO] Processamento cancelado: Texto do edital está vazio.")
        return

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

    # Usamos os primeiros 150 caracteres do texto extraído como um título/resumo descritivo
    resumo_objeto = (
        texto_edital[:150] + "..." if len(texto_edital) > 150 else texto_edital
    )

    # 4. Payload com dados do documento real
    payload = {
        "tenantId": "tenant-teste-123",
        "externalId": f"LIT-PDF-{numero_edital.replace('/', '-')}",
        "number": numero_edital,
        "organization": orgao,
        "modality": "PREGAO_ELETRONICO",
        "title": resumo_objeto,  # Texto extraído do próprio documento
        "embedding": vetor_real,
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