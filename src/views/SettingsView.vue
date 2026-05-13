<template>
    <div class="settings-page">
        <div class="settings-header">
            <button class="back-btn" @click="$router.push('/')">‹</button>
            <h2>设置</h2>
        </div>

        <div class="settings-content">
            <!-- 人格切换 -->
            <div class="section">
                <h3>人格选择（第二层）</h3>
                <div v-for="p in personas" :key="p.id" class="persona-card" :class="{ active: p.id === activePersona }"
                    @click="switchPersona(p.id)">
                    <span class="persona-name">{{ p.name }}</span>
                    <span class="persona-desc">{{ p.description }}</span>
                    <span class="check" v-if="p.id === activePersona">✓</span>
                </div>
            </div>

            <!-- 用户偏好 -->
            <div class="section">
                <h3>我的偏好（第三层）</h3>
                <p class="section-tip">这里的设定会叠加在人格之上，不会覆盖核心性格</p>
                <textarea v-model="userPrompt" :placeholder="template" rows="10"></textarea>
                <button class="save-btn" @click="saveUserPrompt">保存偏好</button>
                <p class="save-tip" v-if="saved">已保存 ✓</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const personas = ref([])
const activePersona = ref('')
const userPrompt = ref('')
const template = ref('')
const saved = ref(false)

async function loadData() {
    try {
        const pRes = await fetch('/api/prompts/personas')
        console.log('personas 状态:', pRes.status)
        const pData = await pRes.json()
        console.log('personas 数据:', pData)
        personas.value = pData.personas
        activePersona.value = pData.active

        const uRes = await fetch('/api/prompts/user')
        console.log('user prompt 状态:', uRes.status)
        const uData = await uRes.json()
        console.log('user prompt 数据:', uData)
        userPrompt.value = uData.content
        template.value = uData.template
    } catch (e) {
        console.error('loadData 报错:', e)
    }
}

async function switchPersona(id) {
    console.log('切换人格:', id)
    const res = await fetch(`/api/prompts/personas/${id}/activate`, { method: 'POST' })
    const data = await res.json()
    console.log('切换结果:', data)
    activePersona.value = id
}

onMounted(loadData)
</script>

<style scoped>
.settings-page {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.settings-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-bg-secondary);
}

.back-btn {
    background: none;
    border: none;
    font-size: 28px;
    color: var(--color-primary);
    cursor: pointer;
}

.settings-header h2 {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
}

.settings-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
}

.section {
    margin-bottom: 28px;
}

.section h3 {
    font-size: 13px;
    color: var(--color-text-light);
    margin-bottom: 10px;
}

.section-tip {
    font-size: 12px;
    color: var(--color-text-light);
    margin-bottom: 10px;
}

.persona-card {
    background: var(--color-white);
    border-radius: 12px;
    padding: 14px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.persona-card.active {
    border-color: var(--color-primary);
}

.persona-card:active {
    transform: scale(0.98);
}

.persona-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
}

.persona-desc {
    flex: 1;
    font-size: 13px;
    color: var(--color-text-light);
}

.check {
    color: var(--color-primary);
    font-weight: bold;
}

textarea {
    width: 100%;
    border: 1px solid var(--color-bg-secondary);
    border-radius: 12px;
    padding: 12px;
    font-size: 14px;
    font-family: inherit;
    background: var(--color-white);
    outline: none;
    resize: none;
    line-height: 1.5;
}

textarea:focus {
    border-color: var(--color-primary);
}

.save-btn {
    margin-top: 10px;
    padding: 10px 20px;
    border-radius: 10px;
    border: none;
    background: var(--color-primary);
    color: white;
    font-size: 14px;
    cursor: pointer;
    width: 100%;
}

.save-tip {
    text-align: center;
    color: var(--color-primary);
    font-size: 13px;
    margin-top: 8px;
}
</style>
