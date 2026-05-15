<template>
    <button class="soft-btn" :class="[variant, size, { block }]" :disabled="disabled">
        <slot />
    </button>
</template>

<script setup>
defineProps({
    variant: { type: String, default: 'primary' }, // primary, secondary, ghost, glass
    size: { type: String, default: 'md' }, // sm, md, lg
    block: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false }
})
</script>

<style scoped>
.soft-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: all var(--duration-normal) var(--ease-soft);
}

.soft-btn:active {
    transform: scale(0.96);
    opacity: 0.85;
}

.soft-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: none;
}

/* Sizes */
.soft-btn.sm {
    padding: 7px 14px;
    font-size: 12px;
    border-radius: 10px;
}

.soft-btn.md {
    padding: 11px 20px;
    font-size: 14px;
    border-radius: 12px;
}

.soft-btn.lg {
    padding: 14px 24px;
    font-size: 15px;
    border-radius: 14px;
}

.soft-btn.block {
    width: 100%;
}

/* Variants */
.soft-btn.primary {
    background: linear-gradient(135deg, #e8a8be, #d4899e);
    color: white;
    box-shadow: 0 3px 12px rgba(212, 137, 158, 0.2);
}

.soft-btn.primary:active {
    box-shadow: 0 1px 6px rgba(212, 137, 158, 0.15);
}

.soft-btn.secondary {
    background: var(--color-card);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.soft-btn.ghost {
    background: none;
    color: var(--color-primary);
    border: 1px dashed rgba(212, 137, 158, 0.3);
}

.soft-btn.glass {
    background: rgba(255, 248, 252, 0.5);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    box-shadow: 0 2px 8px rgba(200, 130, 160, 0.06);
}

.soft-btn.danger {
    background: rgba(200, 100, 100, 0.04);
    color: #c07070;
    border: 1px solid rgba(200, 100, 100, 0.15);
}

.soft-btn.danger:active {
    background: rgba(200, 100, 100, 0.08);
}
</style>
