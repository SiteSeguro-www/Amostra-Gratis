# Instruções de Desenvolvimento

- **Funcionalidade Total:** Sempre que criar uma nova função e um botão para essa função, garanta que tudo esteja 100% funcional. Botões não devem ser apenas visuais; eles devem executar a lógica pretendida imediatamente.
- **Sem Placeholders:** Evite usar "alert('Funcionalidade em breve')" ou botões que não disparam ações reais. Implemente a lógica de backend (API) e frontend necessária para que o recurso funcione de ponta a ponta.
- **Estilo Visual:** Mantenha o padrão de design Neon/Dark da plataforma, utilizando as cores e componentes já estabelecidos.
- **Padrão de Checkout Seguro:** Sempre que houver mudanças no layout do checkout, adote obrigatoriamente o padrão "Checkout Seguro" (conforme imagem de referência):
  - **Layout:** Duas colunas (desktop).
  - **Coluna Esquerda:** Detalhes do produto (imagem, título, vendedor, verificado, subtotal, taxa, total).
  - **Coluna Direita:** Seleção de método de pagamento (PIX/Cartão) com cards destacados, botão grande de gradiente "Pagar com Mercado Pago".
  - **Rodapé:** Cards de "Garantia" e "Segurança" no canto inferior esquerdo.
  - **Estilo:** Bordas arredondadas pronunciadas (`rounded-[2.5rem]`), tema escuro, tipografia bold e limpa.
- **Identidade PackZinhu (YouTube Style):** O site deve manter o layout inspirado na home do YouTube:
  - Header fixo com busca central e ícones de ação.
  - Barra de categorias horizontal logo abaixo do header.
  - Grid de serviços estilo miniaturas de vídeo com informações claras de vendedor e preço.
  - Tema escuro unificado (#0f0f0f).
- **Sitemap Sempre Atualizado:** Sempre que uma nova página (rota) for criada no `App.tsx`, adicione-a imediatamente ao arquivo `/public/sitemap.xml` com a data atual e prioridade adequada.

## 🔥 DIRETRIZ DE BLINDAGEM MÁXIMA PARA PRODUÇÃO 🔥

**ATENÇÃO CRÍTICA: O SITE ESTÁ ONLINE COM USUÁRIOS REAIS E ATIVOS EM TEMPO REAL NESTE MOMENTO.**
- **NENHUMA INTERRUPÇÃO TOLERADA:** Sob nenhuma circunstância uma alteração pode quebrar aplicações globais, fluxos de login, ou sistema de vendas.
- **RREGRA DE PRESERVAÇÃO:** Antes de editar qualquer código, avalie o impacto. NÃO faça refatorações de grande escala. FAÇA EDITS CIRÚRGICOS e adiciones apenas o estritamente necessário.
- **PREVENÇÃO DE FALHA EM CASCATA:** Nunca remova tratamentos de erro existentes, nunca remova dependências ou comentários importantes, e não sobreescreva funcionalidades que já estão em uso. Use `setDoc(..., { merge: true })` em vez de reescrever documentos inteiros. Use backups mentais da estrutura ou confira duas vezes sempre que rodar um regex ou edição em massa.

## Proteção de Código e Layout Oficial (MUITO IMPORTANTE)

- **SITE EM PRODUÇÃO (EXTREMO CUIDADO):** O site já está publicado e possui usuários ativos. Tenha o **máximo de cuidado** ao fazer qualquer alteração para não quebrar o site inteiro. Modifique as coisas em passos pequenos e seguros.
- **Congelamento de Layout:** O layout de todas as páginas construídas até agora é a **versão oficial** do `packzinhu.online`. É ESTRITAMENTE PROIBIDO alterar, redesenhar ou modificar o visual, a navegação ou o CSS de arquivos já existentes, a menos que o usuário exija isso com instruções diretas e explícitas no chat.
- **Prevenção de Bugs ("Amnésia" do Bot):** Quando sessões são reiniciadas ou o limite de cota voltar, assuma de forma absoluta que o código base e a interface já estão corretos e aprovados. **NUNCA** reescreva componentes só para "melhorar o código" internamente. Limite suas edições *cirurgicamente* apenas aos arquivos afetados por onde a nova dúvida ou problema está, não modifique lógicas que o usuário não pediu.
- **Proteção Total de Pagamentos:** O sistema de checkout, Mercado Pago, Webhooks, liberação de saldo e configurações de banco/PIX está 100% funcional. É terminantemente PROIBIDO alterar qualquer lógica nesses módulos (especialmente no `server.ts`, `Checkout.tsx` e `config.ts`) a menos que haja um pedido explícito e direto para mudança de funcionalidade de pagamento.

## MinIO Configuration (Golden State)
A configuração abaixo é a funcional para https://packzinhu.online e o ambiente de desenvolvimento. NUNCA altere estes valores a menos que solicitado.

- **Endpoint:** `https://minio.packzinhu.online`
- **Bucket:** `packzinhu-db`
- **Port:** `443`
- **Use SSL:** `true`
- **Region:** `us-east-1`
- **Access Key:** `(definido no .env)`
- **Secret Key:** `(definido no .env)`
- **Force Path Style:** `true`

## Ambientes e Domínio Próprio (Prioridade Total)

Tudo que for desenvolvido, ajustado ou configurado pelo agente **DEVE REFLETIR E FUNCIONAR PERFEITAMENTE NO DOMÍNIO PRINCIPAL `https://packzinhu.online/`**.
- O domínio principal é a prioridade absoluta. O ambiente de desenvolvimento (`https://ais-dev...`) serve apenas para originarmos e validarmos as mudanças, mas o código não pode ter amarras (ex: URLs hardcoded) que quebrem na produção oficial.
- Sempre que for necessário o uso de domínios ou URLs em configs (como webhooks, endpoints ou callbacks), o agente deve focar na compatibilidade para `https://packzinhu.online`.
