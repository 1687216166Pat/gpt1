const { getDB } = require("../db/index");
const EventEmitter = require("events");

const bus = new EventEmitter();
const processedIds = new Set();

// 生成唯一消息ID
function generateId(platform) {
  return `msg_${platform}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// 接收消息（任何平台调用）
async function receiveMessage({
  platform,
  sender,
  role,
  content,
  conversation_id,
}) {
  const db = getDB();
  const id = generateId(platform);
  const timestamp = Date.now();

  // 防重复（相同内容+相同发送者+2秒内）
  const key = `${sender}_${content}_${Math.floor(timestamp / 2000)}`;
  if (processedIds.has(key)) return null;
  processedIds.add(key);
  if (processedIds.size > 200) {
    const arr = [...processedIds];
    processedIds.clear();
    arr.slice(-100).forEach((k) => processedIds.add(k));
  }

  const msg = {
    id,
    platform,
    sender,
    role,
    content,
    timestamp,
    conversation_id: conversation_id || "default",
    synced_to: platform,
  };

  // 存入数据库
  await db.from("message_bus").insert(msg);

  // 广播事件
  bus.emit("message", msg);

  console.log(`[Bus] ${platform} → ${role}: ${content.slice(0, 30)}`);

  return msg;
}

// 标记消息已同步到某平台
async function markSynced(msgId, platform) {
  const db = getDB();
  const { data } = await db
    .from("message_bus")
    .select("synced_to")
    .eq("id", msgId)
    .limit(1);
  if (data && data.length > 0) {
    const current = data[0].synced_to || "";
    if (!current.includes(platform)) {
      await db
        .from("message_bus")
        .update({ synced_to: current + "," + platform })
        .eq("id", msgId);
    }
  }
}

// 获取历史消息
async function getHistory(conversationId, limit = 50) {
  const db = getDB();
  const { data } = await db
    .from("message_bus")
    .select("*")
    .eq("conversation_id", conversationId || "default")
    .order("timestamp", { ascending: false })
    .limit(limit);
  return (data || []).reverse();
}

// 获取未同步到某平台的消息
async function getUnsyncedMessages(platform, conversationId) {
  const db = getDB();
  const { data } = await db
    .from("message_bus")
    .select("*")
    .eq("conversation_id", conversationId || "default")
    .not("synced_to", "ilike", `%${platform}%`)
    .order("timestamp", { ascending: true })
    .limit(20);
  return data || [];
}

// 按日期获取日志（用于语料库存档）
async function getDailyLog(date) {
  const db = getDB();
  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;

  const start = new Date(startOfDay).getTime();
  const end = new Date(endOfDay).getTime();

  const { data } = await db
    .from("message_bus")
    .select("*")
    .gte("timestamp", start)
    .lte("timestamp", end)
    .order("timestamp", { ascending: true });

  return {
    date,
    messages: data || [],
  };
}

module.exports = {
  bus,
  receiveMessage,
  markSynced,
  getHistory,
  getUnsyncedMessages,
  getDailyLog,
  generateId,
};
