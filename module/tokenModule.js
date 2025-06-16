require("dotenv").config();
/**
 * Format string dengan menukar posisi kata berpasangan
 * @private
 * @param {string} str - String yang akan diformat
 * @returns {string} String yang sudah diformat
 * @example
 * const result = formatS("kata1 kata2 kata3 kata4");
 * // Returns: "kata2 kata1 kata4 kata3"
 */
const formatS = (str) => {
  const array = str.split(" ");
  for (let i = 0; i < array.length - 1; i += 2) {
    const temp = array[i];
    array[i] = array[i + 1];
    array[i + 1] = temp;
  }

  return array.join(" ");
};

/**
 * Modul untuk menangani operasi terkait token (decode dan validasi)
 * @class tokenModule
 */
class tokenModule {
   /**
   * Mendekode secret token dari environment variable
   * @method decodeSecretToken
   * @memberof tokenModule
   * @returns {string} Token yang sudah didecode
   * @throws {Error} errorTokenSecretNull - Jika SECRET_TOKEN tidak ada di environment
   * @example
   * const token = tokenModule.decodeSecretToken();
   * console.log(token); // Output token yang sudah didecode
   */
  decodeSecretToken() {
    const token = formatS(process.env.SECRET_TOKEN);
    if (!token) {
      const error = new Error(
        "Token secret dalam environment belum ada (SECRET_TOKEN)"
      );
      error.name = "errorTokenSecretNull";
    }
    const decode = token.split(" ").map((v) =>
      v
        .split("")
        .map((c) => String.fromCharCode(c.charCodeAt(0) - 10))
        .join("")
    );
    const result = decode
      .map((v) => String.fromCharCode(parseInt(v, 2)))
      .join("");
    return result;
  }

  /**
   * Memvalidasi token verifikasi dengan algoritma khusus.
   * @method decodeVerifyToken
   * @memberof tokenModule
   * @param {object} tokenDecode - Objek token yang sudah didecode
   * @returns {boolean} Hasil validasi (true jika valid)
   * @throws {Error} errorTokenNull - Jika VERIFY_TOKEN tidak ada di environment
   * @throws {Error} errorTokenDecode - Jika tokenDecode null
   * @throws {Error} errorTokenParam - Jika tokenDecode bukan object
   * @example
   * const isValid = tokenModule.decodeVerifyToken(decodedToken);
   * if (isValid) {
   *   console.log("Token valid");
   * }
   */
  decodeVerifyToken(tokenDecode) {
    const token = formatS(process.env.VERIFY_TOKEN);
    if (!token) {
      const error = new Error(
        "Token verifikasi dalam environment belum ada (VERIFY_TOKEN)"
      );
      error.name = "errorTokenNull";
    }
    if (tokenDecode == null) {
      const error = new Error("Token gagal di decode!");
      error.name = "errorTokenDecode";
    } else if (typeof tokenDecode === "object") {
      const error = new Error("Terjadi Kesalahan data parameter!");
      error.name = "errorTokenParam";
    }
    // Filter hanya properti yang diperlukan
    const FormatDecodeTokken = Object.keys(tokenDecode).reduce((acc, key) => {
      if (!["iat", "exp"].includes(key)) {
        acc[key] = tokenDecode[key];
      }
      return acc;
    }, {});

    // Proses decoding token
    let temp = 1;
    const decode = token
      .split(" ")
      .map((v) =>
        v.split("").map((c) => String.fromCharCode(c.charCodeAt(0) - 10)).join("")
      );
    const result = decode.map((v) => String.fromCharCode(parseInt(v, 2)));
    const format = result.map((v, i) => {
      if (i == 1 || i == 5 || i == 7) {
        const value = v + temp;
        temp++;
        return value;
      }
      return v;
    });

    // Generate validation key
    const valuKey = result.map((v) => {
      const value = v.charCodeAt(0) - 96;
      if (value > 9) {
        const temp = value.toString();
        return parseInt(temp.slice(1), 10);
      }
      return value;
    });

     // Validasi kesesuaian token
    const validate = format.every(
      (v, i) => FormatDecodeTokken[v] == valuKey[i]
    );
    return validate;
  }
}

module.exports = new tokenModule();
