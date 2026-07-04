# Melhoria do Perfil de Usuário

## O que mudou

O perfil de usuário foi completamente reestruturado com base na referência visual fornecida, mantendo o mesmo layout geral (sidebar + hero + conteúdo em 2 colunas).

## Novos campos adicionados

| Campo | Tipo | Descrição |
|---|---|---|
| `formacao` | TEXT | Formação acadêmica ou profissional |
| `localizacao` | TEXT | Localização geográfica |
| `tipo_membro` | TEXT | Tipo de membro (free/premium) |
| `interesses` | JSONB[] | Lista de interesses (UI/UX, Dev Web, Branding, etc.) |
| `disponivel_para` | JSONB[] | Lista de disponibilidade (Networking, Freelance, Mentoria, Contratação) |
| `behance` | TEXT | URL do perfil Behance |

## Estrutura do perfil

### Barra de progresso
- Calcula automaticamente a completude do perfil (0-100%)
- Mostra CTA "Complete seu perfil" quando < 100%

### Coluna esquerda (sidebar do perfil)
- **Sobre você** — texto detalhado sobre a pessoa
- **Área de atuação** — com ícone de maleta
- **Formação** — com ícone de diploma
- **Localização** — com ícone de pin
- **Membro desde** — com ícone de calendário
- **Tipo de membro** — badge Free/Premium com ícone
- **Habilidades** — tags com as tecnologias
- **Redes e portfólio** — GitHub, LinkedIn, Instagram, Behance, Portfólio

### Coluna direita
- **Interesses** — lista com checkboxes visuais
- **Disponível para** — lista com ícones

## Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `perfil.html` | Reestruturado com todas as novas seções |
| `perfil.js` | Adicionadas funções de renderização + barra de progresso |
| `editar-perfil.html` | Novos campos: formação, localização, tipo membro, interesses, disponível para, behance |
| `editar-perfil.js` | Carregamento e salvamento dos novos campos |
| `supabase.js` | `buildUserProfile()` atualizado para incluir os 6 novos campos |
| `schema SQL` | Colunas adicionadas na tabela `users` |
| `migração SQL` | Script incremental `20260704000000_add_profile_fields.sql` criado |

## Instruções de deploy

1. **No Supabase SQL Editor**, execute o arquivo `supabase/migrations/20260704000000_add_profile_fields.sql` para adicionar as novas colunas.
   - Ou use o `supabase_setup.sql` completo se for uma instalação nova.
2. **Substitua os arquivos** no seu projeto pelos arquivos atualizados da pasta ZIP.
3. **Não é necessário** rodar nenhum outro comando ou alterar configurações.
