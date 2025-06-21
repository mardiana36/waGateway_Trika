const jwt = require("jsonwebtoken");
const devices = require("../module/whatsAppModule");
const db = require("../config/db");
const tokenModule = require("../module/tokenModule");

/**
 * Middleware untuk autentikasi berbasis cookie JWT
 * @async
 * @function authenticate
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {Object} Response JSON jika terjadi error
 * @throws {JsonWebTokenError} Jika token tidak valid
 * @throws {TokenExpiredError} Jika token sudah kadaluarsa
 * @example
 * // Penggunaan dalam route
 * router.get('/protected', authenticate, (req, res) => {
 *   // Hanya bisa diakses jika terautentikasi
 *   res.json({ user: req.device });
 * });
 */
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.signedCookies.token;
    if (!token) {
      return res.status(201).json({ error: "Authentication required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const device = await devices.Select("devices", { id: decoded.id }, db, [
      "id",
      "name",
      "email",
      "is_verified",
    ]);
    if (!device) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    req.device = device[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          error: "Token expired, silahkan login ulang!",
        });
    }

    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * Middleware untuk autentikasi ragistrasi berbasis cookie JWT
 * @async
 * @function authenticate
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {Object} Response JSON jika terjadi error
 * @throws {JsonWebTokenError} Jika token tidak valid
 * @throws {TokenExpiredError} Jika token sudah kadaluarsa
 * @example
 * // Penggunaan dalam route
 * router.get('/protected', authenticateRegis, (req, res) => {
 *   // Hanya bisa diakses jika terautentikasi
 *   res.json({ user: req.regis });
 * });
 */
exports.authenticateRegis = async (req, res, next) => {
  try {
    const token = req.signedCookies.regisToken;
    if (!token) {
      return res
        .status(201)
        .json({ success: false, error: "Authentication required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const device = await devices.Select("devices", { id: decoded.id }, db, [
      "id",
    ]);
    if (!device) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    req.regis = device[0];
    next();
  } catch (error) {
    console.error("Authentication error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * Middleware untuk memastikan email sudah terverifikasi
 * @function ensureVerified
 * @param {Object} req - Request object (harus sudah melalui authenticate)
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {Object} Response JSON jika email belum terverifikasi
 * @example
 * // Penggunaan dalam route
 * router.get('/verified-only', authenticate, ensureVerified, (req, res) => {
 *   // Hanya bisa diakses jika email terverifikasi
 *   res.json({ message: 'Anda terverifikasi' });
 * });
 */
exports.ensureVerified = (req, res, next) => {
  if (!req?.device?.is_verified) {
    return res.status(403).json({
      success: false,
      error: "Email verification required",
    });
  }
  next();
};

/**
 * Middleware untuk memastikan registrasi terverifikasi
 * @function ensureVerified
 * @param {Object} req - Request object (harus sudah melalui authenticate)
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {Object} Response JSON jika email belum terverifikasi
 * @example
 * // Penggunaan dalam route
 * router.get('/verified-only', authenticateRegis, ensureVerifiedRegis, (req, res) => {
 *   // Hanya bisa diakses jika email terverifikasi
 *   res.json({ message: 'Anda terverifikasi' });
 * });
 */
exports.ensureVerifiedRegis = (req, res, next) => {
  if (!req.regis.id) {
    return res.status(403).json({
      success: false,
      error: "Anda harus registrasi untuk mengakses halamn ini!",
    });
  }
  next();
};

/**
 * Middleware untuk autentikasi berbasis token API (Bearer token)
 * @async
 * @function authToken
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {Object} Response JSON jika terjadi error
 * @throws {JsonWebTokenError} Jika token tidak valid
 * @throws {TokenExpiredError} Jika token sudah kadaluarsa
 * @throws {Error} Jika terjadi error pada decode token
 * @example
 * // Penggunaan dalam route
 * router.get('/api/protected', authToken, (req, res) => {
 *   // Hanya bisa diakses dengan token API yang valid
 *   res.json({ message: 'Akses API berhasil' });
 * });
 */
exports.authToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Ambil token dari "Bearer <token>"
    if (!token) {
      return res.status(401).json({ message: "Token tidak ditemukan" });
    }
    if (token !== process.env.API_TOKEN) {
      return res.status(401).json({
        success: false,
        error:
          "Token tidak valid. Pastikan token yang terdapat dalam environment (API_TOKEN) sama dengan token dalam headers Autorization.",
      });
    }

    const decoded = jwt.verify(token, tokenModule.decodeSecretToken());
    if (tokenModule.decodeVerifyToken(decoded)) {
      next();
    } else {
      res.status(401).json({
        success: false,
        error: "Token verifikasi salah pada environment (VERIFY_TOKEN)",
      });
    }
  } catch (error) {
    console.error("Token error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    } else if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          error: "Token expired, silahkan gunakn token baru!",
        });
    } else if (
      error.name === "errorTokenSecretNull" ||
      error.name === "errorTokenNull" ||
      error.name === "errorTokenDecode" ||
      error.name === "errorTokenParam"
    ) {
      return res.status(401).json({ success: false, error: error.message });
    }
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
