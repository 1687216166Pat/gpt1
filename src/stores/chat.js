import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/utils/api";
import { getCache, setCache } from "@/utils/cache";

function smartSplit(content) {
  const bubbles = content
    .split(/\n\s*\n/)
    .map((b) => {
      // 单换行的碎片用逗号连接
      return b
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("，");
    })
    .filter(Boolean);
  if (bubbles.length > 1) return bubbles;
  return [
    content
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("，"),
  ];
}

export const useChatStore = defineStore("chat", () => {
  const messages = ref([]);
  const allMessages = ref([]);
  const hasMore = ref(false);
  const pageSize = 10;

  function addMessage(msg) {
    const newMsg = {
      id: msg.id || Date.now() + Math.random(),
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || new Date().toISOString(),
    };
    messages.value.push(newMsg);
    allMessages.value.push(newMsg);
  }

  function processMessages(data) {
    const processed = [];
    data.forEach((m) => {
      if (m.role === "ai") {
        const parts = smartSplit(m.content);
        parts.forEach((line, idx) => {
          processed.push({
            id: m.id + "_" + idx,
            role: m.role,
            content: line,
            timestamp: m.timestamp,
          });
        });
      } else {
        processed.push({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp,
        });
      }
    });
    return processed;
  }

  async function loadPersonaMessages(personaId) {
    if (!personaId) return;
    try {
      const res = await api(`/api/messages/${personaId}`);
      const data = await res.json();

      const processed = [];
      data.forEach((m) => {
        if (m.role === "ai") {
          // 💡 仅使用 ||| 拆分，且把消息里的所有 \n 换成空格
          const bubbles = m.content
            .split("|||")
            .map((s) => s.replace(/\n/g, " ").trim())
            .filter(Boolean);
          if (bubbles.length > 0) {
            bubbles.forEach((line, partIdx) => {
              processed.push({
                id: `${m.id}_${partIdx}`,
                role: m.role,
                content: line,
                timestamp: m.timestamp,
              });
            });
          } else {
            processed.push({
              id: m.id,
              role: m.role,
              content: m.content.replace(/\|\|\|/g, "").replace(/\n/g, " "),
              timestamp: m.timestamp,
            });
          }
        } else {
          // 用户消息直接存入
          processed.push({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          });
        }
      });

      allMessages.value = processed;
      // 分页显示最新消息
      if (processed.length > pageSize) {
        messages.value = processed.slice(-pageSize);
        hasMore.value = true;
      } else {
        messages.value = processed;
        hasMore.value = false;
      }
    } catch (e) {
      console.error("加载消息失败:", e);
    }
  }

  function loadMore() {
    if (!hasMore.value) return;
    const currentCount = messages.value.length;
    const totalCount = allMessages.value.length;
    const startIdx = Math.max(0, totalCount - currentCount - pageSize);
    const endIdx = totalCount - currentCount;
    const older = allMessages.value.slice(startIdx, endIdx);
    messages.value = [...older, ...messages.value];
    hasMore.value = startIdx > 0;
  }

  function clearMessages() {
    messages.value = [];
    allMessages.value = [];
    hasMore.value = false;
  }

  return {
    messages,
    hasMore,
    addMessage,
    loadPersonaMessages,
    loadMore,
    clearMessages,
  };
});
