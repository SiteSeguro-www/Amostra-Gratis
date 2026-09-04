const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // Withdrawal Request
  app.post(['/api/account/rescue-balance', '/api/rescue-balance'], async (req, res) => {
    try {
      const handler = (await import('./api-handlers/account/rescue-balance.js')).default;
      return handler(req, res);
    } catch (error: any) {
      console.error('Withdraw error:', error);
      res.status(500).json({ error: error.message || 'Erro ao processar saque' });
    }
  });`;

const replacement = `  // Withdrawal Request
  app.post(['/api/account/rescue-balance', '/api/rescue-balance'], async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Não autorizado. Faça login novamente.' });

    try {
      const token = authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1].trim() : authHeader.trim();
      const decodedToken = await adminAuth.verifyIdToken(token);
      const userId = decodedToken.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Token de autenticação inválido.' });
      }

      const userRef = db.collection('users').doc(userId);
      const userSnap = await userRef.get();

      if (!userSnap.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }

      const userData = userSnap.data()!;
      const balance = Number(userData.balance) || 0;

      if (balance <= 0) {
        return res.status(400).json({ error: 'Você não possui saldo disponível para resgate.' });
      }

      // Buscar dados bancários
      const bankSnap = await db.collection('bank_accounts').doc(userId).get();
      const bankData = bankSnap.exists ? bankSnap.data() : {};

      const pixKey = (bankData?.pixKey || userData.pixKey || '').toString().trim();

      if (!pixKey) {
        return res.status(400).json({ error: 'Chave PIX não cadastrada. Por favor, cadastre uma chave PIX antes de solicitar o resgate.' });
      }

      const requestRef = db.collection('withdrawal_requests').doc();
      const requestData = {
        userId,
        amount: balance,
        pixKey: pixKey,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      // Zera o saldo
      await userRef.update({ balance: 0 });
      saveToMinioDB('users', userId, { ...userData, balance: 0 }).catch(() => {});

      // Salva a requisição
      await requestRef.set(requestData);
      saveToMinioDB('withdrawal_requests', requestRef.id, requestData).catch(() => {});

      res.status(200).json({ success: true, message: 'Solicitação de saque enviada com sucesso!' });
    } catch (error: any) {
      console.error('Withdraw error:', error);
      res.status(500).json({ error: error.message || 'Erro ao processar saque' });
    }
  });`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Success rescue-balance");
} else {
  console.log("Target not found rescue-balance");
}
