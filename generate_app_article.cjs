const fs = require('fs');
let content = fs.readFileSync('src/pages/SEOArticleVenderFotosCorpo.tsx', 'utf8');

// Title/Component replacements
content = content.replace(/SEOArticleVenderFotosCorpo/g, 'SEOArticleAppVenderFotosCorpo');
content = content.replace(/sites-para-vender-fotos-do-corpo/g, 'app-para-vender-fotos-do-corpo');
content = content.replace(/Sites para Vender Fotos do Corpo/g, 'App para Vender Fotos do Corpo');
content = content.replace(/Sites para vender/g, 'App para vender');
content = content.replace(/sites para vender/gi, 'apps para vender');
content = content.replace(/melhores sites/gi, 'melhores apps');
content = content.replace(/plataformas/gi, 'aplicativos');

fs.writeFileSync('src/pages/SEOArticleAppVenderFotosCorpo.tsx', content);
