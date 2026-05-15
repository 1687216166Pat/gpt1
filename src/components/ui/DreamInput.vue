<template>
    <div class="dream-input-wrapper">
        <label v-if="label" class="dream-label">{{ label }}</label>
        <input v-if="type !== 'textarea'" class="dream-input" :type="type" :value="modelValue"
            :placeholder="placeholder" @input="$emit('update:modelValue', $event.target.value)" />
        <textarea v-else class="dream-textarea" :value="modelValue" :placeholder="placeholder" :rows="rows"
            @input="$emit('update:modelValue', $event.target.value)" />
    </div>
</template>

<script setup>
defineProps({
    modelValue: { type: String, default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    type: { type: String, default: 'text' },
    rows: { type: Number, default: 4 }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.dream-input-wrapper {
    margin-bottom: 14px;
}

.dream-label {
    display: block;
    font-size: 11px;
    color: var(--color-text-light);
    margin-bottom: 6px;
    letter-spacing: 0.4px;
    font-weight: 400;
}

.dream-input {
    width: 100%;
    height: 42px;
    border: 1px solid var(--color-border);
    border-radius: 14px;
    padding: 0 16px;
    font-size: 14px;
    font-family: inherit;
    background: var(--color-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    outline: none;
    color: var(--color-text);
    transition: border-color var(--duration-normal) var(--ease-soft), box-shadow var(--duration-normal) var(--ease-soft);
}

.dream-input:focus {
    border-color: rgba(212, 137, 158, 0.25);
    box-shadow: 0 0 0 4px rgba(212, 137, 158, 0.05);
}

.dream-input::placeholder {
    color: var(--color-text-light);
    opacity: 0.5;
}

.dream-textarea {
    width: 100%;
    border: 1px solid var(--color-border);
    border-radius: 16px;
    padding: 14px 16px;
    font-size: 14px;
    font-family: inherit;
    background: var(--color-card);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    outline: none;
    resize: none;
    line-height: 1.55;
    color: var(--color-text);
    transition: border-color var(--duration-normal) var(--ease-soft);
}

.dream-textarea:focus {
    border-color: rgba(212, 137, 158, 0.25);
}

.dream-textarea::placeholder {
    color: var(--color-text-light);
    opacity: 0.5;
}
</style>
