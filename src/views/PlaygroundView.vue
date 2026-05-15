<template>
    <div class="playground-page">
        <div class="playground-header">
            <button class="back-btn" @click="$router.push('/')">‹</button>
            <h2>UI Playground</h2>
        </div>

        <div class="playground-content">
            <!-- GlassCard -->
            <section>
                <h3>GlassCard</h3>
                <GlassCard size="sm">小卡片 · 轻盈漂浮</GlassCard>
                <GlassCard size="md" floating>中卡片 · 带漂浮动画</GlassCard>
                <GlassCard size="lg">大卡片 · 充足留白</GlassCard>
            </section>

            <!-- SoftButton -->
            <section>
                <h3>SoftButton</h3>
                <div class="btn-row">
                    <SoftButton variant="primary" size="sm">主按钮</SoftButton>
                    <SoftButton variant="secondary" size="sm">次按钮</SoftButton>
                    <SoftButton variant="ghost" size="sm">幽灵</SoftButton>
                    <SoftButton variant="glass" size="sm">玻璃</SoftButton>
                </div>
                <SoftButton variant="primary" block>完整宽度主按钮</SoftButton>
                <SoftButton variant="primary" block disabled>禁用状态</SoftButton>
            </section>

            <!-- DreamInput -->
            <section>
                <h3>DreamInput</h3>
                <DreamInput label="名字" placeholder="输入点什么..." v-model="demoText" />
                <DreamInput label="描述" type="textarea" placeholder="写下你的想法..." v-model="demoTextarea" :rows="4" />
            </section>

            <!-- GlassTag -->
            <section>
                <h3>GlassTag</h3>
                <div class="tag-row">
                    <GlassTag>默认</GlassTag>
                    <GlassTag variant="pink">粉色</GlassTag>
                    <GlassTag variant="purple">紫色</GlassTag>
                    <GlassTag variant="warm">暖色</GlassTag>
                    <GlassTag variant="soft">柔绿</GlassTag>
                </div>
                <div class="tag-row">
                    <GlassTag size="sm" variant="pink">小标签</GlassTag>
                    <GlassTag size="sm" variant="purple">小标签</GlassTag>
                </div>
            </section>

            <!-- TimelineCard -->
            <section>
                <h3>TimelineCard</h3>
                <TimelineCard time="3天前">你们第一次深夜聊到凌晨三点</TimelineCard>
                <TimelineCard time="1周前">她第一次主动说想你了</TimelineCard>
                <TimelineCard time="2周前">开始习惯每天道晚安</TimelineCard>
            </section>

            <!-- BlurModal -->
            <section>
                <h3>BlurModal</h3>
                <SoftButton variant="glass" block @click="showModal = true">打开弹窗</SoftButton>
                <BlurModal :visible="showModal" @close="showModal = false">
                    <h3 style="text-align:center;margin-bottom:16px;font-size:16px;color:var(--color-text)">梦境弹窗</h3>
                    <p style="text-align:center;color:var(--color-text-light);font-size:13px;margin-bottom:20px">
                        像梦境中的浮层一样柔和</p>
                    <SoftButton variant="primary" block @click="showModal = false">关闭</SoftButton>
                </BlurModal>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import SoftButton from '@/components/ui/SoftButton.vue'
import DreamInput from '@/components/ui/DreamInput.vue'
import GlassTag from '@/components/ui/GlassTag.vue'
import TimelineCard from '@/components/ui/TimelineCard.vue'
import BlurModal from '@/components/ui/BlurModal.vue'

const demoText = ref('')
const demoTextarea = ref('')
const showModal = ref(false)
</script>

<style scoped>
.playground-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: env(safe-area-inset-top, 44px);
}

.playground-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
    flex-shrink: 0;
}

.back-btn {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--color-primary);
    cursor: pointer;
    opacity: 0.75;
}

.playground-header h2 {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text);
}

.playground-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 0;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
}

section {
    margin-bottom: 36px;
    animation: fadeIn 0.4s var(--ease-soft) backwards;
}

section:nth-child(2) {
    animation-delay: 0.06s;
}

section:nth-child(3) {
    animation-delay: 0.12s;
}

section:nth-child(4) {
    animation-delay: 0.18s;
}

section:nth-child(5) {
    animation-delay: 0.24s;
}

section:nth-child(6) {
    animation-delay: 0.30s;
}

section h3 {
    font-size: 11px;
    color: var(--color-text-light);
    margin-bottom: 14px;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    font-weight: 400;
}

.btn-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
}

.tag-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 10px;
}

section>.glass-card {
    margin-bottom: 12px;
}

section>.soft-btn {
    margin-bottom: 10px;
}
</style>
