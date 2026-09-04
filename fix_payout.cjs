const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // Admin: Confirm Payout
  app.post('/api/admin/payout/confirm', async (req, res) => {
    const authHeader = req.headers.authorization;`;

if (code.includes(target)) {
  console.log("admin/payout/confirm already implemented directly in server.ts");
} else {
  console.log("target not found");
}
