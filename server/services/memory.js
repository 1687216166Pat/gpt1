// server/services/memory.js
const { getDB } = require("../db/index");

async function extractMemories(userMessage, aiReply) {
  const db = getDB();

  // 排除疑问句，不从问句中提取记忆
  if (/[？?]|吗|呢$|什么|哪|谁|怎么|记得/.test(userMessage)) {
    return;
  }

  const patterns = [
    { regex: /我叫(.+?)(?:[\s，。,.!！]|$)/, category: "name" },
    { regex: /我喜欢(.+?)(?:[\s，。,.!！]|$)/, category: "preference" },
    { regex: /我讨厌(.+?)(?:[\s，。,.!！]|$)/, category: "dislike" },
    { regex: /我的?生日是?(.+?)(?:[\s，。,.!！]|$)/, category: "birthday" },
    { regex: /我在(.+?)工作/, category: "work" },
    { regex: /我是(.+?)(?:[\s，。,.!！的]|$)/, category: "identity" },
    { regex: /我住在(.+?)(?:[\s，。,.!！]|$)/, category: "location" },
    { regex: /我(\d+)岁/, category: "age" },
    { regex: /我的名字(?:是|叫)(.+?)(?:[\s，。,.!！]|$)/, category: "name" },
  ];

  for (const { regex, category } of patterns) {
    const match = userMessage.match(regex);
    if (match && match[1].trim()) {
      const value = match[1].trim();
      // 排除明显不是有效信息的内容
      if (value.length > 20 || value.length < 1) continue;
      saveMemory(category, value);
    }
  }
}

function saveMemory(category, content) {
  const db = getDB();
  const existing = db
    .prepare("SELECT id FROM memories WHERE category = ? AND content = ?")
    .get(category, content);

  if (!existing) {
    db.prepare("INSERT INTO memories (category, content) VALUES (?, ?)").run(
      category,
      content,
    );
    console.log(`记忆保存: [${category}] ${content}`);
  }
}

function getAllMemories() {
  const db = getDB();
  return db.prepare("SELECT * FROM memories ORDER BY updated_at DESC").all();
}

function getMemorySummary() {
  const memories = getAllMemories();
  if (memories.length === 0) return "";

  let summary = "\n[记忆]\n";
  for (const m of memories) {
    summary += `- ${m.category}: ${m.content}\n`;
  }
  return summary;
}

module.exports = {
  extractMemories,
  saveMemory,
  getAllMemories,
  getMemorySummary,
};
