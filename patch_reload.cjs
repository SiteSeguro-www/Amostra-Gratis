const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

content = content.replace(
  "alert('Entrega confirmada! O saldo foi liberado para o vendedor.');",
  "alert('Entrega confirmada! O saldo foi liberado para o vendedor.');\n      window.location.reload();"
);

content = content.replace(
  "alert(successMsg);",
  "alert(successMsg);\n      window.location.reload();"
);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
