# Correções Aplicadas — Problema de Visibilidade de Usuários

## Problema Identificado

Usuários que se cadastravam pelo link do Vercel não apareciam para outros usuários na aba **Comunidade > Membros**. Isso ocorria por três razões:

### 1. Cadastro não salvava na tabela `users` do Supabase corretamente
No fluxo original, o `upsert` na tabela `users` só era executado se `data?.user` existisse. Quando a confirmação de e-mail está ativa no Supabase, o usuário é criado no sistema de autenticação, mas a sessão só é estabelecida após a confirmação — fazendo com que o perfil nunca chegasse à tabela `users`.

### 2. Login não sincronizava o perfil na tabela `users`
Ao fazer login, o código apenas salvava os dados no `localStorage` via `State.setCurrentUser()`, mas **nunca fazia `upsert` na tabela `users` do Supabase**. Mesmo usuários que já haviam confirmado o e-mail não apareciam para os outros.

### 3. Políticas RLS do Supabase impediam a leitura
Se as políticas de Row Level Security (RLS) não estivessem configuradas corretamente, a consulta `SELECT * FROM users` retornava vazio para usuários autenticados.

---

## Arquivos Corrigidos

| Arquivo | O que foi corrigido |
|---|---|
| `js/cadastro.js` | Agora salva o perfil na tabela `users` do Supabase logo após o cadastro, mesmo antes da confirmação de e-mail |
| `js/login.js` | Agora faz `upsert` do perfil na tabela `users` do Supabase a cada login bem-sucedido |
| `js/comunidade.js` | Agora sincroniza o perfil do usuário logado antes de buscar a lista de membros; aumentou o limite de 100 para 200 membros |
| `js/editar-perfil.js` | Melhorado o `upsert` com `onConflict: 'id'` e adição do campo `updatedAt` |
| `js/dashboard.js` | Adicionada sincronização do perfil no Supabase ao carregar o dashboard; contagem de membros agora vem do Supabase |

---

## Configuração Necessária no Supabase

### Passo 1 — Executar o script SQL

1. Acesse o [painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole e execute o conteúdo do arquivo `supabase_setup.sql`

Esse script:
- Cria a tabela `users` com todos os campos necessários
- Habilita RLS (Row Level Security)
- Cria as políticas corretas para que usuários autenticados possam **ler todos os perfis** e **inserir/atualizar o próprio perfil**

### Passo 2 — Verificar confirmação de e-mail (opcional)

Se quiser que usuários possam fazer login imediatamente após o cadastro (sem precisar confirmar o e-mail):

1. No painel do Supabase, vá em **Authentication > Settings**
2. Desative a opção **"Confirm email"**

> **Atenção:** Desativar a confirmação de e-mail é recomendado apenas para ambientes de teste. Em produção, mantenha ativado para segurança.

### Passo 3 — Verificar as variáveis no Vercel

Certifique-se de que as variáveis de ambiente estão configuradas no Vercel:

- Não há variáveis de ambiente necessárias para o frontend, pois a URL e a chave anônima do Supabase estão diretamente no arquivo `js/supabase.js`.

---

## Como Funciona Agora

```
Usuário se cadastra
       ↓
Supabase Auth cria o usuário
       ↓
Perfil é salvo na tabela 'users' (NOVO)
       ↓
Usuário confirma e-mail (se ativado)
       ↓
Usuário faz login
       ↓
Perfil é sincronizado na tabela 'users' (NOVO)
       ↓
Usuário acessa o Dashboard
       ↓
Perfil é sincronizado novamente (NOVO — garante dados atualizados)
       ↓
Qualquer usuário acessa Comunidade > Membros
       ↓
Perfil aparece na lista ✅
```

---

## Observação sobre Usuários Já Cadastrados

Usuários que se cadastraram **antes** dessas correções precisarão fazer **login uma vez** para que seus perfis sejam sincronizados na tabela `users` do Supabase e passem a aparecer para os outros membros.
