<template>
    <div class="home-indicator-area">
        <div class="home-indicator"></div>
    </div>
</template>

<style scoped>
.home-indicator-area {
    padding-top: 6px;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
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
