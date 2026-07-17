import subprocess
import os

def run_robot_code(project_dir: str, main_script: str = "main.py", timeout: int = 60) -> dict:
    """
    Executa o código gerado em um subprocesso e captura o stdout/stderr para teste.
    """
    script_path = os.path.join(project_dir, main_script)
    
    if not os.path.exists(script_path):
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Erro: Arquivo {main_script} não encontrado na pasta {project_dir}.",
            "returncode": -1
        }
    
    try:
        # Roda o script na pasta do projeto
        result = subprocess.run(
            ["python", main_script],
            cwd=project_dir,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode
        }
        
    except subprocess.TimeoutExpired as e:
        return {
            "success": False,
            "stdout": e.stdout.decode('utf-8') if e.stdout else "",
            "stderr": f"Timeout de {timeout}s atingido.",
            "returncode": -1
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "returncode": -1
        }
