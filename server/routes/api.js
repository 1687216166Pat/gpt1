// server/routes/api.js
const express = require("express");
const router = express.Router();
const { reportStatus, getLatestStatus } = require("../services/phone");
const { addSubscription } = require("../services/push");
const { getAllMemories } = require("../services/memory");
const { setUserInfo, getAllUserInfo } = require("../services/user");
const {
  createSession,
  getSessions,
  getSessionMessages,
  deleteSession,
  getCurrentSession,
} = require("../services/session");
const {
  getPersonaList,
  getActivePersona,
  setActivePersona,
  getUserPrompt,
  setUserPrompt,
  getUserPromptTemplate,
} = require("../services/prompt");
const { getDB } = require("../db/index");

// 手机状态
router.post("/phone/status", (req, res) => {
  const { type, data } = req.body;
  reportStatus(type, data);
  res.json({ success: true });
});

router.get("/phone/status", (req, res) => {
  const status = getLatestStatus();
  res.json(status);
});

// 聊天记录
router.get("/messages", (req, res) => {
  const session = getCurrentSession();
  const messages = getSessionMessages(session.id);
  res.json(messages);
});

// 会话管理
router.get("/sessions", (req, res) => {
  res.json(getSessions());
});

router.post("/sessions", (req, res) => {
  const { title } = req.body;
  const id = createSession(title);
  res.json({ id, title: title || "新对话" });
});

router.delete("/sessions/:id", (req, res) => {
  deleteSession(req.params.id);
  res.json({ success: true });
});

router.get("/sessions/:id/messages", (req, res) => {
  const messages = getSessionMessages(req.params.id);
  res.json(messages);
});

// 记忆
router.get("/memories", (req, res) => {
  res.json(getAllMemories());
});

// 用户信息
router.get("/user", (req, res) => {
  res.json(getAllUserInfo());
});

router.post("/user", (req, res) => {
  const { key, value } = req.body;
  setUserInfo(key, value);
  res.json({ success: true });
});

// Prompt 管理 - 人格层
router.get("/prompts/personas", (req, res) => {
  res.json({
    personas: getPersonaList(),
    active: getActivePersona(),
  });
});

router.post("/prompts/personas/:id/activate", (req, res) => {
  const success = setActivePersona(req.params.id);
  res.json({ success });
});

// Prompt 管理 - 用户偏好层
router.get("/prompts/user", (req, res) => {
  res.json({
    content: getUserPrompt(),
    template: getUserPromptTemplate(),
  });
});

router.post("/prompts/user", (req, res) => {
  const { content } = req.body;
  setUserPrompt(content);
  res.json({ success: true });
});

// 推送订阅
router.post("/push/subscribe", (req, res) => {
  addSubscription(req.body);
  res.json({ success: true });
});

router.get("/push/vapid-key", (req, res) => {
  res.json({ key: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
