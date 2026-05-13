// server/services/user.js
const { getDB } = require("../db/index");

function setUserInfo(key, value) {
  const db = getDB();
  db.prepare(
    `
    INSERT INTO user_profile (key, value, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `,
  ).run(key, value, value);
}

function getUserInfo(key) {
  const db = getDB();
  const row = db
    .prepare("SELECT value FROM user_profile WHERE key = ?")
    .get(key);
  return row ? row.value : null;
}

function getAllUserInfo() {
  const db = getDB();
  return db.prepare("SELECT key, value FROM user_profile").all();
}

function getUserSummary() {
  const info = getAllUserInfo();
  if (info.length === 0) return "";

  let summary = "\n## 用户基本信息\n";
  for (const item of info) {
    summary += `- ${item.key}: ${item.value}\n`;
  }
  return summary;
}

module.exports = { setUserInfo, getUserInfo, getAllUserInfo, getUserSummary };
