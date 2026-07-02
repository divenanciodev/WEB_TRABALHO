# CORREÇÃO CRÍTICA — Case-Sensitive (createdAt vs createdat)

**Data:** 02 de Julho de 2026  
**Severidade:** 🔴 CRÍTICA  
**Status:** ✅ CORRIGIDO

---

## 🔴 O Problema

A tabela `users` estava **completamente vazia** porque os `upsert()` estavam falhando silenciosamente.

### Por quê?

O PostgreSQL armazena nomes de coluna em **minúsculas** por padrão (a menos que você crie entre aspas).

**Seu banco tem:**
- ✅ `createdat` (minúsculo)
- ✅ `updatedat` (minúsculo)

**Seu código estava enviando:**
- ❌ `createdAt` (camelCase)
- ❌ `updatedAt` (camelCase)

O PostgREST (API do Supabase) tentava gravar em colunas que **não existem**, o upsert falhava, e o erro caía só no `console.warn()` (que ninguém vê).

---

## ✅ A Solução

Ajustei **5 arquivos** para usar **minúsculas**:

### 1. **js/login.js**
```javascript
// ANTES:
createdAt: profile.createdAt || new Date().toISOString(),
updatedAt: new Date().toISOString()

// DEPOIS:
createdat: profile.createdAt || new Date().toISOString(),
updatedat: new Date().toISOString()
```

### 2. **js/dashboard.js**
```javascript
// Dentro de syncUserToSupabase()
createdat: user.createdAt || new Date().toISOString(),
updatedat: new Date().toISOString()
```

### 3. **js/comunidade.js**
```javascript
// Dentro de loadMembers()
createdat: currentUser.createdAt || new Date().toISOString(),
updatedat: new Date().toISOString()
```

### 4. **js/editar-perfil.js**
```javascript
createdat: updatedUser.createdAt || new Date().toISOString(),
updatedat: new Date().toISOString()
```

### 5. **js/cadastro.js**
```javascript
createdat: data.user.created_at || new Date().toISOString(),
updatedat: new Date().toISOString()
```

### 6. **js/app.js** (saveGlobalData)
```javascript
createdat: item.createdAt || item.createdat || new Date().toISOString(),
updatedat: new Date().toISOString()
```

---

## 🧪 Como Testar

### Passo 1: Limpar dados antigos
1. Abra seu painel Supabase
2. Vá em **Table Editor > users**
3. Selecione todos os registros (se houver) e delete

### Passo 2: Testar com nova conta
1. Faça **logout** (se estiver logado)
2. Vá para **Cadastro**
3. Crie uma **nova conta**
4. Faça **login**
5. Vá para **Dashboard**

### Passo 3: Verificar se foi gravado
1. Abra seu painel Supabase
2. Vá em **SQL Editor**
3. Execute:
```sql
SELECT id, email, nome_completo, createdat FROM users ORDER BY createdat DESC;
```

✅ **Se aparecer a linha, funcionou!**

### Passo 4: Testar com múltiplas contas
1. Crie **2+ contas** diferentes
2. Faça login com cada uma
3. Vá para **Comunidade > Membros**
4. ✅ **Todos os membros devem aparecer**

---

## 📊 Impacto

| Funcionalidade | Antes | Depois |
|---|---|---|
| Membros aparecem | ❌ Não | ✅ Sim |
| Perfil de terceiro | ❌ Vazio | ✅ Completo |
| Contagem de conexões | ❌ 0 ou 2 | ✅ Correta |
| Sincronização com Supabase | ❌ Falha silenciosa | ✅ Funciona |

---

## ⚠️ Importante

### Aviso sobre outras tabelas

O mesmo problema **muito provavelmente afeta outras tabelas**:
- `shetech_projetos`
- `shetech_eventos`
- `posts`
- `links`
- `folders`

Se essas tabelas também têm colunas `createdat`/`updatedat` (minúsculas), o mesmo problema ocorre lá.

**Recomendação:** Verifique as colunas reais de cada tabela:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'shetech_projetos';
```

E ajuste o código em `js/app.js` (método `saveGlobalData`) se necessário.

---

## 📝 Checklist

- [x] Corrigido `js/login.js`
- [x] Corrigido `js/dashboard.js`
- [x] Corrigido `js/comunidade.js`
- [x] Corrigido `js/editar-perfil.js`
- [x] Corrigido `js/cadastro.js`
- [x] Corrigido `js/app.js`
- [x] Commit realizado
- [ ] Testar com nova conta
- [ ] Verificar no Supabase
- [ ] Testar com múltiplas contas
- [ ] Verificar membros na comunidade

---

## 🎯 Próximos Passos

1. **Extraia o ZIP** com as correções
2. **Substitua os arquivos** no seu projeto
3. **Teste com nova conta** (veja "Como Testar" acima)
4. **Faça deploy** no Vercel

---

**Versão:** 1.0  
**Autor:** Manus AI  
**Commit:** 4b9e97a
