import os
import json
from utils.executor import run_robot_code
from utils.llm import get_gemini_model
from utils.file_manager import save_code_file

class TesterAgent:
    def __init__(self):
        self.system_instruction = """Você é um Engenheiro de Qualidade Sênior Python (Testador Automático).
Um código falhou ao ser executado. O erro do terminal (stderr/stdout) será enviado a você, bem como o código atual.
Sua tarefa é analisar o erro, corrigir o código e retorná-lo em formato JSON.
Formato de saída OBRIGATÓRIO:
```json
{
  "files": [
    {
      "filename": "main.py",
      "content": "código corrigido aqui..."
    }
  ],
  "fix_explanation": "Explicação do que estava errado e como você corrigiu"
}
```
Não retorne nada além do JSON."""
        self.model = get_gemini_model(system_instruction=self.system_instruction)

    def test_and_fix(self, project_dir: str, main_script: str = "main.py", max_retries: int = 2) -> dict:
        """
        Roda o código. Se falhar, pede para o Gemini consertar. Repete até max_retries.
        """
        for attempt in range(max_retries + 1):
            print(f"Executando teste (Tentativa {attempt + 1}/{max_retries + 1})...")
            result = run_robot_code(project_dir, main_script=main_script)
            
            if result["success"]:
                return {
                    "success": True,
                    "attempts": attempt + 1,
                    "stdout": result["stdout"],
                    "message": "Código executado com sucesso!"
                }
            
            # Se falhou e atingiu max_retries, desiste
            if attempt == max_retries:
                return {
                    "success": False,
                    "attempts": attempt + 1,
                    "error": result["stderr"],
                    "message": f"O robô continuou falhando após {max_retries} tentativas de correção."
                }
                
            # Se falhou, vamos corrigir
            print(f"Erro detectado: {result['stderr']}. Solicitando correção...")
            
            # Lê o código atual
            script_path = os.path.join(project_dir, main_script)
            with open(script_path, "r", encoding="utf-8") as f:
                current_code = f.read()
                
            prompt = f"""
O código abaixo falhou durante a execução.
## CÓDIGO (Arquivo: {main_script}):
{current_code}

## SAÍDA DE ERRO (STDERR):
{result['stderr']}

Por favor, corrija o erro e me envie o código atualizado no JSON.
"""
            import time
            from google.api_core.exceptions import ResourceExhausted
            
            response = None
            for attempt_api in range(5):
                try:
                    response = self.model.generate_content(prompt)
                    break
                except ResourceExhausted as e:
                    if attempt_api < 4:
                        print(f"Limite da API gratuito atingido. Aguardando 65 segundos (Tentativa {attempt_api+1}/5)...")
                        time.sleep(65)
                    else:
                        raise e
            text = response.text
            
            try:
                if "```json" in text:
                    json_str = text.split("```json")[1].split("```")[0].strip()
                else:
                    json_str = text.strip()
                    
                data = json.loads(json_str)
                
                # Salva o arquivo corrigido
                for file_data in data.get("files", []):
                    save_code_file(project_dir, file_data["filename"], file_data["content"])
                    
                print(f"Correção aplicada: {data.get('fix_explanation')}")
                
            except Exception as e:
                print(f"Falha ao interpretar a correção do LLM: {e}")
                
        return {"success": False}
