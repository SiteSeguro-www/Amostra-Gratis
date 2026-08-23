const fs = require('fs');
let content = fs.readFileSync('src/pages/Shop.tsx', 'utf8');

content = content.replace(
  'const data = await response.json();',
  `const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Non-JSON response:", text);
        throw new Error("Erro no servidor: " + text.substring(0, 50));
      }`
);

content = content.replace(
  `      console.error('Error buying coins:', error);
      setModal({
        show: true,
        type: 'error',
        title: 'Erro de Conexão',
        message: 'Erro ao conectar com Mercado Pago.'
      });`,
  `      console.error('Error buying coins:', error);
      setModal({
        show: true,
        type: 'error',
        title: 'Erro de Conexão',
        message: error.message || 'Erro ao conectar com Mercado Pago.'
      });`
);

fs.writeFileSync('src/pages/Shop.tsx', content);
