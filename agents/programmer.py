import json
import re
from utils.llm import get_gemini_model
from utils.file_manager import save_code_file

class ProgrammerAgent:
    def __init__(self):
        self.system_instruction = """Você é um Programador Sênior Python Especialista em Automação.
Você receberá uma especificação técnica detalhada.
Sua tarefa é escrever o código-fonte COMPLETO, limpo e bem documentado em Python.

[REGRAS CRÍTICAS DE ENGENHARIA DE SOFTWARE]
1. **Geração Segura:** NUNCA insira senhas ou emails diretamente no código. USE SEMPRE variáveis de ambiente (ex: `os.getenv("F360_EMAIL")`). O usuário irá fornecer um arquivo `.env` para segurança. Se ele fornecer credenciais na instrução, coloque-as no `.env.example`.
2. **Tratamento de Erros:** Todo código principal deve estar dentro de blocos `try/except` com logs claros e estruturados.
3. **Estrutura Completa:** Você DEVE gerar não apenas o código principal (`src/main.py`), mas a estrutura inteira de projeto: `tests/test_main.py` usando `pytest`, `.env.example`, `requirements.txt` e `README.md`.
4. **NÃO CHUTE SELETORES:** Se o Analista te passou os XPaths mapeados da página, use-os. 
5. **VISÃO COMPUTACIONAL (MUITO IMPORTANTE):** Ocasionalmente, você receberá um Print de Tela do usuário em anexo junto com as instruções dele (ex: "clique em Conta Movimento"). Use a sua capacidade de VISÃO para ler a imagem, encontrar o botão/elemento na interface visual e escrever o código Playwright perfeito usando seletores de texto como `page.get_by_text("...", exact=False).click()`, `page.get_by_placeholder("...")`, ou `page.locator("button:has-text('...')")`. Dê preferência absoluta ao que você ESTÁ ENXERGANDO na imagem!

[TESTES E EXECUÇÃO]
- Testes são obrigatórios. Nenhuma automação está concluída sem testes.
- Se a automação usar Playwright, certifique-se de configurar a execução em modo visível (`headless=False`) para o usuário ver o robô.
- Sempre adicione `.first` ao usar seletores CSS genéricos.

O output OBRIGATORIAMENTE deve usar o formato XML abaixo para cada arquivo:

<file path="src/main.py">
import os
print("código completo aqui")
</file>

<file path="tests/test_main.py">
import pytest
</file>

Não use JSON. APENAS retorne os blocos <file>. Nunca coloque código fora dos blocos."""
        self.model = get_gemini_model(system_instruction=self.system_instruction)

    def generate_code(self, spec_data: dict, project_dir: str, image_base64: str = None) -> dict:
        """
        Pede ao Gemini para gerar o código com base na spec e salva os arquivos.
        """
        prompt = f"Gere os arquivos para a seguinte especificação:\n\n{json.dumps(spec_data, indent=2, ensure_ascii=False)}"
        
        contents = [prompt]
        
        import os
        import base64
        import tempfile
        from utils.llm import upload_to_gemini
        
        if image_base64:
            try:
                if "," in image_base64:
                    image_base64 = image_base64.split(",")[1]
                
                img_data = base64.b64decode(image_base64)
                temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
                temp_file.write(img_data)
                temp_file.close()
                
                gemini_file = upload_to_gemini(temp_file.name, mime_type="image/png")
                contents.append(gemini_file)
                print("[Programador] Imagem recebida e enviada para o Gemini Vision com sucesso!")
            except Exception as e:
                print(f"[Programador] Erro ao processar imagem base64: {e}")
        
        import time
        from google.api_core.exceptions import ResourceExhausted
        
        response = None
        for attempt in range(5):
            try:
                response = self.model.generate_content(contents)
                break
            except ResourceExhausted as e:
                if attempt < 4:
                    print(f"Limite da API gratuito atingido. Aguardando 65 segundos (Tentativa {attempt+1}/5)...")
                    time.sleep(65)
                else:
                    raise e
        text = response.text
        
        try:
            # Extrair usando Regex de blocos XML
            import re
            pattern = r'<file\s+path="([^"]+)">\s*(.*?)\s*</file>'
            matches = re.finditer(pattern, text, re.DOTALL)
            
            created_files = []
            count = 0
            for match in matches:
                filename = match.group(1)
                content = match.group(2)
                
                saved_path = save_code_file(project_dir, filename, content)
                created_files.append(saved_path)
                count += 1
                
            if count == 0:
                raise ValueError("Nenhum arquivo encontrado no formato <file path='...'></file>")
                
            return {
                "success": True,
                "files": created_files,
                "raw_response": text
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "raw_response": text
            }
