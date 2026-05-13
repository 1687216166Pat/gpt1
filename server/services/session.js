// server/services/session.js
const { getDB } = require("../db/index");

function createSession(title) {
  const db = getDB();
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  db.prepare("INSERT INTO sessions (id, title) VALUES (?, ?)").run(
    id,
    title || "新对话",
  );
  return id;
}

function getSessions() {
  const db = getDB();
  return db.prepare("SELECT * FROM sessions ORDER BY updated_at DESC").all();
}

function getSessionMessages(sessionId, limit = 50) {
  const db = getDB();
  return db
    .prepare(
      "SELECT * FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT ?",
    )
    .all(sessionId, limit)
    .reverse();
}

function updateSessionTitle(sessionId, title) {
  const db = getDB();
  db.prepare(
    "UPDATE sessions SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).run(title, sessionId);
}

function deleteSession(sessionId) {
  const db = getDB();
  db.prepare("DELETE FROM messages WHERE session_id = ?").run(sessionId);
  db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

function getCurrentSession() {
  const db = getDB();
  let session = db
    .prepare("SELECT * FROM sessions ORDER BY updated_at DESC LIMIT 1")
    .get();
  if (!session) {
    const id = createSession("新对话");
    session = { id, title: "新对话" };
  }
  return session;
}

function touchSession(sessionId) {
  const db = getDB();
  db.prepare(
    "UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).run(sessionId);
}

module.exports = {
  createSession,
  getSessions,
  getSessionMessages,
  updateSessionTitle,
  deleteSession,
  getCurrentSession,
  touchSession,
};
