<template>
    <div class="bubble-wrapper" :class="msg.role" v-if="msg.content" @longpress="showActions = true"
        @touchstart="startLongPress" @touchend="cancelLongPress" @touchmove="cancelLongPress">
        <div class="bubble">
            <p>{{ msg.content }}</p>
            <span class="time">{{ formatTime(msg.timestamp) }}</span>
        </div>

        <!-- 操作菜单 -->
        <transition name="panel">
            <div v-if="showActions" class="bubble-actions" @click.self="showActions = false">
                <div class="action-menu">
                    <button @click="editMsg">编辑</button>
                    <button v-if="msg.role === 'ai'" @click="regenerate">重新生成</button>
                    <button @click="deleteMsg" class="danger">删除</button>
                    <button @click="showActions = false">取消</button>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    msg: Object
})

const emit = defineEmits(['edit', 'delete', 'regenerate'])
const showActions = ref(false)
let longPressTimer = null

function startLongPress() {
    longPressTimer = setTimeout(() => {
        showActions.value = true
    }, 500)
}

function cancelLongPress() {
    if (longPressTimer) {
        clearTimeout(longPressTimer)
        longPressTimer = null
    }
}

function editMsg() {
    showActions.value = false
    const newContent = prompt('编辑消息:', props.msg.content)
    if (newContent !== null && newContent.trim()) {
        emit('edit', props.msg.id, newContent.trim())
    }
}

function deleteMsg() {
    showActions.value = false
    if (confirm('删除这条消息？AI将遗忘这条内容。')) {
        emit('delete', props.msg.id)
    }
}

function regenerate() {
    showActions.value = false
    emit('regenerate', props.msg.id)
}

function formatTime(ts) {
    if (!ts) return ''
    let d = new Date(ts)
    if (typeof ts === 'string' && !ts.includes('T') && !ts.includes('Z') && !ts.includes('+')) {
        d = new Date(ts + 'Z')
    }
    if (isNaN(d.getTime())) return ''
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<style scoped>
.bubble-wrapper {
    display: flex;
    margin-bottom: 18px;
    animation: fadeIn 0.4s var(--ease-soft) backwards;
    position: relative;
}

.bubble-wrapper.user {
    justify-content: flex-end;
}

.bubble-wrapper.ai {
    justify-content: flex-start;
}

.bubble {
    max-width: 72%;
    padding: 12px 16px;
    border-radius: 20px;
    font-size: 14px;
    line-height: 1.55;
    color: var(--color-text);
}

.user .bubble {
    background: linear-gradient(135deg, #e8a8be, #d4899e);
    color: white;
    border-bottom-right-radius: 6px;
    box-shadow: 0 2px 8px rgba(212, 137, 158, 0.2);
}

.ai .bubble {
    background: var(--color-card);
    border-bottom-left-radius: 6px;
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.02);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--color-border);
}

.time {
    display: block;
    font-size: 10px;
    margin-top: 5px;
    opacity: 0.4;
    font-weight: 300;
}

/* 操作菜单 */
.bubble-actions {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(50, 30, 40, 0.2);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
}

.action-menu {
    background: var(--color-bg);
    border-radius: 20px;
    padding: 8px;
    min-width: 160px;
    box-shadow: 0 8px 32px rgba(200, 130, 160, 0.1);
}

.action-menu button {
    display: block;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    font-size: 14px;
    color: var(--color-text);
    text-align: center;
    cursor: pointer;
    border-radius: 12px;
    transition: background 0.2s;
}

.action-menu button:active {
    background: rgba(212, 137, 158, 0.06);
}

.action-menu button.danger {
    color: #c07070;
}

.panel-enter-active {
    transition: opacity 0.25s ease;
}

.panel-leave-active {
    transition: opacity 0.2s ease;
}

.panel-enter-from,
.panel-leave-to {
    opacity: 0;
}
</style>
