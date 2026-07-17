import os
import shutil

def setup_project_dir(base_path: str, project_name: str) -> str:
    """
    Cria uma pasta para o projeto. Se já existir, limpa ela.
    """
    # Usa um caminho absoluto ou relativo a partir de onde o app rodar
    full_path = os.path.abspath(os.path.join(base_path, project_name))
    
    if not os.path.exists(full_path):
        os.makedirs(full_path)
    return full_path

def save_code_file(project_dir: str, filename: str, content: str):
    """
    Salva um conteúdo de código em um arquivo dentro da pasta do projeto.
    """
    file_path = os.path.join(project_dir, filename)
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    return file_path
