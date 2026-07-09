<template>
    <div class="diary-page">
        <div class="settings-blob sb-tl"></div>
        <div class="settings-blob sb-br"></div>

        <div class="diary-nav">
            <button class="diary-back" @click="goBack">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>
            <div class="diary-header-title">
                <span class="diary-title">手记</span>
                <span class="diary-subtitle">Journal</span>
            </div>
            <button class="diary-add-btn" @click="showWrite = true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>
        </div>

        <!-- tab 切换 -->
        <div class="diary-tabs">
            <button class="diary-tab" :class="{ active: currentTab === 'ai' }" @click="switchTab('ai')">
                {{ aiName }}的日记
            </button>
            <button class="diary-tab" :class="{ active: currentTab === 'user' }" @click="switchTab('user')">
                我的日记
            </button>
        </div>

        <div class="diary-content">
            <div v-if="entries.length === 0" class="empty-state-unified">
                <p class="empty-icon">📝</p>
                <p class="empty-title">还没有日记</p>
                <p class="empty-sub" v-if="currentTab === 'ai'">在关于他页面点击「立即沉淀」可以生成 AI 日记</p>
                <p class="empty-sub" v-else>点击右上角 + 写一篇</p>
            </div>

            <div v-for="entry in entries" :key="entry.id" class="diary-card">
                <div class="diary-card-header">
                    <span class="diary-date">{{ entry.date }}</span>
                    <button class="diary-edit-btn" @click="startEdit(entry)">✎</button>
                </div>
                <p class="diary-entry-title" v-if="entry.title">{{ entry.title }}</p>
                <p class="diary-entry-content">{{ entry.content }}</p>
            </div>
        </div>

        <!-- 写日记弹窗 -->
        <BlurModal :visible="showWrite" @close="showWrite = false">
            <h3>写日记</h3>
            <DreamInput label="标题" v-model="newDiary.title" placeholder="今天的标题..." />
            <DreamInput label="内容" type="textarea" v-model="newDiary.content" :rows="6" placeholder="写点什么..." />
            <div class="modal-actions">
                <SoftButton variant="secondary" @click="showWrite = false">取消</SoftButton>
                <SoftButton variant="primary" @click="writeDiary" :disabled="!newDiary.content.trim()">保存</SoftButton>
            </div>
        </BlurModal>

        <!-- 编辑弹窗 -->
        <BlurModal :visible="showEdit" @close="showEdit = false">
            <h3>编辑日记</h3>
            <DreamInput label="内容" type="textarea" v-model="editContent" :rows="6" />
            <div class="modal-actions">
                <SoftButton variant="secondary" @click="showEdit = false">取消</SoftButton>
                <SoftButton variant="primary" @click="saveEdit">保存</SoftButton>
            </div>
        </BlurModal>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/utils/api'
import SoftButton from '@/components/ui/SoftButton.vue'
import DreamInput from '@/components/ui/DreamInput.vue'
import BlurModal from '@/components/ui/BlurModal.vue'
import { useRoute, useRouter } from 'vue-router'

const currentTab = ref('ai')
const entries = ref([])
const aiName = ref('TA')
const showWrite = ref(false)
const showEdit = ref(false)
const editPageId = ref('')
const editContent = ref('')
const route = useRoute()
const router = useRouter()

const newDiary = reactive({ title: '', content: '' })

async function loadEntries() {
    try {
        const res = await api(`/api/diary/${currentTab.value}`)
        entries.value = await res.json()
    } catch { entries.value = [] }
}

async function loadAiName() {
    try {
        const latestRes = await api('/api/messages/latest-persona')
        const latestData = await latestRes.json()
        const personaId = latestData.personaId || 'xiaorou'
        const detailRes = await api(`/api/persona/${personaId}`)
        const detail = await detailRes.json()
        aiName.value = detail.note || detail.name || 'TA'
    } catch { }
}

function switchTab(tab) {
    currentTab.value = tab
    loadEntries()
}

async function writeDiary() {
    if (!newDiary.content.trim()) return
    const today = new Date().toISOString().slice(0, 10)
    await api('/api/diary/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: newDiary.title || `日记 - ${today}`,
            content: newDiary.content,
            date: today,
            type: currentTab.value,
        })
    })
    showWrite.value = false
    newDiary.title = ''
    newDiary.content = ''
    await loadEntries()
}

function goBack() {
    const from = route.query.from
    if (from === 'habitat') {
        sessionStorage.setItem('home_return_page', '0')
        router.push('/')
    } else {
        router.push('/')
    }
}

function startEdit(entry) {
    editPageId.value = entry.id
    editContent.value = entry.content
    showEdit.value = true
}

async function saveEdit() {
    if (!editContent.value.trim()) return
    await api(`/api/diary/${editPageId.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.value })
    })
    showEdit.value = false
    await loadEntries()
}

onMounted(() => {
    loadAiName()
    loadEntries()
})
</script>

<style scoped>
.diary-page {
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

.diary-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: calc(env(safe-area-inset-top, 44px) + 8px) 16px 4px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}

.diary-header-title {
    flex: 1;
    display: flex;
    align-items: baseline;
    gap: 8px;
    justify-content: center;
}

.diary-back {
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

.diary-back svg {
    width: 16px;
    height: 16px;
    stroke: #D9A3AF;
}

.diary-title {
    font-size: 22px;
    font-weight: 800;
    color: #4A3F41;
    letter-spacing: 0.3px;
}

.diary-subtitle {
    font-size: 11px;
    color: #B8A9AC;
    font-weight: 400;
    letter-spacing: 1.5px;
}

.diary-add-btn {
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

.diary-add-btn svg {
    width: 18px;
    height: 18px;
    stroke: #D9A3AF;
}

.diary-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 16px;
    flex-shrink: 0;
    position: relative;
    z-index: 1;
}

.diary-tab {
    padding: 8px 18px;
    border-radius: 20px;
    border: 1px solid rgba(255, 240, 242, 0.4);
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: saturate(180%) blur(16px);
    -webkit-backdrop-filter: saturate(180%) blur(16px);
    font-size: 12px;
    color: #B8A9AC;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
}

.diary-tab.active {
    background: linear-gradient(135deg, #E8C0C9, #D9A3AF);
    color: white;
    border-color: transparent;
}

.diary-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
    position: relative;
    z-index: 1;
}

.diary-content::-webkit-scrollbar {
    display: none;
}

.diary-card {
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 18px;
    padding: 16px;
    margin-bottom: 12px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.diary-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.diary-date {
    font-size: 11px;
    color: #B8A9AC;
}

.diary-edit-btn {
    background: none;
    border: none;
    font-size: 14px;
    color: #D9A3AF;
    cursor: pointer;
    opacity: 0.5;
}

.diary-entry-title {
    font-size: 14px;
    font-weight: 600;
    color: #4A3F41;
    margin-bottom: 6px;
}

.diary-entry-content {
    font-size: 13px;
    color: #4A3F41;
    line-height: 1.7;
    white-space: pre-line;
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

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
}
</style>
