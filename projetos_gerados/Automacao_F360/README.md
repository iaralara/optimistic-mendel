# Projeto: Automacao_F360

Este projeto Python utiliza a biblioteca Playwright para automatizar o acesso e interações no site `financas.f360.com.br`.

## Objetivo da Automação

O objetivo desta automação é:
1. Acessar `financas.f360.com.br`.
2. Realizar o login com as credenciais fornecidas.
3. Navegar até a seção "Conta Movimento".
4. Selecionar a conta "Santander - 13002454-7".
5. Filtrar o período para o início do mês vigente até o dia atual.
6. Aplicar o filtro "Dep Dinheiro".
7. Clicar em "Fechamento de Caixa".

## Pré-requisitos

Certifique-se de ter o Python 3.8+ instalado em seu sistema.

## Configuração do Projeto

Siga os passos abaixo para configurar e executar o projeto:

1. **Clone o repositório (ou crie os arquivos manualmente):**
   ```bash
   git clone <url_do_seu_repositorio>
   cd Automacao_F360
   ```
   Se você recebeu os arquivos diretamente, crie a estrutura de pastas `src/` e `tests/` e coloque os arquivos nos seus respectivos lugares.

2. **Crie e ative um ambiente virtual (recomendado):**
   ```bash
   python -m venv venv
   # No Windows
   .\venv\Scripts\activate
   # No macOS/Linux
   source venv/bin/activate
   ```

3. **Instale as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Instale os drivers do Playwright:**
   ```bash
   playwright install
   ```

## Credenciais

**ATENÇÃO:** As credenciais de login (`grupovffinanceiro4@gmail.com` e `senha@95`) estão **HARDCODED** diretamente no arquivo `src/main.py` para facilitar a execução local, conforme instrução. Para ambientes de produção, é **ALTAMENTE RECOMENDADO** usar variáveis de ambiente ou um sistema de gerenciamento de segredos para proteger informações sensíveis.

## Executando a Automação

Para executar o script de automação, certifique-se de que seu ambiente virtual esteja ativado e execute:

```bash
python src/main.py
```

O navegador será iniciado em modo visível (`headless=False`), permitindo que você observe o robô em ação. Os logs de progresso e possíveis erros serão exibidos no terminal.

## Executando os Testes

Para executar os testes unitários (ou de integração básicos), certifique-se de que seu ambiente virtual esteja ativado e execute:

```bash
pytest tests/
```

Os testes verificarão se o Playwright está configurado corretamente e se a página inicial do F360 pode ser acessada.

---

**Notas:**
- O script utiliza seletores baseados em texto e placeholders, que são mais robustos contra mudanças pequenas na estrutura HTML, mas dependem do texto visível na interface.
- Qualquer alteração na interface do usuário do site F360 pode exigir ajustes nos seletores dentro de `src/main.py`.