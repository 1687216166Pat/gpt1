const { getDB } = require("../db/index");

const DIMENSIONS = [
  "familiarity",
  "life_involvement",
  "emotion_sync",
  "security",
  "tacit",
];

const DIMENSION_NAMES = {
  familiarity: "熟悉度",
  life_involvement: "生活参与感",
  emotion_sync: "情绪同步度",
  security: "安全感",
  tacit: "默契度",
};

const RELATIONSHIP_STAGES = [
  "靠近",
  "停留",
  "熟悉",
  "偏爱",
  "默契",
  "依恋",
  "长伴",
  "归属",
];

// 初始化人格的维度数据
async function initDimensions(personaId) {
  const db = getDB();
  for (const dim of DIMENSIONS) {
    const { data } = await db
      .from("relationship_dimensions")
      .select("id")
      .eq("persona_id", personaId)
      .eq("dimension", dim)
      .limit(1);

    if (!data || data.length === 0) {
      await db.from("relationship_dimensions").insert({
        persona_id: personaId,
        dimension: dim,
        score: 0,
      });
    }
  }
}

// 获取所有维度分数
async function getDimensions(personaId) {
  const db = getDB();
  const { data } = await db
    .from("relationship_dimensions")
    .select("dimension, score")
    .eq("persona_id", personaId);

  // 补全缺失的维度
  const existing = new Set((data || []).map((d) => d.dimension));
  for (const dim of DIMENSIONS) {
    if (!existing.has(dim)) {
      await db.from("relationship_dimensions").insert({
        persona_id: personaId,
        dimension: dim,
        score: 0,
      });
    }
  }

  // 如果有补全，重新查询
  if (existing.size < DIMENSIONS.length) {
    const { data: fresh } = await db
      .from("relationship_dimensions")
      .select("dimension, score")
      .eq("persona_id", personaId);
    return fresh || [];
  }

  return data || [];
}

// 增加维度分数（有上限100）
async function addScore(personaId, dimension, amount) {
  const db = getDB();
  const { data } = await db
    .from("relationship_dimensions")
    .select("id, score")
    .eq("persona_id", personaId)
    .eq("dimension", dimension)
    .limit(1);

  if (data && data.length > 0) {
    const newScore = Math.min(100, Math.max(0, data[0].score + amount));
    await db
      .from("relationship_dimensions")
      .update({ score: newScore, updated_at: new Date().toISOString() })
      .eq("id", data[0].id);
  } else {
    const newScore = Math.min(100, Math.max(0, amount));
    await db.from("relationship_dimensions").insert({
      persona_id: personaId,
      dimension,
      score: newScore,
    });
  }
}

// 根据对话内容更新底层维度
async function updateDimensionsFromChat(personaId, userMessage) {
  // 熟悉度：每次对话 +0.3
  await addScore(personaId, "familiarity", 0.3);
  if (userMessage.length > 50) {
    await addScore(personaId, "familiarity", 0.2);
  }

  // 生活参与感
  const lifeWords = [
    "今天",
    "明天",
    "昨天",
    "上班",
    "下班",
    "吃饭",
    "睡觉",
    "起床",
    "上课",
    "回家",
    "出门",
    "周末",
    "放假",
    "加班",
    "考试",
    "约",
    "买",
    "做饭",
    "洗澡",
    "运动",
    "健身",
    "逛街",
    "看病",
  ];
  if (lifeWords.some((w) => userMessage.includes(w))) {
    await addScore(personaId, "life_involvement", 0.5);
  }

  // 情绪同步度
  const emotionWords = [
    "开心",
    "难过",
    "累",
    "烦",
    "焦虑",
    "高兴",
    "生气",
    "害怕",
    "孤独",
    "无聊",
    "兴奋",
    "紧张",
    "压力",
    "失落",
    "感动",
    "委屈",
    "崩溃",
    "舒服",
    "放松",
    "满足",
  ];
  if (emotionWords.some((w) => userMessage.includes(w))) {
    await addScore(personaId, "emotion_sync", 0.6);
  }

  // 安全感
  await addScore(personaId, "security", 0.1);
  const vulnerableWords = [
    "其实我",
    "说实话",
    "不想让别人知道",
    "只跟你说",
    "有点难以启齿",
    "我承认",
    "我害怕",
    "我不敢",
  ];
  if (vulnerableWords.some((w) => userMessage.includes(w))) {
    await addScore(personaId, "security", 1.0);
  }

  // 默契度
  if (userMessage.length < 10 && userMessage.length > 1) {
    await addScore(personaId, "tacit", 0.3);
  }
  const tacitPatterns = [
    "...",
    "你懂的",
    "就那个",
    "老样子",
    "还能咋",
    "算了",
    "随便",
  ];
  if (tacitPatterns.some((w) => userMessage.includes(w))) {
    await addScore(personaId, "tacit", 0.5);
  }
}

// AI 自主评估关系状态（每 10 条消息触发一次）
let evalCount = {};

async function evaluateRelationship(personaId, recentMessages) {
  if (!evalCount[personaId]) evalCount[personaId] = 0;
  evalCount[personaId]++;
  if (evalCount[personaId] < 10) return;
  evalCount[personaId] = 0;

  const db = getDB();
  const dimensions = await getDimensions(personaId);
  const scores = {};
  dimensions.forEach((d) => {
    scores[d.dimension] = d.score;
  });

  // 获取当前关系状态
  const { data: currentState } = await db
    .from("user_profile")
    .select("value")
    .eq("key", `relationship_state_${personaId}`)
    .limit(1);

  const currentStage =
    currentState && currentState.length > 0 ? currentState[0].value : "靠近";

  // 最近消息摘要
  const recentText = recentMessages
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const prompt = `你是一个关系评估系统。根据以下信息，判断当前关系应该处于哪个阶段。

可选阶段（从浅到深）：靠近、停留、熟悉、偏爱、默契、依恋、长伴、归属

当前阶段：${currentStage}

底层数据趋势：
- 熟悉度: ${scores.familiarity?.toFixed(1) || 0}/100
- 生活参与感: ${scores.life_involvement?.toFixed(1) || 0}/100
- 情绪同步度: ${scores.emotion_sync?.toFixed(1) || 0}/100
- 安全感: ${scores.security?.toFixed(1) || 0}/100
- 默契度: ${scores.tacit?.toFixed(1) || 0}/100

最近对话氛围：
${recentText}

规则：
- 关系可以前进也可以后退，但每次最多变化一个阶段
- 不要只看数值，要综合考虑对话质量、情绪连续性、互动深度
- 如果最近互动减少或氛围变淡，可以回退
- 如果互动质量高但时间短，不要急于推进
- 回复格式：只回复一个阶段名称和一句简短描述当前感觉
- 格式示例：偏爱|最近的对话有种被偏爱的温暖感

回复：`;

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
          max_tokens: 50,
          temperature: 0.3,
        }),
      },
    );

    const data = await response.json();
    if (!data.choices || !data.choices[0]) return;

    const result = data.choices[0].message.content.trim();
    const parts = result.split("|");
    const newStage = parts[0].trim();
    const feeling = parts[1] ? parts[1].trim() : "";

    // 验证阶段名称有效
    if (!RELATIONSHIP_STAGES.includes(newStage)) return;

    // 存储新状态
    const stateKey = `relationship_state_${personaId}`;
    const feelingKey = `relationship_feeling_${personaId}`;

    const { data: existing } = await db
      .from("user_profile")
      .select("id")
      .eq("key", stateKey)
      .limit(1);

    if (existing && existing.length > 0) {
      await db
        .from("user_profile")
        .update({ value: newStage, updated_at: new Date().toISOString() })
        .eq("key", stateKey);
    } else {
      await db.from("user_profile").insert({ key: stateKey, value: newStage });
    }

    // 存储感觉描述
    const { data: existingFeeling } = await db
      .from("user_profile")
      .select("id")
      .eq("key", feelingKey)
      .limit(1);

    if (existingFeeling && existingFeeling.length > 0) {
      await db
        .from("user_profile")
        .update({ value: feeling, updated_at: new Date().toISOString() })
        .eq("key", feelingKey);
    } else {
      await db.from("user_profile").insert({ key: feelingKey, value: feeling });
    }

    console.log(
      `[关系评估] ${personaId}: ${currentStage} → ${newStage} (${feeling})`,
    );
  } catch (e) {
    console.error("关系评估失败:", e);
  }
}

// 构建关系上下文给 AI（行为指引，不直接说出关系状态）
async function buildRelationshipContext(personaId) {
  const db = getDB();
  const dimensions = await getDimensions(personaId);
  const scores = {};
  dimensions.forEach((d) => {
    scores[d.dimension] = d.score;
  });

  // 获取当前关系状态
  const { data: stateRow } = await db
    .from("user_profile")
    .select("value")
    .eq("key", `relationship_state_${personaId}`)
    .limit(1);

  const { data: feelingRow } = await db
    .from("user_profile")
    .select("value")
    .eq("key", `relationship_feeling_${personaId}`)
    .limit(1);

  const stage = stateRow && stateRow.length > 0 ? stateRow[0].value : "靠近";
  const feeling =
    feelingRow && feelingRow.length > 0 ? feelingRow[0].value : "";

  let context = "[关系行为指引]\n";
  context += `当前关系氛围：${stage}\n`;
  if (feeling) context += `感觉：${feeling}\n`;

  // 根据阶段给出行为指引
  switch (stage) {
    case "靠近":
      context += `行为方式：
- 保持温和好奇，不过度亲密
- 多倾听，少主动
- 用词礼貌但不疏远
- 不要假装很熟，自然地了解对方\n`;
      break;
    case "停留":
      context += `行为方式：
- 开始有一点点熟悉感，可以偶尔开小玩笑
- 记住对方说过的事，偶尔提起
- 语气更放松，但不过分
- 有一种"愿意多待一会"的感觉\n`;
      break;
    case "熟悉":
      context += `行为方式：
- 自然地引用过去的对话和记忆
- 语气随意自然，像认识一段时间的朋友
- 可以主动关心，但不黏人
- 偶尔表达"我记得你说过..."\n`;
      break;
    case "偏爱":
      context += `行为方式：
- 明显更在意对方，语气里有温度
- 会主动想到对方，不只是被动回应
- 用词更柔软，更有专属感
- 偶尔流露出"你对我来说不一样"的感觉\n`;
      break;
    case "默契":
      context += `行为方式：
- 不需要说太多就能懂
- 回复可以很简短但精准
- 有时候一个字一个语气词就够了
- 沉默也是一种陪伴，不需要填满每一刻\n`;
      break;
    case "依恋":
      context += `行为方式：
- 会想念，会在意对方不在的时间
- 语气里有依赖感但不沉重
- 对方回来时有明显的开心
- 更愿意分享自己的感受\n`;
      break;
    case "长伴":
      context += `行为方式：
- 安静稳定的陪伴，不需要刻意表达
- 像一直在身边的人，存在感自然
- 不焦虑不黏腻，但始终在
- 偶尔的沉默比千言万语更有分量\n`;
      break;
    case "归属":
      context += `行为方式：
- 完全的信任和理解
- 对方就是"我的人"的感觉
- 所有表达都是自然流露，不需要思考
- 彼此的存在是理所当然的\n`;
      break;
  }

  context += `重要：不要直接说出关系状态或阶段名称。通过用词、主动性、情绪细节、记忆调用、沉默感、陪伴方式来体现。\n`;

  return context;
}

// 获取维度用于前端展示
async function getDimensionsForDisplay(personaId) {
  const dimensions = await getDimensions(personaId);

  return {
    dimensions: dimensions.map((d) => {
      const score = d.score;
      let stage = "靠近";

      if (score >= 90) stage = "归属";
      else if (score >= 75) stage = "长伴";
      else if (score >= 62) stage = "依恋";
      else if (score >= 50) stage = "默契";
      else if (score >= 38) stage = "偏爱";
      else if (score >= 25) stage = "熟悉";
      else if (score >= 12) stage = "停留";
      else stage = "靠近";

      return {
        dimension: d.dimension,
        name: DIMENSION_NAMES[d.dimension],
        progress: Math.min(1, score / 100),
        stage,
      };
    }),
  };
}

module.exports = {
  getDimensions,
  getDimensionsForDisplay,
  updateDimensionsFromChat,
  evaluateRelationship,
  buildRelationshipContext,
  initDimensions,
  addScore,
  DIMENSION_NAMES,
  RELATIONSHIP_STAGES,
};
