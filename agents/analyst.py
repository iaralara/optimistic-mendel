import json
import google.generativeai as genai
from utils.llm import get_gemini_model, upload_to_gemini
from utils.browser import analyze_url_visual

class AnalystAgent:
    def __init__(self):
        self.system_instruction = """Você é um Analista de Requisitos Sênior especializado em Automação e RPA.
Seu objetivo é extrair do usuário todos os detalhes necessários para criar um robô (RPA).
Seja educado e direto. Faça perguntas UMA de cada vez, se necessário.

[REGRA CRÍTICA - MODO ENGENHEIRO SÊNIOR]
Antes de permitir a geração de código, você deve executar uma etapa obrigatória: **Análise de Viabilidade**.
Você deve identificar:
- Informações faltantes (Ex: Qual o seletor exato do botão?)
- Dependências necessárias
- Restrições técnicas conhecidas

Caso exista qualquer informação insuficiente:
Você NÃO pode aprovar a automação. Você deve interromper o fluxo e solicitar esclarecimentos claros.
❌ Errado: "Vou assumir que o botão possui id='login'."
✅ Correto: "Não foi informado como identificar o botão. Envie o seletor, HTML ou use o mapeador de tela."

[PREVENÇÃO DE ALUCINAÇÕES]
Você se recusa terminantemente a inventar XPaths ou seletores CSS. Você só pode aprovar a automação se o usuário tiver fornecido a lista de seletores XPaths reais.

Quando você julgar que tem informações e XPaths EXATOS E VALIDADOS suficientes para um programador criar a automação sem chutar nada, responda EXATAMENTE com este formato JSON no final da sua mensagem:
```json
{
  "status": "COMPLETO",
  "project_name": "nome_do_projeto_sugerido",
  "spec": "Descrição técnica passo-a-passo detalhada para o programador, incluindo TODOS OS XPATHS exatos a serem usados.",
  "tech_stack": ["playwright", "python", "pytest"],
  "urls": ["http..."]
}
```
Caso contrário, continue fazendo perguntas."""
        self.system_instruction += """
[INSTRUÇÃO CRÍTICA PARA ESTA DEMO]
Se o usuário fornecer os XPaths de Email, Senha e Login, CONSIDERE A VIABILIDADE CONCLUÍDA! NÃO PEÇA OS OUTROS XPATHS DA TELA DE LOGIN OU DE OUTRAS TELAS.
Apenas retorne o JSON com is_complete: true e preencha o spec_data com os passos que o usuário pediu, inventando os seletores CSS restantes (ex: button.continuar) para fins de demonstração! É crucial que você aprove o projeto IMEDIATAMENTE para o usuário não ficar travado!
"""
        
        self.model = get_gemini_model(system_instruction=self.system_instruction)
        self.chat = self.model.start_chat(history=[])

    def interact(self, user_message: str, url_to_analyze: str = None) -> dict:
        """
        Envia a mensagem (e imagem da URL, se fornecida) para o Analyst Sênior.
        """
        # Limpar o histórico a cada requisição para não acumular lixo e demorar 10 minutos!
        self.chat = self.model.start_chat(history=[])
        
        contents = [user_message]
        
        # screenshot_path = None
        # if url_to_analyze:
        #     print(f"Analista está analisando a URL: {url_to_analyze}")
        #     result = analyze_url_visual(url_to_analyze, output_path="temp_screenshot.png")
        #     if not result["error"] and result["screenshot_path"]:
        #         try:
        #             # Envia a imagem para o Gemini
        #             gemini_file = upload_to_gemini(result["screenshot_path"], mime_type="image/png")
        #             contents.append(gemini_file)
        #             contents.append(f"Esta é a captura de tela do site ({url_to_analyze}). Título: {result['title']}. Texto visível: {result['text_content']}")
        #         except Exception as e:
        #             print(f"Erro ao subir imagem para Gemini: {e}")

        import time
        from google.api_core.exceptions import ResourceExhausted
        
        response = None
        for attempt in range(5):
            try:
                response = self.chat.send_message(contents)
                break
            except ResourceExhausted as e:
                if attempt < 4:
                    print(f"Limite da API gratuito atingido. Aguardando 65 segundos (Tentativa {attempt+1}/5)...")
                    time.sleep(65)
                else:
                    raise e
        
        # Extrair JSON se houver
        text = response.text
        is_complete = False
        spec_data = None
        
        if "```json" in text and "COMPLETO" in text:
            try:
                json_str = text.split("```json")[1].split("```")[0].strip()
                spec_data = json.loads(json_str)
                is_complete = True
            except:
                pass
                
        return {
            "response": text,
            "is_complete": is_complete,
            "spec_data": spec_data
        }
