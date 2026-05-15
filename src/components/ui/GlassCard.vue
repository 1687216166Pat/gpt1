<template>
    <div class="glass-card" :class="[size, { floating }]">
        <slot />
    </div>
</template>

<script setup>
defineProps({
    size: { type: String, default: 'md' }, // sm, md, lg
    floating: { type: Boolean, default: false }
})
</script>

<style scoped>
.glass-card {
  background: rgba(255, 250, 254, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 4px 24px rgba(200, 130, 160, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: transform var(--duration-slow) var(--ease-soft), box-shadow var(--duration-slow) var(--ease-soft);
}


.glass-card.sm {
    border-radius: 14px;
    padding: 12px 14px;
}

.glass-card.md {
    border-radius: 20px;
    padding: 18px 20px;
}

.glass-card.lg {
    border-radius: 26px;
    padding: 24px;
}

.glass-card.floating {
    animation: softFloat 8s ease-in-out infinite;
}

@keyframes softFloat {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-3px);
    }
}
</style>
