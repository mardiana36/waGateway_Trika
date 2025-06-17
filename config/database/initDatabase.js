const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
/**
 * Membuat database beserta tabelnya jika belum ada 
 * @async
 * @returns {Promise<void>} Tidak Mengembalikan nilai apapun 
 * @example
 * // contoh cara menggunakan fungsi ini.
 * const initDatabase = require("./config/dataBase/initDatabase");
 * await initDatabase();
 * 
 */
const initDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      multipleStatements: true 
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`[INFO] Database '${DB_NAME}' berhasil dibuat atau sudah ada.`);
    await connection.changeUser({ database: DB_NAME });
    const sql = fs.readFileSync('./config/database/database.sql', 'utf8');
    await connection.query(sql);
    console.log(`[OK] Struktur database dan relasi berhasil dibuat.`);

    await connection.end();
  } catch (err) {
    console.error('[FATAL] Gagal inisialisasi database:', err.message);
    process.exit(1);
  }
};

module.exports = initDatabase;
