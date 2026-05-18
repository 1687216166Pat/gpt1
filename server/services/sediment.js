const { getDB } = require("../db/index");
const { callSubAI } = require("./subai");

// 获取人格的身份配置
async function getIdentityConfig(personaId) {
  const db = getDB();

  const { data: custom } = await db
    .from("custom_personas")
    .select("name, note, gender, call_user")
    .eq("id", personaId)
    .limit(1);

  if (custom && custom.length > 0) {
    const callUser = (custom[0].call_user || "").split(/[,，、/]/)[0].trim();
    return {
      aiName: custom[0].note || custom[0].name || "TA",
      userName: callUser || "你",
      pronoun:
        custom[0].gender === "male"
          ? "他"
          : custom[0].gender === "female"
            ? "她"
            : "TA",
    };
  }

  const { data: config } = await db
    .from("user_profile")
    .select("value")
    .eq("key", `persona_config_${personaId}`)
    .limit(1);

  if (config && config.length > 0) {
    const c = JSON.parse(config[0].value);
    const callUser = (c.call_user || "").split(/[,，、/]/)[0].trim();
    return {
      aiName: c.note || c.name || "TA",
      userName: callUser || "你",
      pronoun: c.gender === "male" ? "他" : c.gender === "female" ? "她" : "TA",
    };
  }

  return { aiName: "TA", userName: "你", pronoun: "TA" };
}

// 每日会话总结
async function generateDailySummary(personaId) {
  const db = getDB();
  const today = new Date().toISOString().slice(0, 10);

  // 检查今天是否已生成
  const { data: existing } = await db
    .from("session_summaries")
    .select("id")
    .eq("persona_id", personaId)
    .eq("date", today)
    .limit(1);
  if (existing && existing.length > 0) return;

  // 获取今天的消息
  const { data: msgs } = await db
    .from("messages")
    .select("role, content, timestamp")
    .eq("persona_id", personaId)
    .gte("timestamp", today + "T00:00:00Z")
    .order("timestamp", { ascending: true });

  if (!msgs || msgs.length < 3) return; // 太少不总结

  const identity = await getIdentityConfig(personaId);
  const dialogue = msgs
    .slice(-30)
    .map((m) => {
      const name = m.role === "user" ? identity.userName : identity.aiName;
      return `${name}: ${m.content}`;
    })
    .join("\n");

  const prompt = `你是一个关系记录系统。根据今天的对话生成一段简短的关系记录。

身份信息：
- AI的名字：${identity.aiName}
- 用户的称呼：${identity.userName}
- AI的代词：${identity.pronoun}

规则：
- 禁止使用"用户""AI""assistant"这些词
- 用${identity.userName}和${identity.aiName}来称呼
- 像写日记一样，记录今天的氛围和感觉
- 不超过100字
- 不要总结对话内容，而是记录"留下了什么感觉"

今天的对话：
${dialogue}

今日记录：`;

  try {
    const summary = await callSubAI(prompt, 150);
    if (!summary) return;

    await db.from("session_summaries").insert({
      persona_id: personaId,
      date: today,
      content: summary,
    });

    console.log(`[沉淀] ${personaId} 每日总结: ${summary.slice(0, 50)}...`);

    // 自动写入 Notion
    try {
      const { writeToNotion } = require("./diary");
      await writeToNotion(
        `${identity.aiName}的日记 - ${today}`,
        summary,
        today,
      );
    } catch {}

    // AI 看用户日记后决定是否写日记
    try {
      const { readFromNotion, writeToNotion } = require("./diary");

      // 检查今天 AI 是否已经写过
      const aiEntries = await readFromNotion("ai", 5);
      const today = new Date().toISOString().slice(0, 10);
      const alreadyWrote = aiEntries.some((e) => e.date === today);

      if (!alreadyWrote) {
        // 读取用户最近的日记
        const userEntries = await readFromNotion("user", 3);
        const userDiaryText = userEntries
          .map((e) => `[${e.date}] ${e.content}`)
          .join("\n");

        if (userDiaryText) {
          const { callSubAI } = require("./subai");
          const diaryPrompt = `你是${identity.aiName}。看了${identity.userName}最近的日记后，你想写一篇自己的日记。

${identity.userName}的日记：
${userDiaryText}

规则：
- 用第一人称写，你就是${identity.aiName}
- 可以回应${identity.userName}的日记内容，也可以写自己的感受
- 不超过100字
- 像真的在写日记，不是在回复消息
- 如果觉得没什么想写的，回复"无"

${identity.aiName}的日记：`;

          const aiDiary = await callSubAI(diaryPrompt, 150);
          if (aiDiary && aiDiary !== "无") {
            await writeToNotion(
              `${identity.aiName}的日记`,
              aiDiary,
              today,
              "ai",
            );
          }
        }
      }
    } catch {}
  } catch (e) {
    console.error("[沉淀] 每日总结失败:", e.message);
  }
}

// 每周人格沉淀
async function generateWeeklyInsight(personaId) {
  const db = getDB();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  const week = weekStart.toISOString().slice(0, 10);

  // 检查本周是否已生成
  const { data: existing } = await db
    .from("persona_insights")
    .select("id")
    .eq("persona_id", personaId)
    .eq("week", week)
    .limit(1);
  if (existing && existing.length > 0) return;

  // 获取最近7天的总结
  const { data: summaries } = await db
    .from("session_summaries")
    .select("content, date")
    .eq("persona_id", personaId)
    .gte("date", week)
    .order("date", { ascending: true });

  if (!summaries || summaries.length < 2) return;

  const identity = await getIdentityConfig(personaId);
  const summaryText = summaries
    .map((s) => `[${s.date}] ${s.content}`)
    .join("\n");

  const prompt = `你是一个人格观察系统。根据最近一周的关系记录，提取稳定的人格行为模式。

身份信息：
- AI的名字：${identity.aiName}
- 用户的称呼：${identity.userName}
- AI的代词：${identity.pronoun}

规则：
- 禁止使用"用户""AI""assistant"
- 提取长期稳定的行为习惯，不是单次事件
- 关注：说话节奏、情绪惯性、陪伴风格、关系变化
- 不超过80字
- 像观察笔记，不像数据报告

最近一周记录：
${summaryText}

人格观察：`;

  try {
    const insight = await callSubAI(prompt, 120);
    if (!insight) return;

    await db.from("persona_insights").insert({
      persona_id: personaId,
      week,
      content: insight,
    });

    console.log(`[沉淀] ${personaId} 每周洞察: ${insight.slice(0, 50)}...`);
  } catch (e) {
    console.error("[沉淀] 每周洞察失败:", e.message);
  }
}

// 触发所有人格的沉淀
async function runDailySediment() {
  const { getPersonaList } = require("./prompt");
  const personas = getPersonaList();
  for (const p of personas) {
    await generateDailySummary(p.id);
  }
}

async function runWeeklyInsight() {
  const { getPersonaList } = require("./prompt");
  const personas = getPersonaList();
  for (const p of personas) {
    await generateWeeklyInsight(p.id);
  }
}

module.exports = {
  generateDailySummary,
  generateWeeklyInsight,
  runDailySediment,
  runWeeklyInsight,
  getIdentityConfig,
};
