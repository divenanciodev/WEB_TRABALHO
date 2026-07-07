# SheTech 🚀

**SheTech** é uma plataforma colaborativa projetada para conectar mulheres e meninas interessadas em tecnologia. O objetivo principal é criar um ecossistema onde as usuárias possam aprender, compartilhar conhecimento, formar equipes e desenvolver projetos inovadores com impacto real.

---

## 1. Problema Identificado 🔍

Apesar do crescimento do setor de tecnologia no Brasil, a diversidade ainda representa um grande desafio. Dados nacionais mostram que 63% dos profissionais de Tecnologia da Informação são homens, evidenciando a sub-representação feminina na área. Essa desigualdade reduz a diversidade de perspectivas na inovação e dificulta o acesso de mulheres a oportunidades de desenvolvimento profissional.

No contexto regional, esse desafio torna-se ainda mais relevante. O município de Grajaú (MA) está inserido em uma região com forte presença de povos indígenas, e o Maranhão figura entre os estados brasileiros com maior população indígena residente em áreas rurais. Embora o Censo demonstre o crescimento dessa população, ela ainda enfrenta barreiras relacionadas ao acesso à educação, inclusão digital e oportunidades no setor tecnológico.

Diante desse cenário, observa-se a necessidade de uma plataforma que promova inclusão, colaboração e desenvolvimento profissional, especialmente para mulheres e jovens que desejam ingressar na área de tecnologia.

**Os principais problemas identificados são:**

* Baixa representatividade feminina no mercado de tecnologia;
* Poucas oportunidades de networking e colaboração entre mulheres interessadas em tecnologia;
* Dificuldade em transformar aprendizado em experiência prática, devido à falta de equipes e projetos colaborativos;
* Necessidade de maior inclusão digital para comunidades historicamente sub-representadas, como mulheres e povos indígenas presentes na região de Grajaú;
* Ausência de um ambiente seguro para compartilhar conhecimento, desenvolver projetos e construir portfólio profissional.

A **SheTech** surge como uma solução para conectar essas pessoas em uma comunidade colaborativa, oferecendo um ambiente para aprendizagem, criação de projetos, participação em eventos e fortalecimento da presença feminina e da diversidade na tecnologia.

---

### Evidências do Cenário Atual 
<div align="center">
  <img src="https://github.com/divenanciodev/web-trabalho-oficial/blob/main/assets/Blue%20Coral%20and%20Peach%20Simple%20Budget%20Pie%20Chart%20Graph.png?raw=true" alt="Descrição da Imagem 1" width="45%">
  
  <img src="https://github.com/divenanciodev/web-trabalho-oficial/blob/main/assets/Blue%20Coral%20and%20Peach%20Simple%20Budget%20Pie%20Chart%20Graph%20(1).png?raw=true" alt="Descrição da Imagem 2" width="45%">
  <p><i>Legenda: Representação visual dos desafios enfrentados por mulheres na tecnologia.</i></p>
</div>

---


## 2. Arquitetura e Tecnologias Utilizadas 🛠️

O projeto utiliza uma stack moderna focada em performance e escalabilidade:

- **Frontend:**
  - **HTML5 & CSS3:** Estrutura e estilização com design responsivo e efeitos de "Glassmorphism".
  - **JavaScript (Vanilla):** Lógica da aplicação e manipulação dinâmica do DOM.
  - **Lucide Icons:** Biblioteca de ícones leves e consistentes.
    
- **Backend & Persistência:**
  - **FastAPI (Python):** API de alto desempenho para gestão de usuários e autenticação.
  - **Supabase:** Backend-as-a-Service (BaaS) utilizado para banco de dados PostgreSQL, autenticação e políticas de segurança (RLS).
    
- **Integrações:**
  - **ViaCEP API:** Automação de endereços para eventos presenciais.
  - **Supabase Realtime:** Atualização instantânea de dados na interface.

  **2.1. Visão Geral da Arquitetura**
  A arquitetura da plataforma SheTech é modular, dividida em três componentes principais: Frontend, Backend e Banco de Dados/BaaS. Esta estrutura permite uma     clara separação de responsabilidades e facilita a manutenção e escalabilidade do sistema.
  <div align="center">

  <img src="https://github.com/divenanciodev/web-trabalho-oficial/blob/main/assets/GRAFICO01.png?raw=true" alt="Grafico da arquitetura" width="45%">
  <p><i>Legenda: Representação visual da arquitetura do sistema. </i></p>
</div>
  <br>
  * O que cada um controla:
  * Frontend (Interface do Usuário): Responsável pela interação direta com a usuária, construído com HTML, CSS e JavaScript..
  * Backend (FastAPI): Atua como a camada de lógica de negócios e comunicação com o banco de dados, além de integrar APIs externas.
  * Banco de Dados/BaaS (Supabase): Gerencia a persistência dos dados, autenticação de usuários e segurança em nível de linha, com capacidades de tempo real.
  <br>
  
  **2.2. Fluxo de Interação do Usuário**
  O fluxo de interação da usuária com a plataforma segue um padrão bem definido, garantindo uma experiência intuitiva e responsiva. Desde o acesso inicial até a     interação com as funcionalidades, o sistema é projetado para ser dinâmico e em tempo real.
  <div align="center">

  <img src="https://github.com/divenanciodev/web-trabalho-oficial/blob/main/assets/imagemfluxo.png?raw=true" alt="Grafico do fluxo do sistema" width="45%">
  <p><i>Legenda: Representação visual do fluxo do sistema. </i></p>
</div>
  O diagrama acima ilustra a sequência de eventos desde o acesso da usuária até a interação com o backend e o banco de dados, destacando a comunicação entre os componentes do sistema.
---

## 3. Demonstração da Aplicação 💻

A plataforma oferece uma experiência completa de rede social técnica:

| Funcionalidade | Descrição |
| :--- | :--- |
| **Dashboard Personalizado** | Visão geral de conexões, projetos ativos e estatísticas da comunidade em tempo real. |
| **Feed da Comunidade** | Espaço para postagens, compartilhamento de links úteis, curtidas e comentários. |
| **Gestão de Projetos** | Listagem de projetos onde as usuárias podem se inscrever ou recrutar colaboradoras. |
| **Eventos e Workshops** | Agenda de eventos (online e presenciais) com sistema de inscrição integrado. |
| **Perfis Detalhados** | Exibição de bio, habilidades técnicas, links sociais (GitHub, LinkedIn) e portfólio. |
| **Sistema de Notificações** | Alertas sobre novas conexões, inscrições em projetos e interações no feed. |

---
## 4. Principais Desafios Encontrados 🧠

Durante o desenvolvimento, os maiores desafios técnicos foram:
1. **Sincronização de Dados em Tempo Real:** Garantir que as atualizações no banco de dados Supabase fossem refletidas instantaneamente em todos os componentes da interface sem recarregar a página.
2. **Segurança e RLS (Row Level Security):** Configurar políticas de segurança no banco de dados para permitir que usuárias visualizem perfis públicos, mas editem apenas suas próprias informações.
3. **Gestão de Estado Sem Frameworks:** Implementar uma lógica de "State Management" em JavaScript puro para coordenar a exibição de dados entre múltiplas páginas HTML independentes.
4. **Otimização de Assets:** Substituição de dependências externas lentas por arquivos locais para garantir um carregamento rápido, especialmente em conexões instáveis.

---

## 5. Possíveis Melhorias Futuras 🔮

O roadmap da SheTech inclui funcionalidades para aumentar o engajamento:

- [ ] **Sistema de "Seguir":** Permitir que usuárias sigam umas às outras para receber atualizações personalizadas no feed.
- [ ] **Busca Avançada:** Filtros inteligentes para encontrar mentoras ou parceiras por habilidades específicas (ex: "React", "Python").
- [ ] **Chat em Tempo Real:** Integração de mensagens diretas para facilitar a comunicação entre equipes de projetos.
- [ ] **Gamificação:** Sistema de badges e conquistas para incentivar a participação ativa e o compartilhamento de conhecimento.
- [ ] **Recomendações por IA:** Sugerir projetos e eventos com base nos interesses e habilidades cadastradas no perfil.
- [ ] **Melhorar as informações no perfil do usuário mais compativeis com um perfil estilo curricular.

---

Desenvolvido com ❤️ pela Comunidade SheTech.
