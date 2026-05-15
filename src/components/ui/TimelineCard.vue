<template>
    <div class="timeline-card">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
            <span class="timeline-time" v-if="time">{{ time }}</span>
            <p class="timeline-text">
                <slot />
            </p>
        </div>
    </div>
</template>

<script setup>
defineProps({
    time: { type: String, default: '' }
})
</script>

<style scoped>
.timeline-card {
    display: flex;
    gap: 14px;
    padding: 16px 0;
    animation: fadeIn 0.4s var(--ease-soft) backwards;
}

.timeline-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: linear-gradient(135deg, #e8a8be, #d4899e);
    margin-top: 6px;
    flex-shrink: 0;
    box-shadow: 0 0 8px rgba(212, 137, 158, 0.2);
}

.timeline-content {
    flex: 1;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--color-border);
}

.timeline-time {
    font-size: 10px;
    color: var(--color-text-light);
    opacity: 0.6;
    letter-spacing: 0.5px;
    display: block;
    margin-bottom: 4px;
}

.timeline-text {
    font-size: 14px;
    color: var(--color-text);
    line-height: 1.6;
    font-weight: 400;
}

.timeline-card:last-child .timeline-content {
    border-bottom: none;
}
</style>
