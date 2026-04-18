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
