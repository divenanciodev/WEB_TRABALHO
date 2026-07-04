# Correção: Persistência de Foto de Perfil, Capa e Informações

**Data:** 04/07/2026  
**Problema:** Após fazer logout e login novamente, a foto de perfil, foto de capa e demais informações editadas desapareciam.

---

## Causas Raiz Identificadas

### 1. `js/login.js` — Sobrescrita do perfil no login (causa principal)

Após o login bem-sucedido, o código original chamava:

```js
const profile = window.SupabaseAuth.buildUserProfile(data.user);
await State.setCurrentUser(profile);
```

O problema: `buildUserProfile(data.user)` **sem o segundo argumento** (`dbProfile`) constrói o perfil usando apenas o `user_metadata` do Supabase Auth, que **não contém** `foto_perfil`, `capa_perfil` nem outros campos editados. Em seguida, `setCurrentUser` fazia um `upsert` no banco **sobrescrevendo** todos esses campos com strings vazias.

**Correção:** Removida essa chamada. O `signIn` já chama `refreshProfile()` internamente, que busca o perfil completo do banco e atualiza o cache corretamente.

---

### 2. `js/dashboard.js` — Sobrescrita desnecessária ao entrar no dashboard

O código original executava `await State.setCurrentUser(user)` toda vez que o dashboard era carregado, regravando o perfil em cache (que poderia estar incompleto) no banco.

**Correção:** Removida essa chamada desnecessária. O dashboard apenas lê os dados para exibição, não precisa regravá-los.

---

### 3. `js/comunidade.js` — Sobrescrita ao carregar a aba de membros

A função `syncCurrentUserProfile()` chamava `await State.setCurrentUser(user)` toda vez que a aba de membros era aberta, com o mesmo problema de sobrescrita.

**Correção:** A função agora apenas atualiza os ícones visuais na página (`updateAllProfileIcons`), sem regravar no banco.

---

### 4. `js/supabase.js` + `js/editar-perfil.js` — Imagens Base64 muito grandes

Imagens de até 2 MB em Base64 ficam com ~2,7 MB de texto. O Supabase pode silenciosamente falhar ou truncar o `upsert` com payloads tão grandes.

**Correção:**
- Adicionada função `compressImageBase64()` no `supabase.js` que comprime automaticamente imagens maiores que 400 KB antes de salvar no banco.
- Adicionada função `compressImage()` no `editar-perfil.js` que comprime a imagem já no momento do upload (antes mesmo de salvar), com redimensionamento máximo de 800px para avatar e 1200px para capa.
- O limite de upload foi ajustado de 2 MB para 5 MB, já que a compressão garante que o dado salvo no banco será menor.

---

## Arquivos Modificados

| Arquivo | Tipo de Correção |
|---|---|
| `js/login.js` | Removida sobrescrita do perfil após login |
| `js/dashboard.js` | Removida sobrescrita desnecessária do perfil |
| `js/comunidade.js` | Removida sobrescrita do perfil ao carregar membros |
| `js/supabase.js` | Adicionada compressão de imagem antes do upsert + feedback de erro |
| `js/editar-perfil.js` | Adicionada compressão de imagem no upload + botão de salvamento com estado |
| `js/app.js` | Adicionado feedback visual de erro ao salvar perfil |

---

## Como o Fluxo Funciona Agora

1. **Login:** `signIn()` autentica e chama `refreshProfile()`, que busca o perfil completo do banco (incluindo `foto_perfil` e `capa_perfil`) e armazena no cache.
2. **Navegação:** Nenhuma página sobrescreve o perfil no banco ao ser carregada — apenas lê os dados para exibição.
3. **Editar Perfil:** O usuário edita os campos, as imagens são comprimidas no momento do upload, e ao salvar, o `upsertProfile()` grava tudo no banco e atualiza o cache.
4. **Logout/Login:** O `refreshProfile()` no login busca novamente o perfil do banco, garantindo que todos os dados editados estejam presentes.
