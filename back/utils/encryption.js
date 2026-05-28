const crypto = require('crypto');

const KEY_HEX = process.env.ENCRYPTION_KEY;

if (!KEY_HEX) {
  console.warn(
    '\n[SECURITY WARNING] ENCRYPTION_KEY is not set in .env.\n' +
    'A random key will be used — stored calendar credentials will be lost on restart.\n' +
    'Generate a persistent key with:\n  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n'
  );
}

const KEY = KEY_HEX
  ? Buffer.from(KEY_HEX, 'hex')
  : crypto.randomBytes(32);

function encrypt(plaintext) {
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv(24) + : + authTag(32) + : + ciphertext(hex)
  return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
}

function decrypt(ciphertext) {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

module.exports = { encrypt, decrypt };
