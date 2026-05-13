// server/services/push.js
const webPush = require("web-push");

webPush.setVapidDetails(
  process.env.VAPID_EMAIL || "mailto:test@example.com",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

// 存储订阅信息
let subscriptions = [];

function addSubscription(sub) {
  // 避免重复
  const exists = subscriptions.find((s) => s.endpoint === sub.endpoint);
  if (!exists) {
    subscriptions.push(sub);
  }
}

function removeSubscription(endpoint) {
  subscriptions = subscriptions.filter((s) => s.endpoint !== endpoint);
}

// 给所有订阅者推送
async function pushNotification(title, body) {
  const payload = JSON.stringify({ title, body, url: "/chat" });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webPush.sendNotification(sub, payload).catch((err) => {
        if (err.statusCode === 410) {
          removeSubscription(sub.endpoint);
        }
      }),
    ),
  );
  return results;
}

module.exports = { addSubscription, removeSubscription, pushNotification };
