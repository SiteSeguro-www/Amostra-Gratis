const fs = require('fs');
let content = fs.readFileSync('copy_reference.txt', 'utf8');

// Replacements
content = content.replace(/SEOArticleVenderFotos/g, 'SEOArticleVenderFotosCorpo');
content = content.replace(/como-vender-fotos-de-pe/g, 'sites-para-vender-fotos-do-corpo');
content = content.replace(/Como Vender Fotos de Pés em 2026 \| Guia Completo PackZinhu/g, 'Sites para Vender Fotos do Corpo: O Guia Completo e Seguro de 2026');
content = content.replace(/Aprenda passo a passo como vender fotos de pés e ganhar dinheiro online com segurança\./g, 'Descubra os melhores sites para vender fotos do corpo, aprenda como ganhar dinheiro online, garantir sua privacidade e faturar alto em 2026.');
content = content.replace(/Como vender fotos de pés online/g, 'Sites para vender fotos do corpo online');
content = content.replace(/Aprenda como começar a vender fotos de pés no PackZinhu\./g, 'Conheça os melhores sites para começar a vender fotos do seu corpo de forma rentável.');
content = content.replace(/O Guia Definitivo para Vender Fotos de Pés em 2026/g, 'Sites para Vender Fotos do Corpo: O Guia Definitivo em 2026');
content = content.replace(/Transforme seus pés em uma máquina de fazer dinheiro/g, 'Transforme seu corpo em uma fonte de renda segura e lucrativa');
content = content.replace(/Por que Vender Fotos de Pés\?/g, 'Por que Vender Fotos do Corpo?');
content = content.replace(/venda de fotos de pés/g, 'venda de fotos do corpo');
content = content.replace(/fetiche por pés/g, 'venda de conteúdos exclusivos');
content = content.replace(/fotos de pés/g, 'fotos do corpo');
content = content.replace(/dos seus pés/g, 'do seu corpo');

fs.writeFileSync('src/pages/SEOArticleVenderFotosCorpo.tsx', content);
