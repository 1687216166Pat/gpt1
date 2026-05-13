<template>
    <Transition name="slide-down">
        <div class="notification-banner" v-if="visible" @click="handleClick">
            <div class="notif-icon">💬</div>
            <div class="notif-content">
                <p class="notif-title">AI 助手</p>
                <p class="notif-text">{{ text }}</p>
            </div>
            <span class="notif-time">现在</span>
        </div>
    </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWebSocket } from '@/composables/useWebSocket'

const router = useRouter()
const { onMessage, removeHandler } = useWebSocket()

const visible = ref(false)
const text = ref('')
let hideTimer = null

function showNotification(content) {
    // 只在非聊天页面显示
    if (router.currentRoute.value.path === '/chat') return

    text.value = content.length > 40 ? content.slice(0, 40) + '...' : content
    visible.value = true

    clearTimeout(hideTimer)
    hideTimer = setTimeout(() => {
        visible.value = false
    }, 4000)
}

function handleClick() {
    visible.value = false
    router.push('/chat')
}

function handleIncoming(data) {
    if (data.type === 'chat' || data.type === 'push') {
        showNotification(data.content)
    }
}

onMounted(() => {
    onMessage(handleIncoming)
})

onUnmounted(() => {
    removeHandler(handleIncoming)
})
</script>

<style scoped>
.notification-banner {
    position: absolute;
    top: 50px;
    left: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 14px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    z-index: 100;
    cursor: pointer;
}

.notif-icon {
    width: 38px;
    height: 38px;
    border-radius: 9px;
    background: linear-gradient(135deg, #e8a0bf, #ba90c6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}

.notif-content {
    flex: 1;
    min-width: 0;
}

.notif-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text);
}

.notif-text {
    font-size: 13px;
    color: var(--color-text-light);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notif-time {
    font-size: 12px;
    color: var(--color-text-light);
    flex-shrink: 0;
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s ease;
}

.slide-down-enter-from {
    transform: translateY(-100%);
    opacity: 0;
}

.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}
</style>
