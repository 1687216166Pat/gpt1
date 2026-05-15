<template>
    <div class="chat-input-area">
        <textarea ref="inputRef" v-model="text" placeholder="输入消息..." @keydown.enter.exact="sendMessage"
            @input="autoResize" rows="1"></textarea>
        <button @click="sendMessage" :disabled="!text.trim()">
            <span>↑</span>
        </button>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['send'])
const text = ref('')
const inputRef = ref(null)

function sendMessage(e) {
    if (e && e.type === 'keydown') e.preventDefault()
    if (!text.value.trim()) return
    emit('send', text.value.trim())
    text.value = ''
    nextTick(() => autoResize())
}

function autoResize() {
    const el = inputRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}
</script>

<style scoped>
.chat-input-area {
    display: flex;
    gap: 10px;
    padding: 14px 0;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 14px);
    align-items: flex-end;
    flex-shrink: 0;
}

textarea {
    flex: 1;
    min-height: 40px;
    max-height: 120px;
    border-radius: 22px;
    border: 1px solid var(--color-border);
    padding: 10px 18px;
    font-size: 14px;
    font-family: inherit;
    background: var(--color-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    outline: none;
    resize: none;
    line-height: 1.45;
    overflow-y: auto;
    color: var(--color-text);
    transition: border-color var(--duration-normal) var(--ease-soft), box-shadow var(--duration-normal) var(--ease-soft);
}

textarea:focus {
    border-color: rgba(212, 137, 158, 0.3);
    box-shadow: 0 0 0 3px rgba(212, 137, 158, 0.06);
}

textarea::placeholder {
    color: var(--color-text-light);
    opacity: 0.5;
}

button {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-full);
    border: none;
    background: linear-gradient(135deg, #e8a8be, #d4899e);
    color: white;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 3px 10px rgba(212, 137, 158, 0.25);
}

button:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    box-shadow: none;
}
</style>
