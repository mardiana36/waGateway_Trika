const multer = require("multer");
/**
 * Filter untuk memvalidasi tipe file yang diupload
 * @private
 * @callback fileFilterCallback
 * @param {Error|null} error - Error jika file tidak valid
 * @param {boolean} accept - Boolean menentukan apakah file diterima
 */

/**
 * Fungsi filter file untuk memastikan hanya file Excel yang diupload
 * @function fileFilter
 * @param {Object} req - Request object dari Express
 * @param {Object} file - File object dari multer
 * @param {string} file.mimetype - MIME type dari file
 * @param {fileFilterCallback} cb - Callback untuk menangani hasil validasi
 * @example
 * // Digunakan secara internal oleh multer
 * fileFilter(req, file, (err, accept) => {
 *   if (err) throw err;
 *   if (accept) console.log('File diterima');
 * });
 */
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.mimetype === "application/vnd.ms-excel"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file Excel (.xlsx / .xls) yang diperbolehkan"), false);
  }
};

// Konfigurasi penyimpanan memory
const storage = multer.memoryStorage();

/**
 * Konfigurasi middleware upload file Excel
 * @constant upload
 * @type {multer.Multer}
 * @property {Object} storage - Penyimpanan memory (tidak disimpan ke disk)
 * @property {Function} fileFilter - Fungsi filter untuk validasi file Excel
 * @property {Object} limits - Batasan ukuran file (10MB)
 * 
 * @example
 * // Penggunaan dalam route Express
 * router.post('/upload', upload.single('excel'), (req, res) => {
 *   // File tersedia di req.file.buffer
 *   const workbook = XLSX.read(req.file.buffer);
 *   // ... proses file Excel
 * });
 * 
 * @example
 * // Error handling
 * router.post('/upload', upload.single('excel'), (req, res, next) => {
 *   // Tangani error upload
 * }, (err, req, res, next) => {
 *   if (err instanceof multer.MulterError) {
 *     // Tangani error multer
 *   } else if (err) {
 *     // Tangani error lainnya
 *   }
 * });
 */
const upload = multer ({
    storage:storage,
    fileFilter:fileFilter,
    limits:{fileSize: 10 * 1024 * 1024 }

});

module.exports = upload;
