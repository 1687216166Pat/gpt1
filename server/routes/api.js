const express = require("express");
const router = express.Router();
const { reportStatus, getLatestStatus } = require("../services/phone");
const { addSubscription } = require("../services/push");
const {
  getRecentMemories,
  deleteRecentMemory,
  getMemoryProfile,
  setMemoryProfile,
  consolidateMemories,
} = require("../services/memory");
const { setUserInfo, getAllUserInfo } = require("../services/user");
const {
  getPersonaList,
  getActivePersona,
  setActivePersona,
  getUserPrompt,
  setUserPrompt,
  getUserPromptTemplate,
} = require("../services/prompt");
const {
  getProactiveSettings,
  setProactiveSettings,
  checkProactiveMessages,
} = require("../services/proactive");

// 手机状态
router.post("/phone/status", async (req, res) => {
  const { type, data } = req.body;
  await reportStatus(type, data);
  res.json({ success: true });
});

router.get("/phone/status", async (req, res) => {
  const status = await getLatestStatus();
  res.json(status);
});

// 聊天记录 - 按人格获取
router.get("/messages/:personaId", async (req, res) => {
  const { getDB } = require("../db/index");
  const db = getDB();
  const { data } = await db
    .from("messages")
    .select("*")
    .eq("persona_id", req.params.personaId)
    .order("id", { ascending: false })
    .limit(50);
  res.json((data || []).reverse());
});

// 记忆管理 - 按人格
router.get("/memories/:personaId", async (req, res) => {
  const profile = await getMemoryProfile(req.params.personaId);
  const recent = await getRecentMemories(req.params.personaId, 50);
  res.json({ profile, recent });
});

router.put("/memories/:personaId/profile", async (req, res) => {
  const { content } = req.body;
  await setMemoryProfile(req.params.personaId, content);
  res.json({ success: true });
});

router.delete("/memories/recent/:id", async (req, res) => {
  await deleteRecentMemory(req.params.id);
  res.json({ success: true });
});

router.post("/memories/:personaId/consolidate", async (req, res) => {
  try {
    await consolidateMemories(req.params.personaId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 用户信息
router.get("/user", async (req, res) => {
  const info = await getAllUserInfo();
  res.json(info);
});

router.post("/user", async (req, res) => {
  const { key, value } = req.body;
  await setUserInfo(key, value);
  res.json({ success: true });
});

// Prompt 管理
router.get("/prompts/personas", (req, res) => {
  res.json({
    personas: getPersonaList(),
    active: getActivePersona(),
  });
});

router.post("/prompts/personas/:id/activate", async (req, res) => {
  const success = await setActivePersona(req.params.id);
  res.json({ success });
});

router.get("/prompts/user", async (req, res) => {
  const content = await getUserPrompt();
  res.json({
    content,
    template: getUserPromptTemplate(),
  });
});

router.post("/prompts/user", async (req, res) => {
  const { content } = req.body;
  await setUserPrompt(content);
  res.json({ success: true });
});

// 主动消息
router.get("/proactive/settings", async (req, res) => {
  const settings = await getProactiveSettings();
  res.json(settings);
});

router.post("/proactive/settings", async (req, res) => {
  await setProactiveSettings(req.body);
  res.json({ success: true });
});

router.post("/proactive/trigger", async (req, res) => {
  await checkProactiveMessages();
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
