require('dotenv').config();

/**
 * Mendapatkan route registrasi token
 * 
 * @param {string} token - token verifikasi user registrasi
 * @returns {string} - Mengembalikan sebuah string route dari verifikasi regis.
 * @example
 * const 
 * const urlVerification = sendRegisToken(token);
 * 
 */
const sendRegisToken = (token) => {
  const verificationUrl = `/verifyRegis?regisToken=${token}`;
  return verificationUrl;
};

module.exports = { sendRegisToken };