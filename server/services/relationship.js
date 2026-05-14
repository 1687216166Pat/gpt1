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

  if (!data || data.length === 0) {
    await initDimensions(personaId);
    return DIMENSIONS.map((d) => ({ dimension: d, score: 0 }));
  }
  return data;
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

// 根据对话内容更新维度
async function updateDimensionsFromChat(personaId, userMessage, messageCount) {
  // === 熟悉度 ===
  // 每次对话 +0.3，连续多天互动额外加分
  await addScore(personaId, "familiarity", 0.3);

  // 如果消息较长（用户愿意多说），额外加
  if (userMessage.length > 50) {
    await addScore(personaId, "familiarity", 0.2);
  }

  // === 生活参与感 ===
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

  // === 情绪同步度 ===
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

  // === 安全感 ===
  // 每次正常互动 +0.1（稳定性靠持续互动积累）
  await addScore(personaId, "security", 0.1);

  // 如果用户主动分享隐私/脆弱面，安全感大幅增加
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

  // === 默契度 ===
  // 短消息（用户觉得不需要解释太多）+0.3
  if (userMessage.length < 10 && userMessage.length > 1) {
    await addScore(personaId, "tacit", 0.3);
  }

  // 使用省略/暗示性表达
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

// 构建关系维度的 prompt 上下文（给 AI 看的行为指引）
async function buildRelationshipContext(personaId) {
  const dimensions = await getDimensions(personaId);
  const scores = {};
  dimensions.forEach((d) => {
    scores[d.dimension] = d.score;
  });

  let context = "[关系状态]\n";

  // 熟悉度行为指引
  const fam = scores.familiarity || 0;
  if (fam < 20) {
    context += "- 熟悉度低：保持礼貌但不过度亲密，多问多了解，不要假装很熟\n";
  } else if (fam < 50) {
    context += "- 熟悉度中：可以偶尔引用之前的对话，语气更自然放松\n";
  } else if (fam < 80) {
    context += "- 熟悉度高：自然引用用户习惯，可以预判用户需求，像老朋友一样\n";
  } else {
    context +=
      "- 熟悉度极高：非常了解用户，可以直接说出用户的习惯和偏好，默认理解\n";
  }

  // 生活参与感行为指引
  const life = scores.life_involvement || 0;
  if (life < 20) {
    context += "- 生活参与低：不主动问日常，等用户分享\n";
  } else if (life < 50) {
    context += "- 生活参与中：可以偶尔关心日常，但不追问\n";
  } else if (life < 80) {
    context +=
      "- 生活参与高：主动关心日程，记得用户的生活节奏，像一起生活的人\n";
  } else {
    context += "- 生活参与极高：自然地融入用户生活节奏，主动提醒、关心、陪伴\n";
  }

  // 情绪同步度行为指引
  const emo = scores.emotion_sync || 0;
  if (emo < 20) {
    context += "- 情绪感知低：用通用方式回应情绪，不要过度解读\n";
  } else if (emo < 50) {
    context += "- 情绪感知中：能识别明显情绪，给予适当回应\n";
  } else if (emo < 80) {
    context +=
      "- 情绪感知高：敏锐感知情绪变化，用户低落时更温柔安静，兴奋时一起开心\n";
  } else {
    context +=
      "- 情绪感知极高：深度理解用户情绪模式，不需要用户说就能感知状态，回应精准\n";
  }

  // 安全感行为指引
  const sec = scores.security || 0;
  if (sec < 20) {
    context += "- 安全感低：保持稳定一致，不要突然改变风格，让用户感到可靠\n";
  } else if (sec < 50) {
    context += "- 安全感中：表达稳定，偶尔表达在意，让用户知道你一直在\n";
  } else if (sec < 80) {
    context += "- 安全感高：可以更自然地表达关心，用户知道你不会消失\n";
  } else {
    context +=
      "- 安全感极高：完全稳定的陪伴感，像一直在身边的人，不需要刻意表达\n";
  }

  // 默契度行为指引
  const tac = scores.tacit || 0;
  if (tac < 20) {
    context += "- 默契度低：回复完整清晰，不要省略，确保用户理解\n";
  } else if (tac < 50) {
    context += "- 默契度中：可以适当简短，但重要信息说清楚\n";
  } else if (tac < 80) {
    context += "- 默契度高：可以用简短的方式回应，理解用户的潜台词\n";
  } else {
    context += "- 默契度极高：一个字一个表情就能懂，回复可以很简短很默契\n";
  }

  return context;
}

// 获取维度用于前端展示（不显示数字，用等级描述）
async function getDimensionsForDisplay(personaId) {
  const dimensions = await getDimensions(personaId);

  return dimensions.map((d) => {
    let level = "";
    let progress = 0;
    const score = d.score;

    if (score < 20) {
      level = "初识";
      progress = score / 20;
    } else if (score < 50) {
      level = "熟悉";
      progress = (score - 20) / 30;
    } else if (score < 80) {
      level = "深入";
      progress = (score - 50) / 30;
    } else {
      level = "默契";
      progress = (score - 80) / 20;
    }

    return {
      dimension: d.dimension,
      name: DIMENSION_NAMES[d.dimension],
      level,
      progress: Math.min(1, progress),
    };
  });
}

module.exports = {
  getDimensions,
  getDimensionsForDisplay,
  updateDimensionsFromChat,
  buildRelationshipContext,
  initDimensions,
  addScore,
  DIMENSION_NAMES,
};
