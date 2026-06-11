import os
import json
import asyncio
import pika
from playwright.async_api import async_playwright

RABBITMQ_URL = os.environ.get("RABBITMQ_URL", "amqp://localhost")
QUEUE_NAME = "bid_submission_queue"

async def submit_bid_to_portal(tender_external_id: str, total_value: float, company_cnpj: str):
    """
    Função assíncrona que usa Playwright para automatizar o browser
    e submeter a proposta no portal.
    """
    async with async_playwright() as p:
        # a. Abre o browser em modo headless
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # b. Navega para a página de login simulada
            print(f"[RPA] Navegando para o portal para a empresa {company_cnpj}...")
            await page.goto("https://portal-compras-governo.simulado.gov.br/login")
            
            # c. Preenche os campos de login e clica em Entrar
            # Nota: Num cenário real, a password viria de um cofre virtual (Vault/Secrets Manager)
            await page.fill("input#cnpj", company_cnpj or "00000000000000")
            await page.fill("input#password", "senha_super_secreta")
            await page.click("button[type='submit']") # Seleciona o botão de login genérico
            
            # Aguarda a navegação após o login
            await page.wait_for_load_state("networkidle")
            
            # d. Navega para a página da licitação usando o tenderExternalId
            tender_url = f"https://portal-compras-governo.simulado.gov.br/licitacoes/{tender_external_id}"
            print(f"[RPA] Acedendo à licitação: {tender_external_id}")
            await page.goto(tender_url)
            
            # e. Insere o totalValue no campo de proposta
            # Converte o valor para string, possivelmente formatado. Aqui usamos string simples.
            valor_str = str(total_value)
            await page.fill("input#valor_proposta", valor_str)
            
            # f. Clica no botão "Submeter Proposta Definitiva"
            print(f"[RPA] A submeter o valor de {valor_str}...")
            await page.click("button:has-text('Submeter Proposta Definitiva')")
            
            # Aguarda eventual modal de confirmação ou recarregamento
            await page.wait_for_timeout(2000)
            
            # g. Tira um screenshot para prova de submissão e guarda na pasta local
            screenshot_path = f"comprovativo_submissao_{tender_external_id}.png"
            await page.screenshot(path=screenshot_path)
            print(f"[RPA] Proposta submetida com sucesso. Comprovativo: {screenshot_path}")
            
        except Exception as e:
            print(f"[RPA] Erro durante a automação: {str(e)}")
            raise e
        finally:
            # Fecha o browser em qualquer situação
            await browser.close()


def process_submission(ch, method, properties, body):
    """
    Callback executado quando uma mensagem é recebida do RabbitMQ.
    """
    try:
        # Decodifica o payload JSON da mensagem
        payload = json.loads(body)
        print(f"\n[RPA] Mensagem recebida: {payload}")
        
        tender_external_id = payload.get("tenderExternalId")
        total_value = payload.get("totalValue")
        company_cnpj = payload.get("companyCnpj", "")
        
        if not tender_external_id or total_value is None:
            raise ValueError("Faltam parâmetros obrigatórios na mensagem (tenderExternalId ou totalValue).")
        
        # Executa a automação assíncrona usando asyncio.run
        # Como o pika blocking connection roda no main thread sem event loop, isto é seguro.
        asyncio.run(submit_bid_to_portal(tender_external_id, total_value, company_cnpj))
        
        # Confirma ao RabbitMQ que a mensagem foi processada com sucesso
        ch.basic_ack(delivery_tag=method.delivery_tag)
        
    except Exception as e:
        print(f"[RPA] Falha ao processar mensagem: {e}")
        # Em caso de erro, rejeita a mensagem, colocando-a na fila novamente (ou para uma DLQ)
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_worker():
    """
    Inicia o worker do RabbitMQ para escutar a fila de submissão de propostas.
    """
    print(f"[RPA] A iniciar worker... a ligar a {RABBITMQ_URL}")
    parameters = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(parameters)
    channel = connection.channel()
    
    # Assegura que a fila existe
    channel.queue_declare(queue=QUEUE_NAME, durable=True)
    
    # Define o número de mensagens não reconhecidas permitidas de uma vez
    channel.basic_qos(prefetch_count=1)
    
    # Associa o callback à fila
    channel.basic_consume(queue=QUEUE_NAME, on_message_callback=process_submission)
    
    print(f"[RPA] À espera de mensagens na fila '{QUEUE_NAME}'. Para sair pressione CTRL+C")
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        print("[RPA] Worker interrompido pelo utilizador.")
        channel.stop_consuming()
    finally:
        connection.close()

if __name__ == "__main__":
    start_worker()
