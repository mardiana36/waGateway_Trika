/**
 * Modul untuk operasi CRUD database MySQL dengan dukungan join, pagination, dan operasi kompleks lainnya
 * @namespace whatsAppModule
 */
const whatsAppModule = {
    /**
   * Melakukan query SELECT dengan dukungan join, where clause, sorting, dan limit
   * @async
   * @method Select
   * @memberof whatsAppModule
   * @param {string} table - Nama tabel utama
   * @param {object} [whereClause={}] - Kondisi WHERE dalam bentuk object
   * @param {object} connection - Koneksi database MySQL
   * @param {string[]} [selectFields=["*"]] - Kolom yang akan di-select
   * @param {string} [logicOperator="AND"] - Operator logika untuk WHERE clause ("AND" atau "OR")
   * @param {string} [orderBy=""] - Kolom untuk sorting
   * @param {string} [typeOrderBy=""] - Tipe sorting ("ASC" atau "DESC")
   * @param {number} [limit=0] - Jumlah row yang akan diambil (0 untuk tanpa limit)
   * @param {Array} [joins=[]] - Konfigurasi JOIN tables
   * @returns {Promise<Array>} Array hasil query
   * @throws {Error} Jika nama tabel tidak valid atau parameter join tidak lengkap
   * @example
   * // Contoh sederhana
   * const rows = await whatsAppModule.Select('users', { id: 1 }, db);
   * 
   * // Contoh dengan join dan sorting
   * const rows = await whatsAppModule.Select(
   *   'users',
   *   { 'users.active': 1 },
   *   db,
   *   ['users.id', 'users.name', 'profiles.address'],
   *   'AND',
   *   'users.created_at',
   *   'DESC',
   *   10,
   *   [{
   *     type: 'INNER',
   *     table: 'profiles',
   *     on: 'users.id = profiles.user_id'
   *   }]
   * );
   */
  Select: async (
  table,
  whereClause = {},
  connection,
  selectFields = ["*"],
  logicOperator = "AND",
  orderBy = "",
  typeOrderBy = "",
  limit = 0,
  joins = []
) => {
  try {
    if (!table || typeof table !== "string") {
      throw new Error("Nama tabel harus string dan tidak boleh kosong!");
    }

    const fields = selectFields.join(", ");
    const conditions = [];
    const values = [];

    for (const key in whereClause) {
      // Jika whereClause[key] adalah objek (untuk operator khusus)
      if (typeof whereClause[key] === 'object' && whereClause[key] !== null) {
        const operator = whereClause[key].operator || "="; // Default operator =
        const value = whereClause[key].value;
        
        conditions.push(`${key} ${operator} ?`);
        values.push(value);
      } else {
        // Default case (operator =)
        conditions.push(`${key} = ?`);
        values.push(whereClause[key]);
      }
    }

    const logic = logicOperator.toUpperCase() === "OR" ? "OR" : "AND";
    const whereSql = conditions.length
      ? `WHERE ${conditions.join(` ${logic} `)}`
      : "";

    let joinSql = "";
    if (Array.isArray(joins)) {
      for (const join of joins) {
        if (
          join.type &&
          join.table &&
          join.on &&
          typeof join.type === "string" &&
          typeof join.table === "string" &&
          typeof join.on === "string"
        ) {
          joinSql += ` ${join.type.toUpperCase()} JOIN ${join.table} ON ${join.on}`;
        } else {
          throw new Error("Join harus berupa objek dengan type, table, dan on");
        }
      }
    }

    const setOrderBy =
      orderBy !== "" ? `ORDER BY ${orderBy} ${typeOrderBy}` : "";
    const setLimit = limit !== 0 ? `LIMIT ${limit}` : "";

    const sql = `SELECT ${fields} FROM ${table}${joinSql} ${whereSql} ${setOrderBy} ${setLimit}`;
    const [rows] = await connection.execute(sql, values);
    return rows;
  } catch (error) {
    console.error("Error selectDataWithJoin:", error);
    throw error;
  }
},
   /**
   * Melakukan INSERT data ke tabel
   * @async
   * @method Insert
   * @memberof whatsAppModule
   * @param {string} table - Nama tabel
   * @param {object} insertFields - Data yang akan diinsert dalam bentuk object
   * @param {object} connection - Koneksi database MySQL
   * @param {boolean} [getIdInsert=false] - Flag untuk mendapatkan ID insert terakhir
   * @returns {Promise<boolean|number>} Jumlah affected rows atau ID insert terakhir
   * @throws {Error} Jika nama tabel tidak valid
   * @example
   * // Insert biasa
   * const success = await whatsAppModule.Insert(
   *   'users', 
   *   { name: 'John', email: 'john@example.com' }, 
   *   db
   * );
   * 
   * // Insert dan dapatkan ID
   * const newId = await whatsAppModule.Insert(
   *   'users',
   *   { name: 'John', email: 'john@example.com' },
   *   db,
   *   true
   * );
   */
  Insert: async (table, insertFields = {}, connection, getIdInsert = false) => {
    try {
      if (!table || typeof table !== "string") {
        throw new Error("Nama tabel harus string dan tidak boleh kosong!");
      }

      const fields = [];
      const placeholders = [];
      const values = [];

      for (const key in insertFields) {
        fields.push(key);
        placeholders.push("?");
        values.push(insertFields[key]);
      }

      const sql = `INSERT INTO ${table} (${fields.join(
        ", "
      )}) VALUES (${placeholders.join(", ")})`;

      const [rows] = await connection.execute(sql, values);

      if(getIdInsert){
        return rows.insertId;
      }
      return rows.affectedRows > 0;
    } catch (error) {
      console.error("Error InsertData:", error);
      throw error;
    }
  },

  /**
   * Melakukan INSERT dengan penanganan DUPLICATE KEY UPDATE
   * @async
   * @method InsertOnDuplicate
   * @memberof whatsAppModule
   * @param {string} table - Nama tabel
   * @param {object} insertFields - Data yang akan diinsert
   * @param {object} connection - Koneksi database MySQL
   * @param {object} onDuplicate - Data yang akan diupdate jika terjadi duplicate key
   * @returns {Promise<boolean>} True jika operasi berhasil
   * @throws {Error} Jika nama tabel tidak valid
   * @example
   * await whatsAppModule.InsertOnDuplicate(
   *   'users',
   *   { id: 1, name: 'John', email: 'john@example.com' },
   *   db,
   *   { name: 'John Updated', last_update: new Date() }
   * );
   */
  InsertOnDuplicate: async (
    table,
    insertFields = {},
    connection,
    onDuplicate = {}
  ) => {
    try {
      if (!table || typeof table !== "string") {
        throw new Error("Nama tabel harus string dan tidak boleh kosong!");
      }

      const fields = [];
      const placeholders = [];
      const values = [];
      const fieldsDuplicate = [];

      for (const key in insertFields) {
        fields.push(key);
        placeholders.push("?");
        values.push(insertFields[key]);
      }

      for (const key in onDuplicate) {
        fieldsDuplicate.push(`${key} = ?`);
        values.push(onDuplicate[key]);
      }

      const sql = `INSERT INTO ${table} (${fields.join(
        ", "
      )}) VALUES (${placeholders.join(
        ", "
      )}) ON DUPLICATE KEY UPDATE ${fieldsDuplicate.join(",")}`;

      const [rows] = await connection.execute(sql, values);

      return rows.affectedRows > 0;
    } catch (error) {
      console.error("Error InsertData:", error);
      throw error;
    }
  },

  /**
   * Melakukan UPDATE data
   * @async
   * @method Update
   * @memberof whatsAppModule
   * @param {string} table - Nama tabel
   * @param {object} updateFields - Data yang akan diupdate dalam bentuk object
   * @param {object} whereClause - Kondisi WHERE dalam bentuk object
   * @param {object} connection - Koneksi database MySQL
   * @returns {Promise<boolean>} True jika ada row yang terupdate
   * @throws {Error} Jika nama tabel tidak valid
   * @example
   * const updated = await whatsAppModule.Update(
   *   'users',
   *   { name: 'John Updated' },
   *   { id: 1 },
   *   db
   * );
   */
  Update: async (table, updateFields = {}, whereClause = {}, connection) => {
    try {
      if (!table || typeof table !== "string") {
        throw new Error("Nama tabel harus string dan tidak boleh kosong!");
      }

      const setFields = [];
      const values = [];

      for (const key in updateFields) {
        setFields.push(`${key} = ?`);
        values.push(updateFields[key]);
      }

      const whereFields = [];
      for (const key in whereClause) {
        whereFields.push(`${key} = ?`);
        values.push(whereClause[key]);
      }

      const whereSQL =
        whereFields.length > 0 ? `WHERE ${whereFields.join(" AND ")}` : "";
      const sql = `UPDATE ${table} SET ${setFields.join(", ")} ${whereSQL}`;

      const [rows] = await connection.execute(sql, values);
      return rows.affectedRows > 0;
    } catch (error) {
      console.error("Error UpdateData:", error);
      throw error;
    }
  },

    /**
   * Melakukan DELETE data
   * @async
   * @method Delete
   * @memberof whatsAppModule
   * @param {string} table - Nama tabel
   * @param {object} whereClause - Kondisi WHERE dalam bentuk object
   * @param {object} connection - Koneksi database MySQL
   * @returns {Promise<boolean>} True jika ada row yang terdelete
   * @throws {Error} Jika nama tabel tidak valid
   * @example
   * const deleted = await whatsAppModule.Delete(
   *   'users',
   *   { id: 1 },
   *   db
   * );
   */
  Delete: async (table, whereClause = {}, connection) => {
    try {
      if (!table || typeof table !== "string") {
        throw new Error("Nama tabel harus string dan tidak boleh kosong!");
      }

      const whereFields = [];
      const values = [];

      for (const key in whereClause) {
        whereFields.push(`${key} = ?`);
        values.push(whereClause[key]);
      }

      const whereSQL =
        whereFields.length > 0 ? `WHERE ${whereFields.join(" AND ")}` : "";
      const sql = `DELETE FROM ${table} ${whereSQL}`;

      const [rows] = await connection.execute(sql, values);
      return rows.affectedRows > 0;
    } catch (error) {
      console.error("Error DeleteData:", error);
      throw error;
    }
  },
};
module.exports = whatsAppModule;
