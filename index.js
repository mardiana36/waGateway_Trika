const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const apiRoutes = require("./routes/api");
const whatsappController = require("./controllers/whatsappController");
const app = express();
const helmet = require("helmet");
const cookieParser = require('cookie-parser');
const initDatabase = require("./config/dataBase/initDatabase");
require('dotenv').config();


app.use(cookieParser(process.env.JWT_SECRET));
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.use("/api", apiRoutes);
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "home", "index.html"));
});
app.get("/auth", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "index.html"));
});
app.get("/verify", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "verify.html"));
});
app.get("/verifyRegis", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "auth", "sendVerify.html"));
});

const PORT = process.env.BASE_PORT;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  try {
    await initDatabase();
    await whatsappController.initialize();
  } catch (error) {
    console.error("Gagal menginisialisasi server:", error);
  }
});
