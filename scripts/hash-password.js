const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification test:', isValid);
}

hashPassword();