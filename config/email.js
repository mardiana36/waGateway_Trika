const nodemailer = require("nodemailer");
require("dotenv").config();

/**
 * Konfigurasi transporter email menggunakan nodemailer
 * @constant transporter
 * @type {nodemailer.Transporter}
 * @property {string} service - Layanan email (diambil dari environment variable EMAIL_SERVICE)
 * @property {Object} auth - Autentikasi email
 * @property {string} auth.user - Username email (diambil dari environment variable EMAIL_USERNAME)
 * @property {string} auth.pass - Password email (diambil dari environment variable EMAIL_PASSWORD)
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Mengirim email verifikasi kepada pengguna
 * @async
 * @function sendVerificationEmail
 * @param {string} email - Alamat email penerima
 * @param {string} token - Token verifikasi yang akan dikirim
 * @returns {Promise<void>}
 * @throws {Error} Jika terjadi kesalahan dalam pengiriman email
 * @example
 * // Contoh penggunaan
 * try {
 *   await sendVerificationEmail('user@example.com', 'abc123def456');
 *   console.log('Email verifikasi berhasil dikirim');
 * } catch (error) {
 *   console.error('Gagal mengirim email verifikasi:', error);
 * }
 */
const sendVerificationEmail = async (email, token) => {
  if (!email || !token) {
    throw new Error("Email atau token tidak boleh kosong.");
  }
  const verificationUrl = `${process.env.BASE_URL}/verify?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Verifikasi Email Anda",
    html: `
      <h2>Email Verification</h2>
      <p>Silahkan klik Tombol di bawah ini untuk memverifikasi email anda.</p>
      <a href="${verificationUrl}" 
         style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">
         Verifikasi Email
      </a>
      <p>Jika bukan anda yang registrasi akun silahkan abaikan email ini.</p>
      <p>Verifikasi ini akan kadalwarsa selama 24 jam</p>
    `,
  });
};

module.exports = { sendVerificationEmail };
