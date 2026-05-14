<template>
    <div class="home-indicator-area">
        <div class="home-indicator"></div>
    </div>
</template>

<style scoped>
.home-indicator-area {
    height: calc(env(safe-area-inset-bottom, 0px) + 8px);
    min-height: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
}

.home-indicator {
    width: 134px;
    height: 5px;
    background: var(--color-text);
    border-radius: 3px;
    opacity: 0.3;
}
</style>
