require("dotenv").config({ path: __dirname + "/.env" });

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { initWebSocket } = require("./ws/socket");
const { initDB } = require("./db/index");
const apiRoutes = require("./routes/api");
const { consolidateMemories } = require("./services/memory");
const { checkProactiveMessages } = require("./services/proactive");
const { getPersonaList } = require("./services/prompt");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

initDB();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use("/api", apiRoutes);

const distPath = path.join(__dirname, "../dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(distPath, "index.html"));
    } else {
      next();
    }
  });
}

initWebSocket(server);

// 每 6 小时合并所有人格的记忆
setInterval(
  () => {
    const personas = getPersonaList();
    personas.forEach((p) => consolidateMemories(p.id));
  },
  6 * 60 * 60 * 1000,
);

setInterval(checkProactiveMessages, 30 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`服务运行在 http://localhost:${PORT}`);
});
