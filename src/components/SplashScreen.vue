<template>
    <transition name="splash-exit">
        <div v-if="visible" class="splash-screen">
            <!-- 第一阶段：环境唤醒 -->
            <div class="splash-bg" :class="{ awake: phase >= 1 }"></div>
            <div class="splash-fog"></div>

            <!-- 第二阶段：光锚点 -->
            <div class="splash-anchor" :class="{ appear: phase >= 2, fadeout: phase >= 3 }">
                <div class="anchor-glow"></div>
                <div class="anchor-core"></div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const visible = ref(true)
const phase = ref(0)

const emit = defineEmits(['done'])

onMounted(() => {
    setTimeout(() => { phase.value = 1 }, 100)
    setTimeout(() => { phase.value = 2 }, 1000)
    // 光球开始淡出
    setTimeout(() => { phase.value = 3 }, 2400)
    // 完全退出
    setTimeout(() => {
        visible.value = false
        setTimeout(() => emit('done'), 400)
    }, 2800)
})

</script>

<style scoped>
.splash-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

/* 背景 */
.splash-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(160deg, #0a0810 0%, #1a1225 40%, #12101a 100%);
    opacity: 0;
    transition: opacity 1s ease;
}

.splash-bg.awake {
    opacity: 1;
}

/* 雾层 */
.splash-fog {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, rgba(60, 40, 70, 0.08) 0%, transparent 70%);
    animation: fogBreathe 4s ease-in-out infinite;
}

@keyframes fogBreathe {

    0%,
    100% {
        opacity: 0.06;
    }

    50% {
        opacity: 0.1;
    }
}

/* 光锚点 */
.splash-anchor {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    filter: blur(12px);
    transform: scale(0.95);
    transition: opacity 1.2s ease, filter 1.2s ease, transform 1.2s ease;
}

.splash-anchor.appear {
    opacity: 1;
    filter: blur(0px);
    transform: scale(1);
    animation: anchorFloat 3s ease-in-out infinite;
}

@keyframes anchorFloat {

    0%,
    100% {
        transform: translateY(0) scale(1);
    }

    50% {
        transform: translateY(-2px) scale(1.005);
    }
}

/* 核心光球 */
.anchor-core {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(220, 180, 200, 0.9) 0%, rgba(180, 140, 170, 0.4) 60%, transparent 100%);
    box-shadow: 0 0 20px rgba(200, 160, 180, 0.3);
}

/* 光晕 */
.anchor-glow {
    position: absolute;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(200, 160, 180, 0.15) 0%, transparent 70%);
    animation: glowPulse 2.5s ease-in-out infinite;
}

@keyframes glowPulse {

    0%,
    100% {
        transform: scale(1);
        opacity: 0.6;
    }

    50% {
        transform: scale(1.15);
        opacity: 0.9;
    }
}

/* 退出动画 */
.splash-exit-leave-active {
    transition: opacity 0.8s ease, transform 0.8s ease;
}

.splash-exit-leave-to {
    opacity: 0;
    transform: scale(1.05);
}

.splash-anchor.fadeout {
    opacity: 0;
    filter: blur(6px);
    transform: scale(1.08);
    transition: opacity 0.6s ease, filter 0.6s ease, transform 0.6s ease;
}
</style>
