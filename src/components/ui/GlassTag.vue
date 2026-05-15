<template>
    <span class="glass-tag" :class="[variant, size]">
        <slot />
    </span>
</template>

<script setup>
defineProps({
    variant: { type: String, default: 'default' }, // default, pink, purple, warm, soft
    size: { type: String, default: 'md' } // sm, md
})
</script>

<style scoped>
.glass-tag {
    display: inline-flex;
    align-items: center;
    border-radius: 20px;
    font-weight: 400;
    letter-spacing: 0.02em;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}

.glass-tag.sm {
    padding: 3px 10px;
    font-size: 10px;
}

.glass-tag.md {
    padding: 5px 13px;
    font-size: 12px;
}

.glass-tag.default {
    background: rgba(200, 160, 180, 0.1);
    color: var(--color-text-light);
    border: 1px solid var(--color-border);
}

.glass-tag.pink {
    background: rgba(212, 137, 158, 0.1);
    color: #c07088;
    border: 1px solid rgba(212, 137, 158, 0.15);
}

.glass-tag.purple {
    background: rgba(160, 130, 180, 0.1);
    color: #8a70a0;
    border: 1px solid rgba(160, 130, 180, 0.12);
}

.glass-tag.warm {
    background: rgba(200, 160, 120, 0.1);
    color: #a08860;
    border: 1px solid rgba(200, 160, 120, 0.12);
}

.glass-tag.soft {
    background: rgba(180, 200, 180, 0.1);
    color: #708870;
    border: 1px solid rgba(180, 200, 180, 0.12);
}
</style>
