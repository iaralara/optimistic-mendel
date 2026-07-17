import json
from utils.llm import get_gemini_model
from utils.file_manager import save_code_file

class DevOpsAgent:
    def __init__(self):
        self.system_instruction = """Você é um Engenheiro DevOps Especialista em Automação Python.
Sua tarefa é criar arquivos de suporte para o projeto: 'requirements.txt' e 'README.md'.
No README, deve haver um tutorial de como instalar (pip install) e rodar o projeto.
Responda EXATAMENTE no formato JSON:
```json
{
  "files": [
    {
      "filename": "requirements.txt",
      "content": "playwright\\n..."
    },
    {
      "filename": "README.md",
      "content": "# Nome do Projeto\\n..."
    }
  ]
}
```"""
        self.model = get_gemini_model(system_instruction=self.system_instruction)

    def generate_project_files(self, spec_data: dict, project_dir: str):
        """
        Gera e salva requirements.txt e README.md.
        """
        prompt = f"Gere os arquivos requirements.txt e README.md baseados nesta especificação:\n{json.dumps(spec_data, ensure_ascii=False)}"
        
        import time
        from google.api_core.exceptions import ResourceExhausted
        
        response = None
        for attempt in range(5):
            try:
                response = self.model.generate_content(prompt)
                break
            except ResourceExhausted as e:
                if attempt < 4:
                    print(f"Limite da API gratuito atingido. Aguardando 65 segundos (Tentativa {attempt+1}/5)...")
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
            
            created_files = []
            for file_data in data.get("files", []):
                filename = file_data["filename"]
                content = file_data["content"]
                
                path = save_code_file(project_dir, filename, content)
                created_files.append(path)
                
            return created_files
            
        except Exception as e:
            print(f"Erro no DevOpsAgent: {e}")
            return []
