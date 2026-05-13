// server/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { initWebSocket } = require("./ws/socket");
const { initDB } = require("./db/index");
const apiRoutes = require("./routes/api");

const app = express();
const server = http.createServer(app);
const PORT = 3001;

initDB();

app.use(cors());
app.use(express.json());
app.use("/api", apiRoutes);

initWebSocket(server);

server.listen(PORT, () => {
  console.log(`服务运行在 http://localhost:${PORT}`);
});
