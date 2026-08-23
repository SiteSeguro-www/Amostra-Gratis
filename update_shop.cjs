const fs = require('fs');
let content = fs.readFileSync('src/pages/Shop.tsx', 'utf8');

// Replace handleBuyCoins body
content = content.replace(
  /const handleBuyCoins = async \(pkg: any\) => \{[\s\S]*?setIsBuying\(null\);\n    \}\n  \};/,
  `const handleBuyCoins = (pkg: any) => {
    if (!user) return navigate('/login');
    navigate('/checkout/' + pkg.id);
  };`
);

fs.writeFileSync('src/pages/Shop.tsx', content);
