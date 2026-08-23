const fs = require('fs');
let content = fs.readFileSync('src/pages/Shop.tsx', 'utf8');

content = content.replace(
  '<img src="https://logospng.org/download/pix/logo-pix-1024.png" alt="Pix" className="h-8 object-contain" />',
  '<img src="https://logospng.org/download/pix/logo-pix-1024.png" alt="Pix" className="h-12 w-auto object-contain scale-110" />'
);

content = content.replace(
  '<img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" alt="Mercado Pago" className="h-8 object-contain" />',
  '<img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" alt="Mercado Pago" className="h-8 w-auto object-contain" />'
);

fs.writeFileSync('src/pages/Shop.tsx', content);
