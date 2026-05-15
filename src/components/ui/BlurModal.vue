<template>
    <Teleport to="body">
        <transition name="modal">
            <div v-if="visible" class="blur-overlay" @click.self="$emit('close')">
                <div class="blur-modal" :class="size">
                    <slot />
                </div>
            </div>
        </transition>
    </Teleport>
</template>

<script setup>
defineProps({
    visible: { type: Boolean, default: false },
    size: { type: String, default: 'md' } // sm, md, lg
})

defineEmits(['close'])
</script>

<style scoped>
.blur-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(50, 30, 40, 0.25);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 28px;
}

.blur-modal {
    background: var(--color-bg);
    border-radius: 28px;
    padding: 26px;
    width: 100%;
    max-height: 78vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(180, 100, 130, 0.1);
}

.blur-modal.sm {
    max-width: 280px;
}

.blur-modal.md {
    max-width: 330px;
}

.blur-modal.lg {
    max-width: 380px;
}

/* 动画 */
.modal-enter-active {
    transition: opacity 0.35s var(--ease-soft);
}

.modal-enter-active .blur-modal {
    transition: transform 0.4s var(--ease-soft), opacity 0.35s var(--ease-soft);
}

.modal-leave-active {
    transition: opacity 0.25s var(--ease-soft);
}

.modal-leave-active .blur-modal {
    transition: transform 0.25s var(--ease-soft), opacity 0.2s var(--ease-soft);
}

.modal-enter-from {
    opacity: 0;
}

.modal-enter-from .blur-modal {
    transform: translateY(12px) scale(0.97);
    opacity: 0;
}

.modal-leave-to {
    opacity: 0;
}

.modal-leave-to .blur-modal {
    transform: translateY(6px) scale(0.98);
    opacity: 0;
}
</style>
