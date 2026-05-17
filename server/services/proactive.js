// server/services/proactive.js
const { getDB } = require("../db/index");
const { pushToAll } = require("../ws/socket");
const { getMemoryProfile, getRecentMemories } = require("./memory");
const { getRelationshipAtmosphere } = require("./relationship");
const { getActivePersona } = require("./prompt");

async function getProactiveSettings(personaId) {
  const db = getDB();
  const key = personaId
    ? `proactive_settings_${personaId}`
    : "proactive_settings";
  const { data } = await db
    .from("user_profile")
    .select("value")
    .eq("key", key)
    .limit(1);
  if (data && data.length > 0) return JSON.parse(data[0].value);
  // 如果没有独立设置，读全局设置
  const { data: globalData } = await db
    .from("user_profile")
    .select("value")
    .eq("key", "proactive_settings")
    .limit(1);
  if (globalData && globalData.length > 0)
    return JSON.parse(globalData[0].value);
  return {
    enabled: true,
    idleHours: 12,
    maxPerDay: 3,
    minInterval: 4,
  };
}

async function setProactiveSettings(personaId, settings) {
  const db = getDB();
  const key = personaId
    ? `proactive_settings_${personaId}`
    : "proactive_settings";

  const { data: existing } = await db
    .from("user_profile")
    .select("id")
    .eq("key", key)
    .limit(1);

  if (existing && existing.length > 0) {
    await db
      .from("user_profile")
      .update({
        value: JSON.stringify(settings),
        updated_at: new Date().toISOString(),
      })
      .eq("key", key);
  } else {
    await db
      .from("user_profile")
      .insert({ key, value: JSON.stringify(settings) });
  }
}

async function checkProactiveMessages() {
  const { getPersonaList } = require("./prompt");
  const allPersonas = getPersonaList();
  const settings = await getProactiveSettings();
  if (!settings.enabled) return;

  // 只给启用的角色发
  const enabledIds = settings.enabledPersonas || [];
  const personas =
    enabledIds.length > 0
      ? allPersonas.filter((p) => enabledIds.includes(p.id))
      : allPersonas;

  // 计算间隔（转换成小时）
  let minInterval = settings.minInterval || 4;
  if (settings.intervalUnit === "minutes") {
    minInterval = (settings.intervalValue || 60) / 60;
  } else {
    minInterval = settings.intervalValue || 4;
  }

  for (const persona of personas) {
    const settings = await getProactiveSettings(persona.id);
    if (!settings.enabled) continue;

    // 后面的检查逻辑不变，但用 persona.id 替代全局
    const db = getDB();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    // 关系氛围影响
    let intervalMultiplier = 1;
    try {
      const { getRelationshipAtmosphere } = require("./relationship");
      const atmosphere = await getRelationshipAtmosphere(persona.id);
      if (atmosphere.phase === "close") intervalMultiplier = 0.8;
      if (atmosphere.phase === "deep") intervalMultiplier = 0.6;
      if (atmosphere.phase === "bonded") intervalMultiplier = 0.5;
    } catch {}

    const { data: todayLogs } = await db
      .from("proactive_log")
      .select("id")
      .eq("persona_id", persona.id)
      .eq("date", today);

    if (todayLogs && todayLogs.length >= settings.maxPerDay) continue;

    const { data: lastLog } = await db
      .from("proactive_log")
      .select("sent_at")
      .eq("persona_id", persona.id)
      .order("sent_at", { ascending: false })
      .limit(1);

    if (lastLog && lastLog.length > 0) {
      const hoursSince =
        (now - new Date(lastLog[0].sent_at)) / (1000 * 60 * 60);
      if (hoursSince < settings.minInterval * intervalMultiplier) continue;
    }

    // 获取最后一条用户消息
    const { data: lastMsg } = await db
      .from("messages")
      .select("timestamp")
      .eq("persona_id", persona.id)
      .eq("role", "user")
      .order("id", { ascending: false })
      .limit(1);

    const lastTime =
      lastMsg && lastMsg.length > 0 ? new Date(lastMsg[0].timestamp) : null;
    const idleHours = lastTime ? (now - lastTime) / (1000 * 60 * 60) : Infinity;

    if (idleHours < settings.idleHours) continue;

    // 生成主动消息（简化版）
    const message = await generateIdleMessage(persona.id, idleHours);
    if (!message) continue;

    await db
      .from("proactive_log")
      .insert({ persona_id: persona.id, date: today, message });
    pushToAll(message);
    console.log(`[主动消息] ${persona.id}: ${message}`);
  }
}

async function generateIdleMessage(idleHours) {
  const profile = await getMemoryProfile();
  const timeDesc = idleHours >= 24 ? "一天多" : "好久";
  const prompt = `你是用户手机里的AI伴侣。用户已经${timeDesc}没跟你说话了。
用户档案：${profile || "暂无"}
用一句话自然地打招呼或关心一下。只回复消息内容。`;
  return await callAI(prompt);
}

async function generateMemoryReminder() {
  const profile = await getMemoryProfile();
  const recentMems = await getRecentMemories(5);
  if (recentMems.length === 0 && !profile) return null;

  const recentText = recentMems.map((m) => m.content).join("\n");
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  const prompt = `你是用户手机里的AI伴侣。今天是${dateStr}。
用户档案：${profile || "暂无"}
最近记忆：${recentText || "暂无"}
判断今天是否有值得提醒的事。有则一句话提醒，没有则回复"无"。`;

  const result = await callAI(prompt);
  if (result === "无" || !result) return null;
  return result;
}

async function generateStatusMessage(hour, db) {
  if (hour >= 23 || hour <= 3) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data } = await db
      .from("messages")
      .select("id")
      .eq("role", "user")
      .gt("timestamp", oneHourAgo)
      .limit(1);

    if (data && data.length > 0) {
      const msgs = [
        "已经很晚了呢...要早点休息哦",
        "夜深了，明天还要早起吧？",
        "这么晚还没睡呀...要注意身体呢",
      ];
      return msgs[Math.floor(Math.random() * msgs.length)];
    }
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: msgCount } = await db
    .from("messages")
    .select("id", { count: "exact" })
    .eq("role", "user")
    .gt("timestamp", twoHoursAgo);

  if (msgCount && msgCount.length >= 20) {
    const msgs = [
      "今天聊了好多呀，开心~",
      "我们今天聊了好久呢，要不要休息一下眼睛？",
    ];
    return msgs[Math.floor(Math.random() * msgs.length)];
  }

  return null;
}

async function callAI(prompt) {
  try {
    const response = await fetch(
      `${process.env.AI_BASE_URL}/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Bearer ${process.env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.AI_MEMORY_MODEL || process.env.AI_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 60,
          temperature: 0.8,
        }),
      },
    );
    const data = await response.json();
    if (!data.choices || !data.choices[0]) return null;
    return data.choices[0].message.content.trim();
  } catch (e) {
    console.error("主动消息 AI 调用失败:", e);
    return null;
  }
}

module.exports = {
  checkProactiveMessages,
  getProactiveSettings,
  setProactiveSettings,
};
