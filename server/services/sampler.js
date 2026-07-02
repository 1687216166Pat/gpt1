// server/services/sampler.js

const { getDB } = require("../db/index");
const { callSubAI } = require("./subai");
const { getIdentityConfig } = require("./sediment");

async function autoExtractSamples(personaId, messages, isBeta = false) {
  if (!messages || messages.length < 1) return;

  const db = getDB();
  const tableName = isBeta ? "samples_beta" : "persona_samples";

  const identity = await getIdentityConfig(personaId);
  const dialogue = messages
    .map((m) => {
      const name = m.role === "user" ? identity.userName : identity.aiName;
      return `${name}: ${m.content}`;
    })
    .join("\n");

  // 💡 改用纯文本标记格式，极大提高小模型的遵循率
  const prompt = `你是一个人格采样与关系沉淀系统。分析以下对话，提取出值得长期保存的"人称代称化"人格纹理。

身份信息：
- 用户的称呼：${identity.userName}
- AI的名字：${identity.aiName}
- AI的性别代词：${identity.pronoun}

规则：
1. 绝对禁止在内容中出现"AI"、"用户"、"assistant"、"客服"等冷冰冰的词汇。
2. 必须全部替换为 "${identity.userName}" 或 "${identity.aiName}"，用"${identity.pronoun}"指代AI。
3. 请按照以下格式输出提取的内容，没有某项就不写那一行，不要有任何多余的解释：

[reply]
用户消息：${identity.userName}说的话
AI回复：${identity.aiName}的回复

[trait]
特征：一个稳定的行为特征
描述：这个特征的具体表现

[scene]
情境：当前的特定情境或氛围
行为：在该情境下的具体细节

[style]
关系风格：用1-2个词描述这阶段的相处风格

最近对话：
${dialogue}

提取结果：`;

  try {
    const result = await callSubAI(prompt, 600);
    if (!result || result === "无") {
      throw new Error("AI 未能提炼出有效纹理");
    }

    console.log(`[语料库] 收到原始采样文本:`, result.slice(0, 150) + "...");

    // 💡 2. 使用正则表达式/切分器，安全拆分纯文本数据，彻底杜绝 JSON 解析报错
    const sections = result.split(/\[(reply|trait|scene|style)\]/i);

    for (let i = 1; i < sections.length; i += 2) {
      const type = sections[i].toLowerCase().trim();
      const content = sections[i + 1]?.trim();
      if (!content) continue;

      let data = {};

      if (type === "reply") {
        const userMsg = content.match(
          /(?:用户消息|${identity.userName}说的话)\s*[:：]\s*(.*)/i,
        );
        const aiMsg = content.match(
          /(?:AI回复|${identity.aiName}的回复)\s*[:：]\s*(.*)/i,
        );
        if (userMsg || aiMsg) {
          data = {
            user_message: userMsg ? userMsg[1].trim() : "...",
            assistant_reply: aiMsg ? aiMsg[1].trim() : "...",
          };
        }
      } else if (type === "trait") {
        const trait = content.match(/(?:特征|行为特征)\s*[:：]\s*(.*)/i);
        const desc = content.match(/(?:描述|具体表现)\s*[:：]\s*(.*)/i);
        if (trait) {
          data = {
            trait: trait[1].trim(),
            description: desc ? desc[1].trim() : "长期形成的相处习惯",
          };
        }
      } else if (type === "scene") {
        const scene = content.match(/(?:情境|氛围)\s*[:：]\s*(.*)/i);
        const behaviorLines = content
          .split("\n")
          .filter(
            (line) =>
              line.includes("行为") ||
              line.includes("·") ||
              line.startsWith("-"),
          );
        const behaviors = behaviorLines
          .map((line) => line.replace(/.*[:：]|-|·/g, "").trim())
          .filter(Boolean);
        if (scene) {
          data = {
            scene: scene[1].trim(),
            behavior:
              behaviors.length > 0 ? behaviors : ["相处时特有的细腻反应"],
          };
        }
      } else if (type === "style") {
        const styleLines = content
          .split("\n")
          .filter(
            (line) =>
              line.includes("风格") ||
              line.includes("·") ||
              line.startsWith("-"),
          );
        const styles = styleLines
          .map((line) => line.replace(/.*[:：]|-|·/g, "").trim())
          .filter(Boolean);
        if (styles.length > 0) {
          data = { relationship_style: styles };
        } else {
          const singleLine = content.replace(/.*[:：]/g, "").trim();
          if (singleLine) data = { relationship_style: [singleLine] };
        }
      }

      // 如果成功提取到了结构化数据，存入数据库
      if (Object.keys(data).length > 0) {
        await db.from(tableName).insert({
          persona_id: personaId,
          type,
          data,
        });
      }
    }

    console.log(
      `[语料库] (${isBeta ? "Beta" : "正式"}) ${personaId} 自动采样已沉淀。`,
    );
  } catch (e) {
    console.error("[语料库] 自动采样失败:", e.message);
    throw e;
  }
}

module.exports = { autoExtractSamples };
