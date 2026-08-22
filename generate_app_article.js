const fs = require('fs');
let content = fs.readFileSync('src/pages/SEOArticleVenderFotosCorpo.tsx', 'utf8');

// Title/Component replacements
content = content.replace(/SEOArticleVenderFotosCorpo/g, 'SEOArticleAppVenderFotosCorpo');
content = content.replace(/sites-para-vender-fotos-do-corpo/g, 'app-para-vender-fotos-do-corpo');
content = content.replace(/Sites para Vender Fotos do Corpo/g, 'App para Vender Fotos do Corpo');
content = content.replace(/sites para vender/gi, 'aplicativos para vender');
content = content.replace(/melhores aplicativos/gi, 'melhores apps');
content = content.replace(/os melhores aplicativos/gi, 'os melhores apps');

// Tweak some specific headings or phrases if they exist
content = content.replace(/Os 5 Melhores Aplicativos/g, 'Os 5 Melhores Apps (Aplicativos)');
content = content.replace(/O Guia Definitivo em 2026/g, 'O Guia Definitivo de Aplicativos em 2026');

fs.writeFileSync('src/pages/SEOArticleAppVenderFotosCorpo.tsx', content);
