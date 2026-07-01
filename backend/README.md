# SheTech Backend

Esta pasta contém um backend seguro em Python para fazer login e cadastro via Supabase sem expor chaves no frontend.

## Como usar

1. Crie um ambiente Python e instale dependências:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

2. Copie o arquivo de exemplo e defina as variáveis de ambiente:

```bash
copy ..\.env.example ..\.env
```

3. Inicie o servidor:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

4. Abra o frontend em um servidor local (não `file://`) e use as páginas de login/cadastro normalmente.

## Nota de segurança

- A chave Supabase fica no backend e não é exposta no navegador.
- O frontend apenas faz chamadas HTTP aos endpoints `/api/login` e `/api/register`.
- Ajuste o backend para usar uma `SERVICE_ROLE_KEY` quando disponível para maior segurança.
