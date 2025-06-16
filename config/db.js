const {createPool} = require('mysql2/promise');
require('dotenv').config();

/**
 * Pool koneksi MySQL menggunakan mysql2/promise
 * @constant db
 * @type {import('mysql2/promise').Pool}
 * @property {string} host - Host database (diambil dari environment variable DB_HOST)
 * @property {string} user - Username database (diambil dari environment variable DB_USER)
 * @property {string} password - Password database (diambil dari environment variable DB_PASSWORD)
 * @property {string} database - Nama database (diambil dari environment variable DB_NAME)
 * 
 * @example
 * // Contoh penggunaan query sederhana
 * const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [1]);
 * console.log(rows);
 * 
 * @example
 * // Contoh penggunaan transaction
 * const conn = await db.getConnection();
 * try {
 *   await conn.beginTransaction();
 *   await conn.query('INSERT INTO users (name) VALUES (?)', ['John']);
 *   await conn.query('UPDATE stats SET user_count = user_count + 1');
 *   await conn.commit();
 * } catch (err) {
 *   await conn.rollback();
 *   throw err;
 * } finally {
 *   conn.release();
 * }
 */
const db = createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

module.exports = db;
