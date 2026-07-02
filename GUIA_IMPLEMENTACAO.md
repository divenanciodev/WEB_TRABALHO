# Guia de Implementação — SheTech Membros e Perfis

## 🚀 Início Rápido

Todas as correções já foram aplicadas ao código. Agora você precisa:

1. **Fazer push das mudanças para o GitHub**
2. **Testar localmente ou no Vercel**
3. **Executar o script SQL no Supabase (se ainda não fez)**

---

## 📦 Arquivos Corrigidos

| Arquivo | O que foi corrigido |
|---------|-------------------|
| `js/comunidade.js` | ✅ Membros carregam do Supabase, perfil completo ao clicar |
| `js/perfil.js` | ✅ Exibe perfil completo com todos os campos |
| `js/dashboard.js` | ✅ Sincroniza perfil, conta membros do Supabase |
| `js/editar-perfil.js` | ✅ Sincroniza todos os campos com Supabase |
| `js/app.js` | ✅ Dados globais, contagem de conexões online |
| `CORRECOES_MEMBROS_PERFIS.md` | ✅ Documentação completa das mudanças |

---

## 🔧 Passo 1: Configurar Supabase

### Se você JÁ executou o script `supabase_setup.sql`:
✅ Pule para o Passo 2

### Se você AINDA NÃO executou:

1. Abra o [painel do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor** (lado esquerdo)
4. Clique em **New Query**
5. Cole o conteúdo do arquivo `supabase_setup.sql`
6. Clique em **Run** (ou Ctrl+Enter)

O script vai:
- ✅ Criar tabela `users` com todos os campos
- ✅ Habilitar RLS (segurança)
- ✅ Criar políticas para leitura global
- ✅ Criar políticas para inserção/atualização do próprio perfil

---

## 🧪 Passo 2: Testar Localmente

### Teste 1: Membros Aparecem

1. **Abra a aplicação** em `http://localhost:3000` (ou seu servidor local)
2. **Crie 2 contas diferentes**:
   - Conta 1: `usuario1@email.com` / `senha123`
   - Conta 2: `usuario2@email.com` / `senha123`
3. **Faça login com Conta 1**
4. **Vá para Comunidade > Membros**
5. ✅ Você deve ver:
   - Sua própria conta
   - A Conta 2 (se ela fez login pelo menos uma vez)

**Se não aparecer:**
- Verifique o console (F12 > Console) para erros
- Certifique-se de que o Supabase está configurado em `js/supabase.js`
- Verifique se a tabela `users` foi criada no Supabase

---

### Teste 2: Perfil de Terceiro

1. **Na página de Membros**, clique em um membro
2. ✅ Você deve ver:
   - Nome completo
   - Nome de usuário (@usuario)
   - Bio/Biografia
   - Habilidades (se adicionadas)
   - Links sociais (GitHub, LinkedIn, Instagram, Portfólio)
   - Estatísticas (projetos, eventos)
   - Botão "Seguir"

**Se não aparecer:**
- Verifique se o localStorage está salvando `visitingUser`
- Abra F12 > Application > Local Storage e procure por `visitingUser`
- Verifique se todos os campos estão sendo passados corretamente

---

### Teste 3: Edição de Perfil

1. **Faça login com uma conta**
2. **Vá para Perfil > Editar Perfil**
3. **Adicione informações**:
   - Bio: "Desenvolvedora Full Stack"
   - Habilidades: "React, Node.js, Python"
   - GitHub: "https://github.com/seu-usuario"
   - LinkedIn: "https://linkedin.com/in/seu-usuario"
4. **Clique em Salvar**
5. **Faça logout**
6. **Faça login com outra conta**
7. **Vá para Comunidade > Membros**
8. **Clique na primeira conta**
9. ✅ Você deve ver todas as informações que adicionou

**Se não aparecer:**
- Verifique o console para erros de sincronização
- Certifique-se de que o Supabase está respondendo
- Verifique se a política RLS permite leitura

---

### Teste 4: Contagem de Conexões

1. **Crie 3+ contas e faça login com cada uma**
2. **Vá para Dashboard**
3. **Verifique o card "Conexões"**
4. ✅ Deve mostrar o número total de membros (ex: 3, 4, 5...)
5. ❌ NÃO deve mostrar "2" ou "0"

**Se mostrar 0:**
- Verifique se `updateMembersCountFromSupabase()` está sendo chamado
- Verifique se a tabela `users` tem registros
- Abra F12 > Network e veja se a query ao Supabase está retornando dados

---

## 🚀 Passo 3: Deploy no Vercel

1. **Faça push das mudanças para GitHub**:
   ```bash
   git add -A
   git commit -m "Correções: membros aparecem, perfis visíveis"
   git push origin main
   ```

2. **O Vercel vai fazer deploy automaticamente**

3. **Teste no Vercel**:
   - Abra sua URL do Vercel
   - Repita os testes 1-4 acima

---

## 🐛 Troubleshooting

### Problema: Membros não aparecem

**Causa possível 1**: Supabase não está configurado
- ✅ Verifique `js/supabase.js`
- ✅ Confirme que `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos

**Causa possível 2**: Tabela `users` não foi criada
- ✅ Execute o script `supabase_setup.sql`

**Causa possível 3**: RLS está bloqueando leitura
- ✅ Verifique as políticas no Supabase
- ✅ Certifique-se de que existe a política "Qualquer usuário autenticado pode ler todos os perfis"

**Causa possível 4**: Usuários não foram sincronizados
- ✅ Faça login novamente com cada conta
- ✅ Verifique se `syncUserToSupabase()` está sendo chamado

---

### Problema: Perfil de terceiro está vazio

**Causa possível 1**: `visitingUser` não está sendo salvo
- ✅ Abra F12 > Application > Local Storage
- ✅ Procure por `visitingUser`
- ✅ Se não existir, há um erro em `viewProfile()`

**Causa possível 2**: Campos estão com nomes diferentes
- ✅ Verifique se o Supabase tem `bio` ou `biografia`
- ✅ O código trata ambos, mas certifique-se de que um deles existe

**Causa possível 3**: Perfil.html não está lendo `visitingUser`
- ✅ Verifique se `perfil.js` está carregando `localStorage.getItem('visitingUser')`

---

### Problema: Contagem de conexões mostra 0

**Causa possível 1**: `updateMembersCountFromSupabase()` não está sendo chamado
- ✅ Verifique se está no `DOMContentLoaded` de `dashboard.js`

**Causa possível 2**: Query ao Supabase está falhando
- ✅ Abra F12 > Network
- ✅ Procure por requisições para `users`
- ✅ Verifique se há erro 403 (RLS) ou outro erro

**Causa possível 3**: Tabela `users` está vazia
- ✅ Faça login com uma conta
- ✅ Verifique se a sincronização foi bem-sucedida
- ✅ No Supabase, vá em **Table Editor** > **users** e veja se há registros

---

## 📊 Checklist de Verificação

Antes de considerar tudo pronto:

- [ ] Tabela `users` foi criada no Supabase
- [ ] Script `supabase_setup.sql` foi executado
- [ ] Políticas RLS estão configuradas
- [ ] 2+ contas foram criadas
- [ ] Cada conta fez login pelo menos uma vez
- [ ] Membros aparecem na página de Comunidade
- [ ] Perfil de terceiro exibe todos os campos
- [ ] Edição de perfil sincroniza com Supabase
- [ ] Contagem de conexões mostra número correto
- [ ] Não há erros no console (F12)
- [ ] Tudo funciona no Vercel (ou seu servidor)

---

## 💡 Dicas Importantes

### 1. Limpar Cache
Se algo não funcionar, tente:
```
Ctrl+Shift+Delete (Windows/Linux)
Cmd+Shift+Delete (Mac)
```

### 2. Verificar Console
Sempre abra F12 > Console para ver mensagens de erro:
```
[Comunidade] Não foi possível buscar membros do Supabase: ...
[Dashboard] Erro ao sincronizar perfil: ...
```

### 3. Verificar Network
Abra F12 > Network e procure por requisições para `supabase.co`:
- Status 200 = OK
- Status 403 = Erro de RLS
- Status 500 = Erro no servidor

### 4. Verificar localStorage
Abra F12 > Application > Local Storage:
- `currentUser` = dados do usuário logado
- `users` = lista de todos os usuários
- `visitingUser` = dados do perfil sendo visualizado

---

## 🎯 Próximas Melhorias

Depois que tudo estiver funcionando, você pode:

1. **Sistema de Seguir**: Implementar "seguir" usuários
2. **Notificações**: Notificar quando alguém visita seu perfil
3. **Busca Avançada**: Filtrar por habilidades, área, etc.
4. **Recomendações**: Sugerir membros por interesses comuns
5. **Online Status**: Rastrear quem está online em tempo real

---

## 📞 Precisa de Ajuda?

1. **Verifique o console** (F12 > Console)
2. **Verifique o Network** (F12 > Network)
3. **Verifique o localStorage** (F12 > Application)
4. **Leia o arquivo `CORRECOES_MEMBROS_PERFIS.md`** para mais detalhes

---

**Versão:** 1.0  
**Data:** 02 de Julho de 2026  
**Autor:** Manus AI
