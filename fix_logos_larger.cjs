const fs = require('fs');

let checkoutContent = fs.readFileSync('src/pages/Checkout.tsx', 'utf8');
checkoutContent = checkoutContent.replace(
  '<img src="https://logospng.org/download/pix/logo-pix-1024.png" alt="PIX" className="h-10 w-auto object-contain scale-150 origin-left" />',
  '<img src="https://logospng.org/download/pix/logo-pix-1024.png" alt="PIX" className="h-10 w-auto object-contain scale-[1.7] origin-center" />'
);
fs.writeFileSync('src/pages/Checkout.tsx', checkoutContent);
