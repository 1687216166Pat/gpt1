// server/services/ai.js
const { getDB } = require("../db/index");
const { pushNotification } = require("./push");
const { getFullPrompt } = require("./prompt");
const { extractMemories, getMemorySummary } = require("./memory");
const { getUserSummary } = require("./user");
const { getCurrentSession, touchSession } = require("./session");

async function handleChat(userMessage, ws, sessionId) {
  const db = getDB();

  let sid = sessionId;
  if (!sid) {
    const session = getCurrentSession();
    sid = session.id;
  }

  db.prepare(
    "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
  ).run(sid, "user", userMessage);

  touchSession(sid);

  const history = db
    .prepare(
      "SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 10",
    )
    .all(sid)
    .reverse();

  // 三层 prompt + 记忆 + 用户信息
  const fullPrompt = getFullPrompt();
  const memorySummary = getMemorySummary();
  const userSummary = getUserSummary();
  const systemContent = fullPrompt + userSummary + memorySummary;

  const body = JSON.stringify({
    model: process.env.AI_MODEL,
    messages: [
      { role: "system", content: systemContent },
      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    ],
  });

  console.log("开始请求 AI...");
  const startTime = Date.now();

  console.log("System prompt 长度:", systemContent.length, "字符");
  console.log("总消息数:", history.length + 1);

  const response = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: body,
  });

  const data = await response.json();
  console.log(`AI 响应耗时: ${Date.now() - startTime}ms`);

  if (!data.choices || !data.choices[0]) {
    console.error("AI 返回异常:", data);
    ws.send(
      JSON.stringify({
        type: "chat",
        role: "ai",
        content: "抱歉，我暂时无法回复。",
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  const aiReply = data.choices[0].message.content;

  db.prepare(
    "INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)",
  ).run(sid, "ai", aiReply);

  extractMemories(userMessage, aiReply);

  ws.send(
    JSON.stringify({
      type: "chat",
      role: "ai",
      content: aiReply,
      timestamp: new Date().toISOString(),
    }),
  );

  const preview = aiReply.length > 60 ? aiReply.slice(0, 60) + "..." : aiReply;
  pushNotification("AI 助手", preview);
}

module.exports = { handleChat };
