# Otimizações de Desempenho — SheTech (WEB_TRABALHO)

Este documento registra as correções aplicadas para resolver a lentidão de carregamento do sistema.

## Problema diagnosticado

O sistema dependia de vários recursos externos (CDNs) que estavam lentos, intermitentes ou quebrados:

| Recurso | Problema | Impacto |
|---|---|---|
| Fonte de ícones `lucide.woff` (jsDelivr) | Download de até **~19 s** | Trava principal |
| CSS `icon-static@...` (index, login, cadastro) | Pacote inexistente → **404** | Ícones quebrados + espera |
| CSS `lucide-static@0.456.0` (jsDelivr) | **503** intermitente | Falhas aleatórias |
| Script `unpkg.com/lucide@latest` | 401 KB por página | Requisição pesada |
| Avatares `i.pravatar.cc` (16x) | ~2,5 s cada | Travamento de perfil/comunidade |
| Fallback `ui-avatars.com` | Serviço externo | Espera de rede |
| Imagens PNG (logo 412 KB, destaque 248 KB) | Não otimizadas | Transferência grande |

## Correções aplicadas

1. **Ícones internalizados**: CSS + fontes (`woff2`/`woff`/`ttf`) do lucide baixados para `vendor/lucide/`.
2. **Script lucide local**: `vendor/lucide/lucide.min.js` (dashboard).
3. **Fontes do Google internalizadas**: Sora e Inter baixadas para `vendor/fonts/` com `font-display: swap`.
4. **Avatares locais**: todas as imagens externas (`pravatar.cc` e `ui-avatars.com`) substituídas por `assets/avatars/avatar.svg`.
5. **Imagens otimizadas**: logo 412 KB → 64 KB; destaque 248 KB → 56 KB (~85% menor).
6. **`preconnect` externos removidos**.

## Resultado

| Métrica | Antes | Depois |
|---|---|---|
| Recursos externos | vários (404/503/lentos) | **0** |
| Pior recurso | ~19.000 ms (fonte) | ~35 ms (local) |
| DOMContentLoaded (comunidade) | dependente de rede | **~69 ms** |
| Load completo (comunidade) | dependente de rede | **~83 ms** |

O sistema agora carrega de forma totalmente local, sem qualquer espera por CDNs externos.
