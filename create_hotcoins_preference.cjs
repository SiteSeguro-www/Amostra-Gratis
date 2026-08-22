const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

// Insert the new route before app.post('/api/create-mercadopago-preference'
const routeToAdd = `
  app.post('/api/hotcoins/create-preference', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const idToken = authHeader.split('Bearer ')[1];
      let decodedToken;
      try {
        const { getAuth } = require('firebase-admin/auth');
        decodedToken = await getAuth().verifyIdToken(idToken);
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
      
      const userId = decodedToken.uid;
      const { packageId, amount, hotCoins } = req.body;

      if (!process.env.MERCADOPAGO_ACCESS_TOKEN || !process.env.MERCADOPAGO_ACCESS_TOKEN.trim()) {
        return res.status(500).json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado no servidor.' });
      }

      const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN.trim() });
      const preference = new Preference(client);
      
      const siteUrl = process.env.SITE_URL || \`https://\${req.get('host')}\`;
      
      const orderId = db.collection('orders').doc().id;

      const response = await preference.create({
        body: {
          items: [
            {
              id: \`hotcoins_\${packageId}\`,
              title: \`\${hotCoins} HotCoins\`,
              quantity: 1,
              unit_price: Number(amount),
              currency_id: 'BRL',
            }
          ],
          payer: {
            name: decodedToken.name || 'Anônimo',
            email: decodedToken.email || 'anonimo@example.com',
          },
          back_urls: {
            success: \`\${siteUrl}/shop?payment=success\`,
            failure: \`\${siteUrl}/shop?payment=failure\`,
            pending: \`\${siteUrl}/shop?payment=pending\`
          },
          auto_return: 'approved',
          notification_url: \`\${siteUrl}/api/webhook\`,
          external_reference: JSON.stringify({
            orderId,
            type: 'hotcoins',
            buyerId: userId,
            hotCoins,
            amount
          }),
          payment_methods: {
            excluded_payment_types: [],
            installments: 12,
          }
        }
      });

      const orderData = {
        id: orderId,
        type: 'hotcoins',
        packageId,
        hotCoins,
        amount: amount,
        buyerId: userId,
        status: 'pending',
        paymentMethod: 'mercado_pago',
        preferenceId: response.id,
        createdAt: new Date().toISOString(),
      };
      
      await db.collection('orders').doc(orderId).set(orderData);
      saveToMinioDB('orders', orderId, orderData).catch(() => {});

      return res.json({ init_point: response.init_point });
    } catch (error: any) {
      console.error('Error creating MP preference for hotcoins:', error);
      res.status(500).json({ error: error.message });
    }
  });

`;

content = content.replace("app.post('/api/create-mercadopago-preference'", routeToAdd + "  app.post('/api/create-mercadopago-preference'");

fs.writeFileSync('server.ts', content);
