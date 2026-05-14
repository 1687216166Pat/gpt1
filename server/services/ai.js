const { getDB } = require("../db/index");
const { pushNotification } = require("./push");
const { getFullPrompt } = require("./prompt");
const {
  extractMemoryByAI,
  saveDailyMemory,
  buildMemoryContextAsync,
  getSessionMemory,
  detectPatterns,
} = require("./memory");

function getTimeContext() {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const weekday = weekdays[now.getDay()];
  const month = now.getMonth() + 1;
  const date = now.getDate();
  const year = now.getFullYear();

  let period = "";
  if (hour >= 5 && hour < 9) period = "清晨";
  else if (hour >= 9 && hour < 12) period = "上午";
  else if (hour >= 12 && hour < 14) period = "中午";
  else if (hour >= 14 && hour < 17) period = "下午";
  else if (hour >= 17 && hour < 19) period = "傍晚";
  else if (hour >= 19 && hour < 22) period = "晚上";
  else if (hour >= 22 || hour < 2) period = "深夜";
  else period = "凌晨";

  return `[当前时间] 现在是${year}年${month}月${date}日 周${weekday} ${hour}:${minute.toString().padStart(2, "0")} ${period}。你能感知到这个时间。`;
}

async function handleChat(userMessage, ws, personaId) {
  const db = getDB();
  const pid = personaId || "xiaorou";
  const nowISO = new Date().toISOString();

  // 存用户消息
  await db.from("messages").insert({
    persona_id: pid,
    role: "user",
    content: userMessage,
    timestamp: nowISO,
  });

  // 检测行为模式
  detectPatterns(pid, userMessage);

  // 获取历史
  const history = await getSessionMemory(pid, 10);

  // 构建 prompt
  const timeContext = getTimeContext();
  const fullPrompt = getFullPrompt();
  const memoryContext = await buildMemoryContextAsync(pid, userMessage);

  const systemContent = `${fullPrompt}
${timeContext}
${memoryContext}`;

  const messages = [
    { role: "system", content: systemContent },
    ...history.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  const body = JSON.stringify({
    model: process.env.AI_MODEL,
    messages,
  });

  const totalChars =
    systemContent.length +
    history.reduce((sum, m) => sum + m.content.length, 0) +
    userMessage.length;
  const estimatedTokens = Math.round(totalChars * 1.5);

  console.log("System prompt 长度:", systemContent.length, "字符");
  console.log("开始请求 AI...");
  const startTime = Date.now();

  const response = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${process.env.AI_API_KEY}`,
    },
    body: body,
  });

  const data = await response.json();
  const elapsed = Date.now() - startTime;
  console.log(`AI 响应耗时: ${elapsed}ms`);

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

  // 存 AI 回复
  await db.from("messages").insert({
    persona_id: pid,
    role: "ai",
    content: aiReply,
    timestamp: new Date().toISOString(),
  });

  // 提取记忆
  extractMemoryByAI(pid, userMessage, aiReply).then((memory) => {
    if (memory) saveDailyMemory(pid, memory);
  });

  ws.send(
    JSON.stringify({
      type: "chat",
      role: "ai",
      content: aiReply,
      timestamp: new Date().toISOString(),
      debug: {
        prompt: fullPrompt,
        memory: memoryContext || "无",
        time: timeContext.trim(),
        systemLength: systemContent.length,
        historyCount: history.length,
        estimatedTokens,
        actualTokens: data.usage || null,
        elapsed,
        model: process.env.AI_MODEL,
      },
    }),
  );

  const preview = aiReply.length > 60 ? aiReply.slice(0, 60) + "..." : aiReply;
  pushNotification("AI 助手", preview);
}

module.exports = { handleChat };
