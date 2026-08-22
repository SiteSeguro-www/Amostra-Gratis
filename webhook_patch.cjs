const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
        console.log(\`[Webhook] Order \${orderId} updated to status: \${newStatus}\`);

        // --- Process HotCoins Purchases ---
        if (newStatus === 'paid' && currentData.status !== 'paid' && currentData.status !== 'delivered' && externalReference.type === 'hotcoins') {
          try {
            const buyerId = externalReference.buyerId;
            const hotCoins = Number(externalReference.hotCoins) || 0;
            if (buyerId && hotCoins > 0) {
              const userRef = db.collection('users').doc(buyerId);
              
              // Increment hotcoins atomically
              const { FieldValue } = require('firebase-admin/firestore');
              await userRef.update({
                hotCoins: FieldValue.increment(hotCoins)
              });

              // Log transaction
              const transRef = db.collection('hotcoin_transactions').doc();
              const transData = {
                userId: buyerId,
                amount: hotCoins,
                type: 'earn',
                description: \`Compra de Pacote de \${hotCoins} HotCoins\`,
                createdAt: new Date().toISOString()
              };
              await transRef.set(transData);
              saveToMinioDB('hotcoin_transactions', transRef.id, transData).catch(() => {});

              // Mark order as delivered immediately since it's digital currency
              await orderRef.set({ status: 'delivered', updatedAt: new Date().toISOString() }, { merge: true });
              console.log(\`[Webhook] Credited \${hotCoins} HotCoins to user \${buyerId} for order \${orderId}\`);
            }
          } catch (err) {
            console.error('[Webhook] Error processing hotcoins:', err);
          }
        }

        // --- Send Emails Only If It Just Transitioned to Paid ---
`;

content = content.replace("console.log(`[Webhook] Order ${orderId} updated to status: ${newStatus}`);\n\n        // --- Send Emails Only If It Just Transitioned to Paid ---", replacement);

fs.writeFileSync('server.ts', content);
