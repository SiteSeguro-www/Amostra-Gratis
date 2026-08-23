const fs = require('fs');
let content = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');

content = content.replace(
  '<img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" alt="Mercado Pago" className="h-4" />',
  '<img src="https://logodownload.org/wp-content/uploads/2019/06/mercado-pago-logo.png" alt="Mercado Pago" className="h-6 w-auto object-contain" />'
);

content = content.replace(
  '<img src="https://logospng.org/download/pix/logo-pix-1024.png" alt="PIX" className="h-4" />',
  '<img src="https://logospng.org/download/pix/logo-pix-1024.png" alt="PIX" className="h-8 w-auto object-contain scale-125" />'
);

fs.writeFileSync('src/pages/Checkout.tsx', content);
