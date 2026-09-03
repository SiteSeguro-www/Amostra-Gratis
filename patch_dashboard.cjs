const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace the sale actions part
const saleActionRegex = /<div className="flex flex-col items-center md:items-end gap-3 min-w-\[150px\]">[\s\S]*?<\/div>/g;
let saleMatchCount = 0;
content = content.replace(saleActionRegex, (match) => {
  saleMatchCount++;
  if (saleMatchCount === 1) {
    // Only replace the first one which is inside the sales map
    return `<div className="flex flex-col items-center md:items-end gap-3 min-w-[200px]">
      <span className={\`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest \${
        sale.status === 'delivered' || sale.status === 'completed' ? 'bg-green-500/20 text-green-400' :
        sale.status === 'accepted' ? 'bg-blue-500/20 text-blue-400' :
        sale.status === 'completed_by_seller' ? 'bg-purple-500/20 text-purple-400' :
        sale.status === 'refused' ? 'bg-red-500/20 text-red-400' :
        sale.status === 'disputed' ? 'bg-red-600/20 text-red-100' :
        sale.status === 'paid' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-gray-400'
      }\`}>
        {sale.status === 'delivered' ? 'Entregue (Saldo Liberado)' : 
         sale.status === 'completed' ? 'Concluído' : 
         sale.status === 'accepted' ? 'Aceito (Em andamento)' :
         sale.status === 'completed_by_seller' ? 'Aguardando Cliente' :
         sale.status === 'refused' ? 'Recusado' :
         sale.status === 'disputed' ? 'Em Disputa' :
         sale.status === 'paid' ? 'Novo Pedido (Pago)' : 'Pendente'}
      </span>
      <div className="flex flex-wrap justify-end gap-2 mt-2">
        {sale.status === 'paid' && (
          <>
            <button onClick={() => handleAcceptOrder(sale)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black rounded-xl uppercase transition-all">
              Aceitar
            </button>
            <button onClick={() => handleRefuseOrder(sale)} className="px-4 py-2 bg-red-600/20 hover:bg-red-500/40 text-red-500 text-[10px] font-black rounded-xl uppercase transition-all">
              Recusar
            </button>
          </>
        )}
        {sale.status === 'accepted' && (
          <button onClick={() => handleMarkAsDelivered(sale)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black rounded-xl uppercase transition-all">
            Marcar como Entregue
          </button>
        )}
        <Link 
          to={\`/chat/\${sale.buyerId || sale.buyer_id}\`}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black rounded-xl border border-white/10 transition-all uppercase"
        >
          Detalhes / Chat
        </Link>
      </div>
    </div>`;
  }
  return match;
});

// Now replace the purchase actions part
const purchaseActionRegex = /<div className="flex gap-2">[\s\S]*?<\/div>\s*<\/div>\s*\)\)\s*\)\}/g;
let purchaseMatchCount = 0;
content = content.replace(purchaseActionRegex, (match) => {
  purchaseMatchCount++;
  if (purchaseMatchCount === 1) {
    return `<div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <Link 
          to={\`/chat/\${purchase.sellerId || purchase.seller_id}\`}
          className="px-6 py-4 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-2xl transition-all shadow-xl shadow-purple-600/20 uppercase"
        >
          Acessar Chat
        </Link>
        {purchase.status === 'completed_by_seller' && (
          <button 
            onClick={() => handleConfirmDelivery(purchase)}
            className="px-6 py-4 bg-green-600 hover:bg-green-500 text-white text-xs font-black rounded-2xl transition-all shadow-xl shadow-green-600/20 uppercase"
          >
            Confirmar Recebimento
          </button>
        )}
        {(purchase.status === 'paid' || purchase.status === 'completed_by_seller' || purchase.status === 'accepted') && (
           <button 
            onClick={() => handleDisputeOrder(purchase)}
            className="px-4 py-4 bg-red-600/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 text-xs font-black rounded-2xl transition-all uppercase"
          >
            Abrir Disputa
          </button>
        )}
        {purchase.status === 'delivered' && !purchase.rated && (
          <button 
            onClick={() => {
              setSelectedOrderForRating(purchase);
              setShowRatingModal(true);
            }}
            className="p-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-2xl border border-amber-500/20 transition-all"
            title="Avaliar este serviço"
          >
            <Star className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  </div>
  ))
)}`;
  }
  return match;
});

fs.writeFileSync('src/pages/Dashboard.tsx', content);
