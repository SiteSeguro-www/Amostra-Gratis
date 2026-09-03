const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const oldPurchaseStatus = /purchase\.status === 'delivered' \|\| purchase\.status === 'completed' \? 'bg-green-500\/20 text-green-400' : 'bg-amber-500\/20 text-amber-400'/;
const newPurchaseStatus = `purchase.status === 'delivered' || purchase.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                              purchase.status === 'completed_by_seller' ? 'bg-purple-500/20 text-purple-400' :
                              purchase.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
                              purchase.status === 'disputed' ? 'bg-red-600/20 text-red-100' :
                              purchase.status === 'refused' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'`;

content = content.replace(oldPurchaseStatus, newPurchaseStatus);

const oldPurchaseText = /\{purchase\.status === 'delivered' \? 'Disponível' : 'Em processamento'\}/;
const newPurchaseText = `{purchase.status === 'delivered' ? 'Disponível' : 
                              purchase.status === 'completed_by_seller' ? 'Aguardando sua confirmação' : 
                              purchase.status === 'accepted' ? 'Em andamento' :
                              purchase.status === 'refused' ? 'Recusado' :
                              purchase.status === 'disputed' ? 'Em Disputa' :
                              'Em processamento'}`;

content = content.replace(oldPurchaseText, newPurchaseText);

fs.writeFileSync('src/pages/Dashboard.tsx', content);
