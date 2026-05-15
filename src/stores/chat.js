import { defineStore } from "pinia";
import { ref } from "vue";
import { api } from "@/utils/api";

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

  async function loadPersonaMessages(personaId) {
    if (!personaId) return;
    try {
      const res = await api(`/api/messages/${personaId}`);
      const data = await res.json();

      // 处理 AI 分句
      const processed = [];
      data.forEach((m) => {
        if (m.role === "ai") {
          const lines = m.content
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const merged = [];
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].length < 4 && i + 1 < lines.length) {
              merged.push(lines[i] + lines[i + 1]);
              i++;
            } else {
              merged.push(lines[i]);
            }
          }
          if (merged.length > 1) {
            merged.forEach((line) => {
              processed.push({
                id: m.id + "_" + Math.random(),
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
        } else {
          processed.push({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          });
        }
      });

      allMessages.value = processed;
      // 只显示最新 10 条
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
