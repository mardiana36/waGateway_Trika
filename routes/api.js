const express = require("express");
const whatsappController = require("../controllers/whatsappController");
const upload = require("../middlewares/uploadExcel");

const {
  authenticate,
  ensureVerified,
  authToken,
} = require("../middlewares/auth");
 
/**
 * Router untuk WhatsApp API dengan dua jenis autentikasi:
 * 1. Untuk frontend (membutuhkan registrasi/login)
 * 2. Untuk backend langsung (menggunakan token API)
 */
const router = express.Router();

// ==============================================
//   ROUTES UNTUK FRONTEND (MEMBUTUHKAN LOGIN)
// ==============================================
//Di bawah ini adalah route yang di gunakan oleh frondend yang sudah ada di project ini. 

/**
 * Registrasi perangkat baru
 * @route POST /regis
 * @group WhatsApp - Operasi terkait WhatsApp
 * @param {string} username.body.required - Nama pengguna unik
 * @param {string} email.body.required - Email valid pengguna
 * @param {string} password.body.required - Password minimal 8 karakter
 * @returns {object} 200 - Pesan sukses registrasi
 * @returns {Error} 400 - Error validasi input
 * @returns {Error} 500 - Error server
 */
router.post("/regis", whatsappController.registerSession);

/**
 * Login ke sistem
 * @route POST /login
 * @group WhatsApp - Operasi terkait WhatsApp
 * @param {string} identify.body.required - Username atau email
 * @param {string} password.body.required - Password pengguna
 * @returns {object} 200 - Berhasil login
 * @returns {Error} 400 - Error validasi input
 * @returns {Error} 401 - Kredensial salah
 */
router.post("/login", whatsappController.loginSession);

/**
 * Verifikasi email pengguna
 * @route GET /verify-email
 * @group WhatsApp - Operasi terkait WhatsApp
 * @param {string} token.query.required - Token verifikasi dari email
 * @returns {object} 200 - Email terverifikasi
 * @returns {Error} 400 - Token invalid/kadaluarsa
 */
router.get("/verify-email", whatsappController.verifyEmail);

/**
 * Hapus sesi WhatsApp
 * @route DELETE /sessions
 * @group WhatsApp - Operasi sesi
 * @param {string} sessionName.body.required - Nama sesi yang akan dihapus
 * @returns {object} 200 - Sesi berhasil dihapus
 * @returns {Error} 400 - Sesi tidak ditemukan
 * @security JWT
 */
router.delete(
  "/sessions",
  authenticate,
  ensureVerified,
  whatsappController.deleteSession
);

/**
 * Logout dari sistem
 * @route POST /logout
 * @group WhatsApp - Operasi terkait WhatsApp
 * @returns {object} 200 - Berhasil logout
 * @security JWT
 */
router.post(
  "/logout",
  authenticate,
  ensureVerified,
  whatsappController.logoutSession
);

/**
 * Ganti perangkat WhatsApp (logout paksa)
 * @route PUT /
 * @group WhatsApp - Operasi sesi
 * @param {string} sessionName.body.required - Nama sesi target
 * @returns {object} 200 - Perintah berhasil
 * @security JWT
 */
router.put("/", authenticate, ensureVerified, whatsappController.changeDevice);

/**
 * Dapatkan QR code untuk autentikasi
 * @route POST /qr
 * @group WhatsApp - Operasi sesi
 * @param {string} sessionName.body.required - Nama sesi target
 * @returns {object} 200 - Berisi QR code atau status
 * @security JWT
 */
router.post("/qr", authenticate, ensureVerified, whatsappController.getQRCode);

/**
 * Kirim pesan ke banyak nomor
 * @route POST /send-bulk-message
 * @group WhatsApp - Operasi pesan
 * @param {string} sessionName.body.required - Nama sesi pengirim
 * @param {string|string[]} number.body.required - Nomor tujuan
 * @param {string|string[]} message.body.required - Isi pesan
 * @param {number} [delay=300].body - Delay antar pengiriman (ms)
 * @returns {object} 200 - Hasil pengiriman per nomor
 * @security JWT
 */
router.post(
  "/send-bulk-message",
  authenticate,
  ensureVerified,
  whatsappController.sendBulkMessage
);

/**
 * Kirim pesan ke grup
 * @route POST /send-group
 * @group WhatsApp - Operasi grup
 * @param {string} sessionName.body.required - Nama sesi pengirim
 * @param {string[]} groupsId.body.required - ID grup tujuan
 * @param {string} message.body.required - Isi pesan
 * @returns {object} 200 - Hasil pengiriman per grup
 * @security JWT
 */
router.post(
  "/send-group",
  authenticate,
  ensureVerified,
  whatsappController.sendGroupsMessage
);

/**
 * Dapatkan daftar grup
 * @route POST /group
 * @group WhatsApp - Operasi grup
 * @param {string} sessionName.body.required - Nama sesi target
 * @returns {object} 200 - Daftar grup
 * @security JWT
 */
router.post(
  "/group",
  authenticate,
  ensureVerified,
  whatsappController.getGroups
);

/**
 * Hapus data grup dari database
 * @route DELETE /group
 * @group WhatsApp - Operasi grup
 * @param {string} sessionName.body.required - Nama sesi target
 * @returns {object} 200 - Konfirmasi penghapusan
 * @security JWT
 */
router.delete(
  "/group",
  authenticate,
  ensureVerified,
  whatsappController.deleteGroups
);

/**
 * Update template pesan
 * @route PUT /template
 * @group WhatsApp - Operasi template
 * @param {number} id.body.required - ID template
 * @param {string} sessionName.body.required - Nama sesi pemilik
 * @param {string} name.body - Nama template baru
 * @param {string} message.body - Isi template baru
 * @param {string} [direction].body - Arah pesan (in/out)
 * @param {string} [type].body - Tipe pesan (personal/group)
 * @param {string} [placeholder].body - Contoh placeholder
 * @returns {object} 200 - Template terupdate
 * @security JWT
 */
router.put(
  "/template",
  authenticate,
  ensureVerified,
  whatsappController.updateTemplateMessage
);

/**
 * Hapus template pesan
 * @route DELETE /template
 * @group WhatsApp - Operasi template
 * @param {number} id.body.required - ID template
 * @param {string} sessionName.body.required - Nama sesi pemilik
 * @returns {object} 200 - Konfirmasi penghapusan
 * @security JWT
 */
router.delete(
  "/template",
  authenticate,
  ensureVerified,
  whatsappController.deleteTemplateMessage
);

/**
 * Buat template pesan baru
 * @route POST /template
 * @group WhatsApp - Operasi template
 * @param {string} sessionName.body.required - Nama sesi pemilik
 * @param {string} name.body.required - Nama template
 * @param {string} keyMessage.body.required - Key unik template
 * @param {string} message.body.required - Isi template
 * @param {string} direction.body.required - Arah pesan (in/out)
 * @param {string} type.body.required - Tipe pesan (personal/group)
 * @param {string} placeholder.body.required - Contoh placeholder
 * @returns {object} 200 - Template baru
 * @security JWT
 */
router.post(
  "/template",
  authenticate,
  ensureVerified,
  whatsappController.createTemplateMessage
);

/**
 * Dapatkan semua template pesan
 * @route POST /templates
 * @group WhatsApp - Operasi template
 * @param {string} sessionName.body.required - Nama sesi pemilik
 * @returns {object} 200 - Daftar template
 * @security JWT
 */
router.post(
  "/templates",
  authenticate,
  ensureVerified,
  whatsappController.readsTemplateMessages
);

/**
 * Dapatkan nama sesi aktif
 * @route GET /session
 * @group WhatsApp - Operasi sesi
 * @returns {object} 200 - Nama sesi aktif
 * @security JWT
 */
router.get(
  "/session",
  authenticate,
  ensureVerified,
  whatsappController.getSessionName
);

/**
 * Dapatkan detail template berdasarkan ID
 * @route POST /readsTemplate
 * @group WhatsApp - Operasi template
 * @param {number} id.body.required - ID template
 * @param {string} sessionName.body.required - Nama sesi pemilik
 * @returns {object} 200 - Detail template
 * @security JWT
 */
router.post(
  "/readsTemplate",
  authenticate,
  ensureVerified,
  whatsappController.readsTemplateMessage
);

/**
 * Dapatkan template berdasarkan tipe
 * @route POST /
 * @group WhatsApp - Operasi template
 * @param {string} sessionName.body.required - Nama sesi pemilik
 * @param {string} type.body.required - Tipe template (personal/group)
 * @returns {object} 200 - Daftar template sesuai tipe
 * @security JWT
 */
router.post(
  "/",
  authenticate,
  ensureVerified,
  whatsappController.readsTemplateMessagesByType
);

/**
 * Kompilasi template dengan data dinamis
 * @route POST /compile
 * @group WhatsApp - Operasi template
 * @param {string} templateMessage.body.required - Template dengan placeholder
 * @param {object} filleds.body.required - Data untuk placeholder
 * @returns {object} 200 - Pesan yang sudah dikompilasi
 * @security JWT
 */
router.post(
  "/compile",
  authenticate,
  ensureVerified,
  whatsappController.implementasionTemplate
);

/**
 * Preview data dari file Excel
 * @route POST /preview-excel
 * @group WhatsApp - Tools
 * @param {file} excel.formData.required - File Excel
 * @returns {object} 200 - Data preview
 * @security JWT
 */
router.post(
  "/preview-excel",
  authenticate,
  ensureVerified,
  upload.single("excel"),
  whatsappController.prewiewExcel
);

/**
 * Preview header kolom dari file Excel untuk template
 * @route POST /preview-excel-template
 * @group WhatsApp - Tools
 * @param {file} excel.formData.required - File Excel
 * @returns {object} 200 - Daftar placeholder
 * @security JWT
 */
router.post(
  "/preview-excel-template",
  authenticate,
  ensureVerified,
  upload.single("excel"),
  whatsappController.prewiewExcelTemplate
);

// ==============================================
// ROUTES UNTUK BACKEND (MENGGUNAKAN TOKEN API)
// ==============================================
//Gunakan route di bawah ini jika tidak ingin mengunakan frondend yang sudah di sediakan
/**
 * Mulai sesi WhatsApp baru (API Token)
 * @route POST /b/sessions
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Sesi berjalan
 * @security APIKey
 */
router.post("/b/sessions", authToken, whatsappController.startSessionWa);

/**
 * Hapus sesi WhatsApp (API Token)
 * @route DELETE /b/sessions
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Sesi terhapus
 * @security APIKey
 */
router.delete("/b/sessions", authToken, whatsappController.deleteSession);

/**
 * Ganti perangkat WhatsApp (API Token)
 * @route PUT /b/
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Perintah berhasil
 * @security APIKey
 */
router.put("/b/", authToken, whatsappController.changeDevice);

/**
 * Dapatkan QR code (API Token)
 * @route POST /b/qr
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - QR code atau status
 * @security APIKey
 */
router.post("/b/qr", authToken, whatsappController.getQRCode);

/**
 * Kirim pesan ke banyak nomor (API Token)
 * @route POST /b/send-bulk-message
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @param {string|string[]} number.body.required - Nomor tujuan
 * @param {string|string[]} message.body.required - Isi pesan
 * @param {number} [delay=300].body - Delay antar pengiriman (ms)
 * @returns {object} 200 - Hasil pengiriman
 * @security APIKey
 */
router.post(
  "/b/send-bulk-message",
  authToken,
  whatsappController.sendBulkMessage
);

/**
 * Kirim pesan ke grup (API Token)
 * @route POST /b/send-group
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @param {string[]} groupsId.body.required - ID grup
 * @param {string} message.body.required - Isi pesan
 * @returns {object} 200 - Hasil pengiriman
 * @security APIKey
 */
router.post("/b/send-group", authToken, whatsappController.sendGroupsMessage);

/**
 * Dapatkan daftar grup (API Token)
 * @route POST /b/group
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Daftar grup
 * @security APIKey
 */
router.post("/b/group", authToken, whatsappController.getGroups);

/**
 * Hapus data grup (API Token)
 * @route DELETE /b/group
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Konfirmasi penghapusan
 * @security APIKey
 */
router.delete("/b/group", authToken, whatsappController.deleteGroups);

/**
 * Update template pesan (API Token)
 * @route PUT /b/template
 * @group WhatsApp API - Operasi dengan API Token
 * @param {number} id.body.required - ID template
 * @param {string} sessionName.body.required - Nama sesi
 * @param {object} updates.body - Data yang diupdate
 * @returns {object} 200 - Template terupdate
 * @security APIKey
 */
router.put(
  "/b/template",
  authToken,
  whatsappController.updateTemplateMessage
);

/**
 * Hapus template pesan (API Token)
 * @route DELETE /b/template
 * @group WhatsApp API - Operasi dengan API Token
 * @param {number} id.body.required - ID template
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Konfirmasi penghapusan
 * @security APIKey
 */
router.delete(
  "/b/template",
  authToken,
  whatsappController.deleteTemplateMessage
);

/**
 * Buat template baru (API Token)
 * @route POST /b/template
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @param {object} templateData.body.required - Data template
 * @returns {object} 200 - Template baru
 * @security APIKey
 */
router.post(
  "/b/template",
  authToken,
  whatsappController.createTemplateMessage
);

/**
 * Dapatkan semua template (API Token)
 * @route POST /b/templates
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Daftar template
 * @security APIKey
 */
router.post(
  "/b/templates",
  authToken,
  whatsappController.readsTemplateMessages
);

/**
 * Dapatkan detail template (API Token)
 * @route POST /b/readsTemplate
 * @group WhatsApp API - Operasi dengan API Token
 * @param {number} id.body.required - ID template
 * @param {string} sessionName.body.required - Nama sesi
 * @returns {object} 200 - Detail template
 * @security APIKey
 */
router.post(
  "/b/readsTemplate",
  authToken,
  whatsappController.readsTemplateMessage
);

/**
 * Dapatkan template by type (API Token)
 * @route POST /b/
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} sessionName.body.required - Nama sesi
 * @param {string} type.body.required - Tipe template
 * @returns {object} 200 - Template sesuai tipe
 * @security APIKey
 */
router.post(
  "/b/",
  authToken,
  whatsappController.readsTemplateMessagesByType
);

/**
 * Kompilasi template (API Token)
 * @route POST /b/compile
 * @group WhatsApp API - Operasi dengan API Token
 * @param {string} templateMessage.body.required - Template dengan placeholder
 * @param {object} filleds.body.required - Data untuk placeholder
 * @returns {object} 200 - Pesan terkompilasi
 * @security APIKey
 */
router.post(
  "/b/compile",
  authToken,
  whatsappController.implementasionTemplate
);

/**
 * Preview Excel (API Token)
 * @route POST /b/preview-excel
 * @group WhatsApp API - Operasi dengan API Token
 * @param {file} excel.formData.required - File Excel
 * @returns {object} 200 - Data preview
 * @security APIKey
 */
router.post(
  "/b/preview-excel",
  authToken,
  upload.single("excel"),
  whatsappController.prewiewExcel
);

/**
 * Preview Excel untuk template (API Token)
 * @route POST /b/preview-excel-template
 * @group WhatsApp API - Operasi dengan API Token
 * @param {file} excel.formData.required - File Excel
 * @returns {object} 200 - Daftar placeholder
 * @security APIKey
 */
router.post(
  "/b/preview-excel-template",
  authToken,
  upload.single("excel"),
  whatsappController.prewiewExcelTemplate
);

module.exports = router;