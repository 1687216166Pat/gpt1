<template>
    <div class="bubble-wrapper" :class="msg.role" v-if="msg.content">
        <div class="bubble">
            <p>{{ msg.content }}</p>
            <span class="time">{{ formatTime(msg.timestamp) }}</span>
        </div>
    </div>
</template>

<script setup>
defineProps({
    msg: Object
})

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
    margin-bottom: 14px;
    animation: fadeIn 0.35s var(--ease-soft) backwards;
}

.bubble-wrapper.user {
    justify-content: flex-end;
}

.bubble-wrapper.ai {
    justify-content: flex-start;
}

.bubble {
    max-width: 72%;
    padding: 11px 15px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.5;
    color: var(--color-text);
}

.user .bubble {
    background: var(--color-primary);
    color: white;
    border-bottom-right-radius: 5px;
    box-shadow: 0 1px 4px rgba(196, 160, 176, 0.2);
}

.ai .bubble {
    background: var(--color-card);
    border-bottom-left-radius: 5px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

.time {
    display: block;
    font-size: 10px;
    margin-top: 5px;
    opacity: 0.45;
    font-weight: 300;
}
</style>
