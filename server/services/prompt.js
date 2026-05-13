// server/services/prompt.js
const { getDB } = require("../db/index");
const {
  corePrompt,
  personaPrompts,
  userPromptTemplate,
} = require("../config/prompt");

// 获取完整的三层 prompt
function getFullPrompt() {
  const db = getDB();

  // 第一层：系统核心（固定）
  const layer1 = corePrompt;

  // 第二层：人格层（从数据库读取当前激活的人格）
  const activePersona = db
    .prepare("SELECT value FROM user_profile WHERE key = 'active_persona'")
    .get();
  const personaKey = activePersona ? activePersona.value : "xiaorou";
  const persona = personaPrompts[personaKey];
  const layer2 = persona ? persona.content : personaPrompts.xiaorou.content;

  // 第三层：用户偏好层（从数据库读取）
  const userPrompt = db
    .prepare("SELECT value FROM user_profile WHERE key = 'user_prompt'")
    .get();
  const layer3 = userPrompt ? `\n## 用户偏好设定\n${userPrompt.value}` : "";

  return `${layer1}\n${layer2}\n${layer3}`;
}

// 获取可用的人格列表
function getPersonaList() {
  return Object.entries(personaPrompts).map(([key, value]) => ({
    id: key,
    name: value.name,
    description: value.description,
  }));
}

// 获取当前激活的人格
function getActivePersona() {
  const db = getDB();
  const row = db
    .prepare("SELECT value FROM user_profile WHERE key = 'active_persona'")
    .get();
  return row ? row.value : "xiaorou";
}

// 切换人格
function setActivePersona(personaId) {
  const db = getDB();
  if (!personaPrompts[personaId]) return false;
  db.prepare(
    `
    INSERT INTO user_profile (key, value, updated_at) 
    VALUES ('active_persona', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `,
  ).run(personaId, personaId);
  return true;
}

// 获取用户自定义 prompt
function getUserPrompt() {
  const db = getDB();
  const row = db
    .prepare("SELECT value FROM user_profile WHERE key = 'user_prompt'")
    .get();
  return row ? row.value : "";
}

// 设置用户自定义 prompt
function setUserPrompt(content) {
  const db = getDB();
  db.prepare(
    `
    INSERT INTO user_profile (key, value, updated_at) 
    VALUES ('user_prompt', ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `,
  ).run(content, content);
}

// 获取用户偏好层模板
function getUserPromptTemplate() {
  return userPromptTemplate;
}

module.exports = {
  getFullPrompt,
  getPersonaList,
  getActivePersona,
  setActivePersona,
  getUserPrompt,
  setUserPrompt,
  getUserPromptTemplate,
};
