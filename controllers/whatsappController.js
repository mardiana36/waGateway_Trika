const { create, defaultLogger } = require("@wppconnect-team/wppconnect");
const db = require("../config/db");
const fs = require("fs/promises");
const path = require("path");
const { hash, compare } = require("bcryptjs");
const Handlebars = require("handlebars");
const whatsAppModule = require("../module/whatsAppModule");
const XLSX = require("xlsx");
const { sendVerificationEmail } = require("../config/email");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { promises } = require("dns");
require("dotenv").config();

/**
 * Menyimpan sesi wppconnect-team/wppconnect
 */
const sessions = new Map();
/**
 * Fungsi untuk melakukan inisialisasi semua sesi yang akan dieksekusi ketika server pertamakali dijalankan
 * @returns {Promise<void>} Tidak mengembalikan apapun
 */
const initializeAllSessions = async () => {
  try {
    console.log("Memulai inisialisasi semua session dari database...");
    const allSessions = await whatsAppModule.Select("sessions", {}, db, [
      "session_name",
    ]);
    if (allSessions.length === 0) {
      console.log("Tidak ada session yang perlu diinisialisasi");
      return;
    }
    console.log(`Menemukan ${allSessions.length} session untuk diinisialisasi`);
    // Mulai semua session secara parallel
    await Promise.all(
      allSessions.map(async (session) => {
        try {
          await startSession(session.session_name);
          console.log(
            `Session ${session.session_name} berhasil diinisialisasi`
          );
        } catch (error) {
          console.error(
            `Gagal menginisialisasi session ${session.session_name}:`,
            error.message
          );
        }
      })
    );
    console.log("Semua session selesai diinisialisasi");
  } catch (error) {
    console.error("Error saat menginisialisasi session:", error);
  }
};
/**
 * Fungsi yang di gunakan untuk membuat sesi dari wppconnect-team/wppconnect
 * @param {string} sessionName
 * @returns {Promise<void>} Tidak mengembalikan apapun
 */
const startSession = async (sessionName) => {
  try {
    // mematikan log wppconection
    defaultLogger.transports.forEach((t) => (t.silent = true));
    const existingSession = await whatsAppModule.Select(
      "sessions",
      { session_name: sessionName },
      db
    );

    if (existingSession.length == 0) {
      const idDevice = await whatsAppModule.Select(
        "devices",
        { name: sessionName },
        db,
        ["id"]
      );

      let id;
      if (idDevice.length == 0) {
        id = await whatsAppModule.Insert(
          "devices",
          {
            name: sessionName,
            password: await hash(crypto.randomBytes(12).toString("hex"), 10),
            email: "-",
            is_verified: 1,
          },
          db,
          true
        );
      }
      await whatsAppModule.InsertOnDuplicate(
        "sessions",
        {
          session_name: sessionName,
          device_id: idDevice[0]?.id ?? id,
          status: "disconnected",
        },
        db,
        { qr_code: null }
      );
    }
    if (sessions.get(sessionName)) {
      return console.log("Session sudah ada!");
    }
    sessions.set(sessionName, {
      name: sessionName,
      client: null,
      status: "disconnected",
      qrCode: null,
      statusQR: "not_ready",
    });
    const client = await create({
      session: sessionName,
      puppeteerOptions: {
        headless: true,
        dumpio: false,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      },
      autoClose: 0,
      waitForLogin: true,
      disableWelcome: true,
      updatesLog: true,
      logQR: true,
      browserWS: "",
      catchQR: async (base64Qr, asciiQR, attempt, urlCode) => {
        await whatsAppModule.Update(
          "sessions",
          { qr_code: base64Qr, status_qr: "ready" },
          { session_name: sessionName },
          db
        );
        sessions.set(sessionName, {
          ...sessions.get(sessionName),
          qrCode: base64Qr,
          statusQR: "ready",
        });
        console.log(`QR Code received for session ${sessionName}`);
        console.log(asciiQR);
      },
      statusFind: async (status) => {
        console.log(`Status update for ${sessionName}:`, status);
        switch (status) {
          case "isLogged":
          case "qrReadSuccess":
            await whatsAppModule.Update(
              "sessions",
              {
                qr_code: null,
                status: "authenticated",
                status_qr: "qrReadSuccess",
              },
              { session_name: sessionName },
              db
            );
            sessions.set(sessionName, {
              ...sessions.get(sessionName),
              status: "authenticated",
              qrCode: null,
              statusQR: "qrReadSuccess",
            });
            console.log(`WhatsApp authenticated for session ${sessionName}!`);
            break;
          case "qrReadError":
            await whatsAppModule.Update(
              "sessions",
              {
                status_qr: "qrReadError",
              },
              { session_name: sessionName },
              db
            );
            sessions.set(sessionName, {
              ...sessions.get(sessionName),
              statusQR: "qrReadError",
            });
            break;
          case "qrReadFail":
            await whatsAppModule.Update(
              "sessions",
              {
                status_qr: "qrReadFail",
              },
              { session_name: sessionName },
              db
            );
            sessions.set(sessionName, {
              ...sessions.get(sessionName),
              statusQR: "qrReadFail",
            });
            break;
          case "desconnectedMobile":
            await whatsAppModule.Update(
              "sessions",
              {
                status: "disconnected",
              },
              { session_name: sessionName },
              db
            );
            sessions.set(sessionName, {
              ...sessions.get(sessionName),
              status: "disconnected",
            });
            break;
          case "autocloseCalled":
            await startSession(sessionName);
            break;
          default:
            break;
        }
      },
    });
    console.log(`WhatsApp Client ${sessionName} berhasil diinisialisasi`);
    sessions.set(sessionName, { ...sessions.get(sessionName), client: client });
    setupSessionEvents(client, sessionName);
  } catch (error) {
    console.error(`Error creating session ${sessionName}:`, error);
    await whatsAppModule.Update(
      "sessions",
      {
        status: "disconnected",
      },
      { session_name: sessionName },
      db
    );
    sessions.set(sessionName, {
      ...sessions.get(sessionName),
      status: "disconnected",
    });
    throw error;
  }
};

/**
 * Fungsi ini di gunakan untuk menangkap semua jenis pesan ketika sesi berhasil di buat dan telah terautentikasi dengan WhatsApp (tertaut dengan nomor WhatsApp tertentu melalui scen QR)
 *
 * @param {*} client - client yang di dapat dari pembuatan sesi dengan wppconnect-team/wppconnect
 * @param {string} sessionName - Nama dari sesi yang berhasil di buat dengan wppconnect-team/wppconnect
 * @returns {promises<void>} Tidak mengembalikan nilai apapun
 *
 */
const setupSessionEvents = (client, sessionName) => {
  const messageDisposable = client.onAnyMessage(async (message) => {
    try {
      const dbSession = await whatsAppModule.Select(
        "sessions",
        { session_name: sessionName },
        db,
        ["id"]
      );
      if (!dbSession || dbSession.length === 0) {
        return console.error("Session tidak di temukan di database!");
      }
      const templateMessage = await whatsAppModule.Select(
        "template_message",
        { session_id: dbSession[0].id, direction: "in" },
        db
      );
      if (message.type == "chat" && message.from != "status@broadcast") {
        if (message.isGroupMsg == false) {
          let check = false;
          if (templateMessage.length > 0) {
            for (const tm of templateMessage) {
              if (tm.type == "personal") {
                if (message.body.toLowerCase() == tm.key_message) {
                  await client.sendText(message.from, tm.message);
                  await whatsAppModule.Insert(
                    "messages_in_personal",
                    {
                      message_from: message.from,
                      session_id: dbSession[0].id,
                      message: message.body,
                      template_id: tm.id,
                    },
                    db
                  );
                  check = true;
                  break;
                }
              }
            }
          }
          if (check == false && !message.fromMe) {
            await whatsAppModule.Insert(
              "messages_in_personal",
              {
                message_from: message.from,
                session_id: dbSession[0].id,
                message: message.body,
                template_id: 0,
              },
              db
            );
          }
        } else {
          await setGroup(client, dbSession[0].id);
          let check = false;
          const idWaGrup = await whatsAppModule.Select(
            "wa_group",
            { "wa_group.waId": message.chatId },
            db,
            ["wa_group.id"],
            "",
            "",
            "",
            0,
            [
              {
                type: "INNER",
                table: "sessions",
                on: `sessions.session_name = '${sessionName}'`,
              },
            ]
          );
          if (templateMessage.length > 0) {
            for (const tm of templateMessage) {
              if (tm.type == "group") {
                if (message.body.toLowerCase() == tm.key_message) {
                  await client.sendText(message.from, tm.message);
                  await whatsAppModule.Insert(
                    "messages_in_group",
                    {
                      id_waGroup: idWaGrup[0].id,
                      message: message.body,
                      template_id: tm.id,
                    },
                    db
                  );
                  check = true;
                  break;
                }
              }
            }
          }
          if (check == false && !message.fromMe) {
            await whatsAppModule.Insert(
              "messages_in_group",
              {
                id_waGroup: idWaGrup[0].id,
                message: message.body,
                template_id: 0,
              },
              db
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error handling message in session ${sessionName}:`, error);
    }
  });

  sessions.set(sessionName, {
    ...sessions.get(sessionName),
    messageListener: messageDisposable,
  });
};
/**
 * Fungsi yang di gunakan untuk menyimpan group dari WhatsApp yang telah tertaut
 *
 * @param {*} client
 * @param {*} sessionId
 * @returns {promises<void>} Tidak mengembalikan nilai
 *
 */
const setGroup = async (client, sessionId) => {
  if (!sessionId) {
    throw new Error("sessionId tidak boleh kosong");
  }

  try {
    const allChats = await client.listChats({ onlyGroups: true });
    const allGroups = allChats
      .filter((chat) => chat.isGroup)
      .map((chat) => ({
        id: chat.id?._serialized || null,
        name: chat.groupMetadata.subject || null,
        readOnly: Boolean(chat.isReadOnly),
      }))
      .filter((grup) => grup.id !== null);
    await Promise.all(
      allGroups.map(async (grup) => {
        try {
          if (!grup.id || !grup.name) {
            console.warn(
              `Data grup tidak valid - ID: ${grup.id}, Nama: ${grup.name}`
            );
            return;
          }
          const isDuplicate = await whatsAppModule.Select(
            "wa_group",
            { session_id: sessionId, waId: grup.id },
            db,
            ["waId"]
          );
          if (isDuplicate.length == 0) {
            if (!grup.readOnly) {
              const result = await whatsAppModule.Insert(
                "wa_group",
                { session_id: sessionId, name: grup.name, waId: grup.id },
                db
              );
              console.log(
                result
                  ? `[SUKSES] Insert grup ${grup.name}`
                  : `[GAGAL] Insert grup ${grup.name}`
              );
            }
          } else {
            if (!grup.readOnly) {
              const result = await whatsAppModule.InsertOnDuplicate(
                "wa_group",
                { session_id: sessionId, name: grup.name, waId: grup.id },
                db,
                { created_at: new Date() }
              );
              console.log(
                result
                  ? `[SUKSES] Insert grup2 ${grup.name}`
                  : `[GAGAL] Insert grup2 ${grup.name}`
              );
            }
          }
        } catch (error) {
          console.error(
            `[ERROR] Proses grup ${grup.name || "tanpa nama"}:`,
            error.message
          );
        }
      })
    );
  } catch (error) {
    console.error("[ERROR] Main process:", error.message);
    throw error;
  }
};
/**
 * Fungsi yang di gunakan untuk melakukan formating atau perubahan terhadap placeholder yang terdapat dalam string pada parameternya
 *
 * @param {string} template - Berisi string yang ada palceholdernya
 * @returns {string} Hasil dari perubahan terdapat palceholder yang ada dalam parameternya
 * @example
 * const a = "Hello {Nama Pelanggan} apa kabar?";
 * const hasil = prepareTemplate(a); // Hello {{nama_pelanggan}} apa kabar?
 */
const prepareTemplate = (template) => {
  return template.replace(/{([^}]+)}/g, (_, key) => {
    const varName = key.trim().toLowerCase().replace(/\s+/g, "_"); //  e.g., "Nama Pelanggan" -> "nama_pelanggan"
    return `{{${varName}}}`;
  });
};
/**
 * Menghasilkan token autentikasi JWT berdasarkan data perangkat (devices).
 * @param {object} devices - Objek yang berisi informasi perangkat atau data pengguna
 * yang akan dienkripsi dalam token JWT.
 * @returns {string} Token JWT yang terenkripsi dan berlaku selama 30 hari.
 * @example
 * const token = generateAuthToken({ id: 1, name: "Device A" });
 * // token => "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
 */
const generateAuthToken = (devices) => {
  return jwt.sign(devices, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

/**
 * Memformat nomor telepon agar memiliki kode negara Indonesia (62).
 * Jika nomor sudah diawali dengan '62', maka akan dikembalikan apa adanya.
 * Jika nomor diawali dengan '0', maka '0' akan diganti menjadi '62'.
 * @param {string|number} number - Nomor telepon yang akan diformat. Bisa berupa string atau number.
 * @returns {string} Nomor telepon yang sudah diformat dengan awalan '62'.
 * @example
 * formatNumberWithCountryCode("08123456789"); // "628123456789"
 * formatNumberWithCountryCode(85737608201);   // "6285737608201"
 * formatNumberWithCountryCode("628123456789"); // "628123456789"
 */
const formatNumberWithCountryCode = (number) => {
  number = number.toString().replace(/\s+/g, "");
  if (number.startsWith("62")) {
    return number;
  }
  if (number.startsWith("0")) {
    number = number.slice(1);
  }

  return "62" + number;
};

/**
 * Mengecek apakah sesi WhatsApp dengan nama tertentu sudah terdaftar di database.
 *
 * @async
 * @param {string} sessionName - Nama sesi yang ingin dicek di tabel 'sessions'.
 * @returns {Promise<boolean>} Mengembalikan `true` jika sesi ditemukan, `false` jika tidak ditemukan atau terjadi error.
 *
 * @example
 * const isExist = await checkSession("bot1");
 * if (isExist) {
 *   console.log("Sesi sudah ada.");
 * } else {
 *   console.log("Sesi belum ada.");
 * }
 */
const checkSession = async (sessionName) => {
  try {
    const check = await whatsAppModule.Select(
      "sessions",
      { session_name: sessionName },
      db
    );
    if (check.length > 0) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.log("[ERORR] Masalh cek sesi:", error.message);
    return false;
  }
};

const isValidIDGroup = async (idGroup) => {
  try {
    await client.groupMetadata(idGroup);
    return true;
  } catch (error) {
    return false;
  }
};
/**
 * Object Controller yang di gunakan untuk membungkus beberapa method di dalamnya yang berfugsi untuk menerima request dan memberikan respone ke route api.
 *@namespace whatsappController
 */
const whatsappController = {
  /**
   * Menginisialisasi semua sesi WhatsApp saat aplikasi dimulai.
   * @async
   * @example
   * whatsappController.initialize();
   */
  initialize: async () => {
    await initializeAllSessions();
  },

  /**
   * Memulai sesi WhatsApp baru.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama unik sesi WhatsApp
   * @returns {object} Response JSON dengan status operasi
   * @example
   * // Request body:
   * // { "sessionName": "myBot" }
   */
  startSessionWa: async (req, res) => {
    const { sessionName } = req.body;
    try {
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      await startSession(sessionName);
      res.json({
        success: true,
        message: "Sesi sudah berjalan dan berhasil terautentikasi.",
      });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },

  /**
   * Mendaftarkan perangkat baru untuk sesi WhatsApp.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.username - Nama pengguna unik
   * @param {string} req.body.email - Email pengguna
   * @param {string} req.body.password - Password minimal 6 karakter
   * @returns {object} Response JSON dengan status registrasi
   * @example
   * // Request body:
   * // { "username": "myBot", "email": "bot@example.com", "password": "secret1234" }
   */
  registerSession: async (req, res) => {
    const { username, email, password } = req.body;
    try {
      if (typeof username != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data username harus String.",
        });
      }
      if (typeof email != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data email harus String.",
        });
      }
      if (typeof password != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data password harus String.",
        });
      }

      const checkUsername = await whatsAppModule.Select(
        "devices",
        { name: username },
        db,
        ["id"]
      );
      const existingDevice = await whatsAppModule.Select(
        "devices",
        { email: email },
        db
      );
      if (existingDevice.length > 0) {
        return res.status(400).json({
          success: false,
          error: "Email sudah di gunakan. Silhakan gunakan email yang lain!",
        });
      }
      if (checkUsername.length == 0) {
        const hashPassword = await hash(password, 10);
        const idDevice = await whatsAppModule.Insert(
          "devices",
          { name: username, password: hashPassword, email: email },
          db,
          true
        );
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        const response = await whatsAppModule.Insert(
          "tokens",
          {
            device_id: idDevice,
            token: verificationToken,
            token_type: "email_verification",
            expires_at: expiresAt,
          },
          db
        );
        if (response) {
          await sendVerificationEmail(email, verificationToken);
          res.status(200).json({
            success: true,
            message:
              "Registrasi berhasil! Silahkan cek email anda untuk memverifikasi akun anda. ",
          });
        } else {
          res.status(202).json({
            success: false,
            error: "Registrasi, Internal server error!!!",
          });
        }
      } else {
        res.status(202).json({
          success: false,
          error: "Nama Bot sudah terdaftar gunakan nama lain!",
        });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },

  /**
   * Memverifikasi email pengguna berdasarkan token.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.query.token - Token verifikasi dari email
   * @returns {object} Response JSON dengan status verifikasi
   * @example
   * // URL request:
   * // /verify-email?token=abc123def456
   */
  verifyEmail: async (req, res) => {
    try {
      const { token } = req.query;
      await whatsAppModule.Delete("tokens", { expires_at: new Date() }, db);

      const tokenRecord = await whatsAppModule.Select(
        "tokens",
        {
          "tokens.token": token,
          "tokens.token_type": "email_verification",
          "tokens.expires_at": { operator: ">", value: new Date() },
        },
        db,
        ["tokens.*"],
        "AND",
        "",
        "",
        0,
        [
          {
            type: "INNER",
            table: "devices",
            on: "tokens.device_id = devices.id",
          },
        ]
      );
      if (!tokenRecord[0]) {
        return res.status(400).json({
          success: false,
          error: "Invalid atau token verifikasi kadalwarsa.",
        });
      }
      await whatsAppModule.Update(
        "devices",
        { is_verified: true },
        { id: tokenRecord[0].device_id },
        db
      );
      await whatsAppModule.Delete("tokens", { id: tokenRecord[0].id }, db);
      res.json({
        success: true,
        message: "Verifikasi email berhasil! Anda bisa login sekarang.",
      });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Login ke sesi WhatsApp yang sudah terdaftar.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.identify - Username atau email
   * @param {string} req.body.password - Password pengguna
   * @returns {object} Response JSON dengan status login
   * @example
   * // Request body:
   * // { "identify": "myBot", "password": "secret" }
   */
  loginSession: async (req, res) => {
    const { identify, password } = req.body;
    try {
      if (typeof identify != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data identify harus String.",
        });
      }
      if (typeof password != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data password harus String.",
        });
      }

      const response = await whatsAppModule.Select(
        "devices",
        { name: identify, email: identify },
        db,
        ["*"],
        "OR",
        "",
        "",
        0
      );
      if (response.length > 0) {
        const isMatch = await compare(password, response[0].password);
        const sessionName = response[0].name;
        const session = sessions.get(sessionName);
        if (!isMatch) {
          return res.status(202).json({
            success: false,
            message: "Password yang dimasukan salah!",
          });
        }
        if (!response[0].is_verified) {
          return res.status(202).json({
            success: false,
            message:
              "Email belum terverifikasi. Silahkan cek email anda untuk melakukan verifikasi.",
          });
        }
        const authToken = generateAuthToken({
          id: response[0].id,
        });
        res.cookie("token", authToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          signed: true,
          sameSite: "Strict",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });
        if (session && session.status == "authenticated") {
          return res.status(200).json({
            success: true,
            message: `Selamat datang ${sessionName}`,
          });
        }
        res.json({
          success: true,
          message: `Selamat datang ${sessionName}`,
        });
        await startSession(sessionName, false);
      } else {
        return res
          .status(202)
          .json({ success: false, message: "Nama/Email Belum terdaftar!" });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },

  /**
   * Logout dari sesi WhatsApp saat ini.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @returns {object} Response JSON dengan status logout
   */
  logoutSession: async (req, res) => {
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        signed: true,
      });

      res.status(200).json({
        success: true,
        message: "Berhasil logout",
      });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  /**
   * Mendapatkan nama sesi aktif pengguna.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @returns {object} Response JSON berisi nama sesi
   */
  getSessionName: async (req, res) => {
    const { name } = req.device;
    if (typeof name != "string") {
      return res.status(400).json({
        success: false,
        error: "Tipe data name harus String.",
      });
    }
    try {
      if (!name) {
        res
          .status(202)
          .json({ success: false, message: "Silahkan Login terlebih dahulu!" });
      }
      res.json({ success: true, data: name });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  },

  /**
   * Menghapus sesi WhatsApp beserta data tokens sesuai sesinya.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi yang akan dihapus
   * @returns {object} Response JSON dengan status penghapusan
   */
  deleteSession: async (req, res) => {
    const { sessionName } = req.body;
    const tokenFolder = path.join(__dirname, "..", "tokens", sessionName);

    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      const session = sessions.get(sessionName);

      if (!session || session.status !== "authenticated") {
        return res.status(400).json({
          success: false,
          error:
            "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu.",
        });
      }

      if (session?.client) {
        const browserProcess = await session.client.getPID();
        await session.client.closeChat();
        await session.client.stopPhoneWatchdog();
        await session.client.logout();
        if (browserProcess) {
          try {
            const { execSync } = require("child_process");
            execSync(`taskkill /F /T /PID ${browserProcess} 2> nul`, {
              stdio: "ignore",
              windowsHide: true,
            });
          } catch (e) {
            console.warn("Proses sudah terminasi:", e.message);
          }
        }

        await session.client.close();
        sessions.delete(sessionName);
      }

      // 4. Hapus folder token dengan retry
      await (async function deleteWithRetry(path, retries = 3) {
        for (let i = 0; i < retries; i++) {
          try {
            await fs.rm(path, { recursive: true, force: true });
            return;
          } catch (err) {
            if (i === retries - 1) throw err;
            await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
          }
        }
      })(tokenFolder);

      await whatsAppModule.Delete(
        "sessions",
        { session_name: sessionName },
        db
      );

      res.json({
        success: true,
        message: `Session ${sessionName} berhasil dihapus`,
      });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({
        success: false,
        error: "Internal Server Error.",
        debugTip: "Cek apakah semua proses Chromium sudah berhenti",
      });
    }
  },

  /**
   * Mengganti perangkat untuk sesi WhatsApp (logout paksa).
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi yang akan diganti perangkatnya
   * @returns {object} Response JSON dengan status operasi
   */
  changeDevice: async (req, res) => {
    const { sessionName } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      const session = sessions.get(sessionName);
      if (!session || session.status !== "authenticated") {
        return res.status(400).json({
          success: false,
          error:
            "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu.",
        });
      }
      try {
        await session.client.waitForPageLoad();
        const state = await session.client.getConnectionState();
        if (state === "CONNECTED") {
          await session.client.logout();
          await new Promise((r) => setTimeout(r, 10000));
        } else {
          console.warn(
            `[${sessionName}] Tidak dalam kondisi terkoneksi, skip logout.`
          );
        }
      } catch (logoutErr) {
        throw logoutErr;
      }

      const response = await whatsAppModule.Update(
        "sessions",
        { status: "disconnected", status_qr: "not_ready" },
        { session_name: sessionName },
        db
      );

      if (response) {
        res.status(200).json({ success: true });
      }
    } catch (logoutErr) {
      console.log("[Error] Terjadi masalah: ", logoutErr.message);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Mendapatkan QR code untuk autentikasi WhatsApp.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi target
   * @returns {object} Response JSON berisi QR code atau status
   */
  getQRCode: async (req, res) => {
    const { sessionName } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      const session = sessions.get(sessionName);
      if (session && session?.qrCode && session?.statusQR == "ready") {
        res.json({
          success: true,
          qr: session.qrCode,
          statusQR: session.statusQR,
        });
      } else {
        res.status(200).json({ success: true, statusQR: session.statusQR });
      }
    } catch (logoutErr) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  /**
   * Preview data dari file Excel sebelum diproses.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {Buffer} req.file.buffer - File Excel dalam bentuk buffer
   * @returns {object} Response JSON berisi data preview
   */
  prewiewExcel: async (req, res) => {
    try {
      const fileBuffer = req.file.buffer;
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const data = XLSX.utils.sheet_to_json(sheet);

      res.json({ success: true, data: data });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error" });
    }
  },

  /**
   * Mengirim pesan ke banyak nomor WhatsApp sekaligus.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi pengirim
   * @param {string|string[]} req.body.number - Nomor tujuan (bisa array)
   * @param {string|string[]} req.body.message - Pesan yang dikirim (bisa array)
   * @param {number} [req.body.delay=300] - Delay antar pengiriman (ms)
   * @returns {object} Response JSON dengan hasil pengiriman
   */
  sendBulkMessage: async (req, res) => {
    const { sessionName, number, message, delay = 300 } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      if (typeof message != "string" && !Array.isArray(message)) {
        return res.status(400).json({
          success: false,
          error: "Tipe data message harus String atau Array.",
        });
      }
      if (typeof number != "string" && !Array.isArray(number)) {
        return res.status(400).json({
          success: false,
          error: "Tipe data number harus String atau Array.",
        });
      }

      // Cek apakah session ada dan terautentikasi
      const session = sessions.get(sessionName);
      if (!session || session.status !== "authenticated") {
        return res.status(400).json({
          success: false,
          error:
            "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu.",
        });
      }

      const client = session.client;
      if (!client) {
        console.log("[WARNING] Client tidak tersedia");
      }

      const dbSession = await whatsAppModule.Select(
        "sessions",
        { session_name: sessionName },
        db,
        ["id"]
      );
      if (!dbSession || dbSession.length === 0) {
        return console.error("Session tidak di temukan di database!");
      }
      const numbers = Array.isArray(number) ? number : [number];
      const messages = Array.isArray(message) ? message : [message];
      const results = [];
      const formatNumbers = numbers.map(formatNumberWithCountryCode);

      for (const [index, no] of formatNumbers.entries()) {
        const recipient = `${no}@c.us`;
        const msg = messages[index % messages.length];
        try {
          await client.sendText(recipient, msg);
          await whatsAppModule.Insert(
            "messages_out_personal",
            {
              session_id: dbSession[0].id,
              send_to: no,
              content: msg,
              status: "send",
            },
            db
          );
          results.push({ no, status: "success", message: msg });
          if (index < formatNumbers.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        } catch (error) {
          await whatsAppModule.Insert(
            "messages_out_personal",
            {
              session_id: dbSession[0].id,
              send_to: no,
              content: msg,
              status: "failed",
            },
            db
          );
          results.push({
            no,
            status: "failed",
            message: msg,
            error: error.message,
          });
        }
      }
      res.json({
        success: true,
        results: Array.isArray(number) ? results : results[0],
      });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({
        success: false,
        error: "Internal server error.",
      });
    }
  },

  /**
   * Mendapatkan daftar grup WhatsApp yang diikuti bot(nomor WhatsApp yang telah tertaut).
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi target
   * @returns {object} Response JSON berisi daftar grup
   */
  getGroups: async (req, res) => {
    const { sessionName } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      const session = sessions.get(sessionName);
      if (!session || session.status !== "authenticated") {
        return res.status(400).json({
          success: false,
          error:
            "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu.",
        });
      }

      const client = session.client;
      const dbSession = await whatsAppModule.Select(
        "sessions",
        { session_name: sessionName },
        db,
        ["id"]
      );

      if (!dbSession || (dbSession.length === 0 && !client)) {
        return res
          .status(404)
          .json({ success: false, error: "Session tidak ditemukan!" });
      }
      const sessionId = dbSession[0].id;
      await setGroup(client, sessionId);
      const response = await whatsAppModule.Select(
        "wa_group",
        { session_id: sessionId },
        db
      );
      if (response.length > 0) {
        res.status(200).json({ success: true, data: response });
      } else {
        res
          .status(404)
          .json({ success: false, error: "Bot belum memiliki grup" });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  },

  /**
   * Menghapus semua grup dari database untuk sesi tertentu.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi target
   * @returns {object} Response JSON dengan status penghapusan
   */
  deleteGroups: async (req, res) => {
    try {
      const { sessionName } = req.body;
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      const session = sessions.get(sessionName);
      if (!session || session.status !== "authenticated") {
        return res.status(400).json({
          success: false,
          error:
            "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu.",
        });
      }
      const dbSession = await whatsAppModule.Select(
        "sessions",
        { session_name: sessionName },
        db,
        ["id"]
      );
      const sessionId = dbSession[0].id;
      const response = await whatsAppModule.Delete(
        "wa_group",
        { session_id: sessionId },
        db
      );
      if (response) {
        res.status(200).json({ success: true, message: "Delete success." });
      } else {
        res.status(400).json({
          success: false,
          message: "Terjadi masalah saat hapus grup! Atau group kosong.",
        });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({
        success: false,
        error: "Internal Server Error",
      });
    }
  },

  /**
   * Mengirim pesan ke beberapa grup WhatsApp sekaligus.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi pengirim
   * @param {string[]} req.body.groupsId - ID grup tujuan
   * @param {string} req.body.message - Pesan yang dikirim
   * @param {number} req.body.delay - delay pengiriman pesan (default 300ms)
   * @returns {object} Response JSON dengan hasil pengiriman
   */
  sendGroupsMessage: async (req, res) => {
    const { sessionName, groupsId, message, delay = 300 } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof message != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data message harus String.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      if (!Array.isArray(groupsId)) {
        return res.status(400).json({
          success: false,
          error: "Tipe data groupsId harus Array.",
        });
      }
      const session = sessions.get(sessionName);
      if (!session || session.status !== "authenticated") {
        return res.status(400).json({
          success: false,
          error:
            "WhatsApp Gateway belum terautentikasi! Silahkan scan QR code terlebih dahulu.",
        });
      }

      const client = session.client;
      const dbSession = await whatsAppModule.Select(
        "sessions",
        { session_name: sessionName },
        db,
        ["id"]
      );

      if (!dbSession || (dbSession.length === 0 && !client)) {
        return res
          .status(404)
          .json({ success: false, error: "Session tidak ditemukan!" });
      }
      const sessionId = dbSession[0].id;

      const results = [];
      if (groupsId.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Bot belum memiliki grup",
        });
      }

      for (const groupId of groupsId) {
        try {
          const idWaGrup = await whatsAppModule.Select(
            "wa_group",
            { session_id: sessionId, waId: groupId },
            db,
          );
          if (!isValidIDGroup(groupId) || idWaGrup.length == 0) {
            throw new Error("Id group tidak valid.");
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          // modif nanti buat valid group
          await client.sendText(groupId, message);
          await whatsAppModule.Insert(
            "messages_out_group",
            {
              session_id: sessionId,
              groupId: groupId,
              message: message,
              status: "send",
            },
            db
          );
          results.push({ groupId, status: "send", message: message });
        } catch (error) {
          await whatsAppModule.Insert(
            "messages_out_group",
            {
              session_id: sessionId,
              groupId: groupId,
              message: message,
              status: "failed",
            },
            db
          );
          results.push({
            groupId,
            status: "failed",
            error: "Gagal Mengirim Pesan! " + error.message,
          });
        }
      }
      res.json({
        success: true,
        results,
      });
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  },

  /**
   * Membuat template pesan baru.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi pemilik template
   * @param {string} req.body.name - Nama template
   * @param {string} req.body.keyMessage - Key unik jika di gunakan untuk menjawab pesan otomatis dan param direction harus 'in' agar berfungsi
   * @param {string} req.body.message - Konten template
   * @param {'in'|'out'} req.body.direction - Arah pesan (incoming/outgoing) dengan param 'in' atau 'out'
   * @param {'personal'|'group'} req.body.type - Tipe penerima dengan param 'personal' atau 'group'
   * @param {string} req.body.placeholder - Contoh placeholder "{Nama Pelanggan}, {periode}, {Nomor Telepon}"
   * @returns {object} Response JSON dengan status pembuatan
   */
  createTemplateMessage: async (req, res) => {
    const {
      sessionName,
      name,
      keyMessage,
      message,
      direction,
      type,
      placeholder,
    } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      if (typeof name != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data name harus String.",
        });
      }
      if (typeof keyMessage != "string" && keyMessage) {
        return res.status(400).json({
          success: false,
          error: "Tipe data keyMessage harus String.",
        });
      }
      if (typeof message != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data message harus String.",
        });
      }
      if (
        typeof direction != "string" &&
        (direction != "in" || direction != "out")
      ) {
        return res.status(400).json({
          success: false,
          error: "Tipe data direction harus String dan berisi 'in' atau 'out'",
        });
      }
      if (typeof type != "string" && (type != "personal" || type != "group")) {
        return res.status(400).json({
          success: false,
          error:
            "Tipe data type harus String dan berisi 'personal' atau 'group'",
        });
      }
      if ( placeholder && typeof placeholder != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data placeholder harus String.",
        });
      }
      const idSession = await whatsAppModule.Select(
        "sessions",
        { session_name: sessionName },
        db,
        ["id"]
      );
      const response = await whatsAppModule.Insert(
        "template_message",
        {
          session_id: idSession[0].id,
          name: name,
          key_message: keyMessage ?? "",
          message: message,
          direction: direction,
          type: type,
          placeholder: placeholder ?? "",
        },
        db
      );
      if (response) {
        res
          .status(200)
          .json({ success: true, message: "Templat pesan berhasil disimpan." });
      } else {
        res.status(200).json({
          success: false,
          message: "Terjadi masalah saat menamabhakan template pesan!",
        });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Memperbarui template pesan yang sudah ada.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {number} req.body.id - ID template
   * @param {string} req.body.sessionName - Nama sesi pemilik template
   * @param {string} req.body.name - Nama template baru
   * @param {string} req.body.keyMessage - Key template baru
   * @param {string} req.body.message - Konten template baru
   * @param {'in'|'out'} req.body.direction - Arah pesan baru param ('in' atau 'out')
   * @param {'personal'|'group'} req.body.type - Tipe penerima baru param ('personal' atau 'group')
   * @param {string} req.body.placeholder - Placeholder baru
   * @returns {object} Response JSON dengan status pembaruan
   */
  updateTemplateMessage: async (req, res) => {
    const {
      id,
      sessionName,
      name,
      keyMessage,
      message,
      direction,
      type,
      placeholder,
    } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "id tidak boleh kosong.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      if (typeof name != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data name harus String.",
        });
      }
      if (typeof keyMessage != "string" && keyMessage) {
        return res.status(400).json({
          success: false,
          error: "Tipe data keyMessage harus String.",
        });
      }
      if (typeof message != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data message harus String.",
        });
      }
      if (
        typeof direction != "string" &&
        (direction != "in" || direction != "out")
      ) {
        return res.status(400).json({
          success: false,
          error: "Tipe data direction harus String dan berisi 'in' atau 'out'",
        });
      }
      if (typeof type != "string" && (type != "personal" || type != "group")) {
        return res.status(400).json({
          success: false,
          error:
            "Tipe data type harus String dan berisi 'personal' atau 'group'",
        });
      }
      if (typeof placeholder != "string" && placeholder) {
        return res.status(400).json({
          success: false,
          error: "Tipe data placeholder harus String.",
        });
      }
      const response = await whatsAppModule.Update(
        "template_message",
        {
          name: name,
          key_message: keyMessage ?? "",
          message: message,
          direction: direction,
          type: type,
          placeholder: placeholder ?? "",
          updated_at: new Date(),
        },
        { id: id },
        db
      );
      if (response) {
        res.status(200).json({
          success: true,
          message: "Templat pesan berhasil diperbarui.",
        });
      } else {
        res.status(200).json({
          success: false,
          message: "Terjadi masalah saat memperbarui template pesan!",
        });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Menghapus template pesan.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {number} req.body.id - ID template
   * @param {string} req.body.sessionName - Nama sesi pemilik template
   * @returns {object} Response JSON dengan status penghapusan
   */
  deleteTemplateMessage: async (req, res) => {
    const { id, sessionName } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "id tidak boleh kosong.",
        });
      }
      const response = await whatsAppModule.Delete(
        "template_message",
        { id: id },
        db
      );
      if (response) {
        res.status(200).json({
          success: true,
          message: "Template Pesan berhasil dihapus.",
        });
      } else {
        res.status(200).json({
          success: false,
          message: "Terjadi masalah saat mengahpus template pesan!",
        });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Mendapatkan semua template pesan untuk sesi tertentu.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi target
   * @returns {object} Response JSON berisi daftar template
   */
  readsTemplateMessages: async (req, res) => {
    const { sessionName } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      const response = await whatsAppModule.Select(
        "template_message",
        { session_name: sessionName },
        db,
        ["template_message.*"],
        "",
        "",
        "",
        0,
        [
          {
            type: "INNER",
            table: "sessions",
            on: " template_message.session_id = sessions.id",
          },
        ]
      );

      if (response.length > 0) {
        res.status(200).json({ success: true, data: response });
      } else {
        res
          .status(200)
          .json({ success: false, error: "Tampalate pesan masih kosong!" });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Mendapatkan detail template pesan berdasarkan ID.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {number} req.body.id - ID template
   * @param {string} req.body.sessionName - Nama sesi pemilik template
   * @returns {object} Response JSON berisi detail template
   */
  readsTemplateMessage: async (req, res) => {
    const { id, sessionName } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (!id) {
        return res.status(400).json({
          success: false,
          error: "id tidak boleh kosong.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      const response = await whatsAppModule.Select(
        "template_message",
        { "template_message.id": id },
        db,
        ["template_message.*"],
        "",
        "",
        "",
        0,
        [
          {
            type: "INNER",
            table: "sessions",
            on: `sessions.session_name = '${sessionName}'`,
          },
        ]
      );
      if (response.length > 0) {
        res.status(200).json({ success: true, data: response[0] });
      } else {
        res
          .status(400)
          .json({ success: false, error: "Tampalate tidak ditemukan" });
      }
    } catch (error) {
      console.log("[Error] Terjadi masalah: ", error.message);
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Mendapatkan template pesan berdasarkan tipe penerima.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.sessionName - Nama sesi target
   * @param {'personal'|'group'} req.body.type - Tipe penerima param ('personal' atau 'group')
   * @returns {object} Response JSON berisi template sesuai tipe
   */
  readsTemplateMessagesByType: async (req, res) => {
    const { sessionName, type } = req.body;
    try {
      if (!(await checkSession(sessionName))) {
        return res.status(400).json({
          success: false,
          error: "Sesi ini belum ada! Silahkan mulai sesinya terlebih dahulu.",
        });
      }
      if (typeof sessionName != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data sessionName harus String.",
        });
      }
      if (typeof type != "string" && (type != "personal" || type != "group")) {
        return res.status(400).json({
          success: false,
          error:
            "Tipe data type harus String dan berisi 'personal' atau 'group'",
        });
      }
      const response = await whatsAppModule.Select(
        "template_message",
        {
          direction: "out",
          "sessions.session_name": sessionName,
          "template_message.type": type,
        },
        db,
        ["template_message.*"],
        "",
        "",
        "",
        0,
        [
          {
            type: "INNER",
            table: "sessions",
            on: "template_message.session_id = sessions.id",
          },
        ]
      );
      if (response.length > 0) {
        res.status(200).json({ success: true, data: response });
      } else {
        res
          .status(404)
          .json({ success: false, error: "Tampalate pesan masih kosong!" });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },

  /**
   * Preview header kolom dari file Excel untuk template.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {Buffer} req.file.buffer - File Excel dalam bentuk buffer
   * @returns {object} Response JSON berisi daftar placeholder
   */
  prewiewExcelTemplate: async (req, res) => {
    try {
      const fileBuffer = req.file.buffer;
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headerRow = allRows[0].map((v) => {
        return `{${v.trim()}}`;
      });

      headerRow.push("{periode}");

      res.json({ success: true, data: headerRow });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Internal server error.",
      });
    }
  },

  /**
   * Mengimplementasikan template pesan dengan data dinamis.
   * @async
   * @param {object} req - Request object
   * @param {object} res - Response object
   * @param {string} req.body.templateMessage - Template pesan dengan placeholder
   * @param {object} req.body.filleds - Data untuk mengganti placeholder
   * @returns {object} Response JSON berisi pesan yang sudah di-render
   * @example
   * // Request body:
   * // {
   * //   "templateMessage": "Hello {name}! Your code: {code}",
   * //   "filleds": {"name": "John", "code": "ABC123"}
   * // }
   */
  implementasionTemplate: async (req, res) => {
    try {
      const { templateMessage, filleds } = req.body;
      if (typeof templateMessage != "string") {
        return res.status(400).json({
          success: false,
          error: "Tipe data templateMessage harus String.",
        });
      }

      if (typeof filleds != "object") {
        return res.status(400).json({
          success: false,
          error: "Tipe data filleds harus String.",
        });
      }

      const filledData = Object.entries(filleds).reduce((acc, [key, value]) => {
        const newKey = key.trim().toLocaleLowerCase().replace(/\s+/g, "_");
        acc[newKey] = value;
        return acc;
      }, {});
      const template = Handlebars.compile(prepareTemplate(templateMessage));
      const data = template(filledData);
      res.status(200).json({ success: true, data: data });
    } catch (error) {
      res.status(500).json({ success: false, error: "Internal server error." });
    }
  },
};

module.exports = whatsappController;
