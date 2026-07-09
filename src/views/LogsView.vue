<template>
    <div class="logs-page">
        <div class="settings-blob sb-tl"></div>
        <div class="settings-blob sb-br"></div>

        <div class="logs-nav">
            <button class="logs-back" @click="$router.push('/')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>
            <div class="logs-header-title">
                <span class="logs-title">语料库</span>
                <span class="logs-subtitle">Corpus</span>
            </div>
            <button class="logs-add-btn" @click="showAdd = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>
        </div>

        <!-- 角色切换 -->
        <div class="persona-scroll">
            <div v-for="p in personas" :key="p.id" class="persona-chip" :class="{ active: currentPersona === p.id }"
                @click="switchPersona(p.id)">
                <div class="persona-chip-avatar">
                    <img v-if="p.avatarUrl" :src="p.avatarUrl" />
                    <span v-else>{{ p.avatar || '💬' }}</span>
                </div>
                <span>{{ p.note || p.name }}</span>
            </div>
        </div>

        <!-- 分类筛选 -->
        <div class="filter-scroll">
            <button class="filter-chip" :class="{ active: filter === 'all' }" @click="filter = 'all'">全部</button>
            <button class="filter-chip" :class="{ active: filter === 'reply' }" @click="filter = 'reply'">回复样本</button>
            <button class="filter-chip" :class="{ active: filter === 'trait' }" @click="filter = 'trait'">行为特征</button>
            <button class="filter-chip" :class="{ active: filter === 'scene' }" @click="filter = 'scene'">情境行为</button>
            <button class="filter-chip" :class="{ active: filter === 'style' }" @click="filter = 'style'">关系风格</button>
        </div>

        <div class="logs-content">
            <div v-if="filteredSamples.length === 0" class="empty-state-unified">
                <p class="empty-icon">📋</p>
                <p class="empty-title">还没有语料</p>
                <p class="empty-sub">在关于他页面点击「立即沉淀」可以自动提取</p>
            </div>

            <div v-for="sample in filteredSamples" :key="sample.id" class="sample-card">
                <div class="sample-header">
                    <span class="sample-tag" :class="'tag-' + sample.type">{{ typeLabel(sample.type) }}</span>
                    <span class="sample-time" v-if="sample.created_at">
                        {{ sample.created_at?.slice(0, 10) }}
                    </span>
                    <button class="sample-del" @click="deleteSample(sample.id)">×</button>
                </div>
                <div class="sample-body">
                    <template v-if="sample.type === 'reply'">
                        <p class="sample-user-msg">{{ sample.data.user_message }}</p>
                        <p class="sample-ai-msg">{{ sample.data.assistant_reply }}</p>
                    </template>
                    <template v-else-if="sample.type === 'trait'">
                        <p class="sample-main">{{ sample.data.trait }}</p>
                        <p class="sample-sub">{{ sample.data.description }}</p>
                    </template>
                    <template v-else-if="sample.type === 'scene'">
                        <p class="sample-main">{{ sample.data.scene }}</p>
                        <p v-for="b in sample.data.behavior" :key="b" class="sample-sub">· {{ b }}</p>
                    </template>
                    <template v-else-if="sample.type === 'style'">
                        <p v-for="s in sample.data.relationship_style" :key="s" class="sample-sub">· {{ s }}</p>
                    </template>
                </div>
            </div>
        </div>

        <!-- 添加弹窗 -->
        <BlurModal :visible="showAdd" @close="showAdd = false">
            <h3>添加采样</h3>
            <div class="form-row">
                <label class="form-label">类型</label>
                <select v-model="newSample.type" class="form-select">
                    <option value="reply">回复样本</option>
                    <option value="trait">行为特征</option>
                    <option value="scene">情境行为</option>
                    <option value="style">关系风格</option>
                </select>
            </div>
            <template v-if="newSample.type === 'reply'">
                <DreamInput label="用户消息" v-model="newSample.user_message" placeholder="用户说了什么" />
                <DreamInput label="AI回复" v-model="newSample.assistant_reply" placeholder="AI怎么回的" />
            </template>
            <template v-if="newSample.type === 'trait'">
                <DreamInput label="特征名称" v-model="newSample.trait" placeholder="例：默认关系存在" />
                <DreamInput label="描述" v-model="newSample.description" placeholder="例：不会频繁确认关系" />
            </template>
            <template v-if="newSample.type === 'scene'">
                <DreamInput label="情境" v-model="newSample.scene" placeholder="例：late_night" />
                <DreamInput label="行为（换行分隔）" type="textarea" v-model="newSample.behavior" :rows="3"
                    placeholder="回复更短&#10;更安静&#10;增加停顿" />
            </template>
            <template v-if="newSample.type === 'style'">
                <DreamInput label="关系风格（换行分隔）" type="textarea" v-model="newSample.styles" :rows="3"
                    placeholder="长期陪伴&#10;默认亲近&#10;低情绪表达" />
            </template>
            <div class="modal-actions">
                <SoftButton variant="secondary" @click="showAdd = false">取消</SoftButton>
                <SoftButton variant="primary" @click="addSample">保存</SoftButton>
            </div>
        </BlurModal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/utils/api'
import SoftButton from '@/components/ui/SoftButton.vue'
import DreamInput from '@/components/ui/DreamInput.vue'
import BlurModal from '@/components/ui/BlurModal.vue'

const personas = ref([])
const currentPersona = ref('')
const samples = ref([])
const filter = ref('all')
const showAdd = ref(false)

const newSample = ref({
    type: 'reply',
    user_message: '', assistant_reply: '',
    trait: '', description: '',
    scene: '', behavior: '', styles: '',
})

const filteredSamples = computed(() => {
    if (filter.value === 'all') return samples.value
    return samples.value.filter(s => s.type === filter.value)
})

function typeLabel(type) {
    const map = { reply: '回复样本', trait: '行为特征', scene: '情境行为', style: '关系风格' }
    return map[type] || type
}

async function loadPersonas() {
    try {
        const res = await api('/api/prompts/personas')
        const data = await res.json()
        const pinnedList = JSON.parse(localStorage.getItem('pinned_personas') || '[]')
        personas.value = data.personas.sort((a, b) => {
            if (pinnedList.includes(a.id) && !pinnedList.includes(b.id)) return -1
            if (!pinnedList.includes(a.id) && pinnedList.includes(b.id)) return 1
            return 0
        })
        try {
            const latestRes = await api('/api/messages/latest-persona')
            const latestData = await latestRes.json()
            currentPersona.value = latestData.personaId || personas.value[0]?.id || ''
        } catch {
            currentPersona.value = personas.value[0]?.id || ''
        }
        await loadSamples()
    } catch { }
}

async function loadSamples() {
    if (!currentPersona.value) return
    try {
        const res = await api(`/api/samples/${currentPersona.value}`)
        samples.value = await res.json()
    } catch { samples.value = [] }
}

function switchPersona(id) {
    currentPersona.value = id
    loadSamples()
}

async function addSample() {
    let data = {}
    switch (newSample.value.type) {
        case 'reply':
            data = { user_message: newSample.value.user_message, assistant_reply: newSample.value.assistant_reply }
            break
        case 'trait':
            data = { trait: newSample.value.trait, description: newSample.value.description }
            break
        case 'scene':
            data = { scene: newSample.value.scene, behavior: newSample.value.behavior.split('\n').filter(Boolean) }
            break
        case 'style':
            data = { relationship_style: newSample.value.styles.split('\n').filter(Boolean) }
            break
    }
    await api(`/api/samples/${currentPersona.value}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newSample.value.type, data })
    })
    showAdd.value = false
    newSample.value = { type: 'reply', user_message: '', assistant_reply: '', trait: '', description: '', scene: '', behavior: '', styles: '' }
    await loadSamples()
}

async function deleteSample(id) {
    if (!confirm('删除这条采样？')) return
    await api(`/api/samples/${id}`, { method: 'DELETE' })
    await loadSamples()
}

onMounted(loadPersonas)
</script>

<style scoped>
.logs-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: relative;
    background: linear-gradient(180deg, #FFFBFA 0%, #FFF0F2 60%, #FFE9ED 100%);
    box-sizing: border-box;
}

.settings-blob {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    z-index: 0;
    filter: blur(60px);
}

.sb-tl {
    top: -40px;
    left: -50px;
    width: 220px;
    height: 220px;
    background: #F1DADD;
    opacity: 0.45;
}

.sb-br {
    bottom: 40px;
    right: -60px;
    width: 200px;
    height: 200px;
    background: #98CBEA;
    opacity: 0.2;
}

.logs-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 44px) + 8px) 16px 4px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}

.logs-back {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border: 1px solid rgba(255, 240, 242, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.logs-back svg {
    width: 16px;
    height: 16px;
    stroke: #D9A3AF;
}

.logs-header-title {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 8px;
    justify-content: center;
}

.logs-title {
    font-size: 22px;
    font-weight: 800;
    color: #4A3F41;
    letter-spacing: 0.3px;
}

.logs-subtitle {
    font-size: 11px;
    color: #B8A9AC;
    font-weight: 400;
    letter-spacing: 1.5px;
}

.logs-add-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border: 1px solid rgba(255, 240, 242, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.logs-add-btn svg {
    width: 18px;
    height: 18px;
    stroke: #D9A3AF;
}

.persona-scroll {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    overflow-x: auto;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.persona-scroll::-webkit-scrollbar {
    display: none;
}

.persona-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px 6px 6px;
    border-radius: 20px;
    border: 1px solid rgba(255, 240, 242, 0.4);
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: saturate(180%) blur(16px);
    -webkit-backdrop-filter: saturate(180%) blur(16px);
    cursor: pointer;
    white-space: nowrap;
    font-size: 12px;
    color: #6B5B5E;
    transition: all 0.2s;
}

.persona-chip.active {
    background: linear-gradient(135deg, #E8C0C9, #D9A3AF);
    color: white;
    border-color: transparent;
}

.persona-chip-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: rgba(255, 233, 237, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    overflow: hidden;
    flex-shrink: 0;
}

.persona-chip-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.filter-scroll {
    display: flex;
    gap: 6px;
    padding: 0 16px 10px;
    overflow-x: auto;
    flex-shrink: 0;
}

.filter-scroll::-webkit-scrollbar {
    display: none;
}

.filter-chip {
    padding: 5px 14px;
    border-radius: 20px;
    border: 1px solid rgba(255, 240, 242, 0.4);
    background: none;
    font-size: 11px;
    color: #B8A9AC;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    font-family: inherit;
}

.filter-chip.active {
    background: rgba(217, 163, 175, 0.15);
    color: #D9A3AF;
    border-color: rgba(217, 163, 175, 0.4);
}

.logs-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
    position: relative;
    z-index: 1;
}

.logs-content::-webkit-scrollbar {
    display: none;
}

.sample-card {
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 18px;
    padding: 14px 16px;
    margin-bottom: 10px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.sample-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
}

.sample-tag {
    padding: 3px 10px;
    border-radius: 10px;
    font-size: 10px;
    font-weight: 600;
}

.tag-reply {
    background: rgba(232, 192, 201, 0.25);
    color: #D9A3AF;
}

.tag-trait {
    background: rgba(216, 205, 234, 0.35);
    color: #9B89B4;
}

.tag-scene {
    background: rgba(245, 234, 208, 0.5);
    color: #B8965A;
}

.tag-style {
    background: rgba(216, 237, 247, 0.5);
    color: #6BAED6;
}

.sample-time {
    font-size: 10px;
    color: #B8A9AC;
    margin-left: auto;
}

.sample-del {
    background: none;
    border: none;
    font-size: 16px;
    color: #B8A9AC;
    cursor: pointer;
    opacity: 0.5;
    margin-left: 4px;
}

.sample-user-msg {
    font-size: 12px;
    color: #B8A9AC;
    padding: 6px 10px;
    background: rgba(217, 163, 175, 0.06);
    border-radius: 8px;
    margin-bottom: 6px;
}

.sample-ai-msg {
    font-size: 13px;
    color: #4A3F41;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    border-left: 2px solid #D9A3AF;
}

.sample-main {
    font-size: 13px;
    font-weight: 600;
    color: #4A3F41;
    margin-bottom: 4px;
}

.sample-sub {
    font-size: 12px;
    color: #6B5B5E;
    line-height: 1.6;
}

.empty-state-unified {
    text-align: center;
    padding: 48px 24px;
}

.empty-icon {
    font-size: 28px;
    margin-bottom: 14px;
}

.empty-title {
    font-size: 14px;
    color: #4A3F41;
    font-weight: 400;
    margin-bottom: 6px;
}

.empty-sub {
    font-size: 12px;
    color: #B8A9AC;
    line-height: 1.6;
}

.form-row {
    margin-bottom: 12px;
}

.form-label {
    display: block;
    font-size: 11px;
    color: #B8A9AC;
    margin-bottom: 6px;
}

.form-select {
    width: 100%;
    height: 38px;
    border: 1px solid rgba(255, 240, 242, 0.5);
    border-radius: 10px;
    padding: 0 12px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.5);
    color: #4A3F41;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
}
</style>
