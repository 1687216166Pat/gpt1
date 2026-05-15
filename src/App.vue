<template>
    <div class="phone-screen" :class="period">
        <NotificationBanner />
        <main class="screen-content">
            <RouterView />
        </main>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import NotificationBanner from '@/components/NotificationBanner.vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useTime } from '@/composables/useTime'

const { connect, requestNotificationPermission, registerPushSubscription } = useWebSocket()
const { period, startClock, stopClock } = useTime()

onMounted(() => {
    connect()
    requestNotificationPermission()
    registerPushSubscription()
    startClock()
})

onUnmounted(() => {
    stopClock()
})
</script>

<style scoped>
.phone-screen {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    transition: background 1.2s var(--ease-soft);
}

.phone-screen.morning {
    background: linear-gradient(180deg, #fff5f8 0%, #fdf6f8 40%);
}

.phone-screen.forenoon {
    background: var(--color-bg);
}

.phone-screen.noon {
    background: linear-gradient(180deg, #fffaf5 0%, #fdf6f8 40%);
}

.phone-screen.afternoon {
    background: var(--color-bg);
}

.phone-screen.evening {
    background: linear-gradient(180deg, #f8e8e0 0%, #fdf6f8 40%);
}

.phone-screen.night {
    background: linear-gradient(180deg, #f0e0ea 0%, #f5eaf0 40%);
}

.phone-screen.midnight {
    background: linear-gradient(180deg, #382830 0%, #2a2228 50%);
}

.screen-content {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 22px;
    -webkit-overflow-scrolling: touch;
}
</style>
