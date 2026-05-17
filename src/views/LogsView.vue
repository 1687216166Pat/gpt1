<template>
    <div class="logs-page">
        <div class="logs-header">
            <button class="back-btn" @click="$router.push('/')">‹</button>
            <h2>语料库</h2>
        </div>

        <!-- 人格切换 -->
        <div class="persona-tabs">
            <button v-for="p in personas" :key="p.id" class="tab-item" :class="{ active: currentPersona === p.id }"
                @click="switchPersona(p.id)">
                {{ p.name }}
            </button>
        </div>

        <!-- 日期选择 -->
        <div class="date-nav">
            <button class="date-arrow" @click="prevDay">‹</button>
            <span class="date-display">{{ displayDate }}</span>
            <button class="date-arrow" @click="nextDay">›</button>
        </div>

        <!-- 统计 -->
        <div class="log-stats" v-if="dayLog.messages.length > 0">
            <GlassTag variant="pink" size="sm">{{ dayLog.messages.length }} 条消息</GlassTag>
            <GlassTag variant="purple" size="sm">{{ platforms }}</GlassTag>
        </div>

        <!-- 消息列表 -->
        <div class="log-content">
            <div v-if="dayLog.messages.length > 0" class="log-list">
                <div v-for="msg in dayLog.messages" :key="msg.id" class="log-item" :class="msg.role">
                    <div class="log-meta">
                        <span class="log-time">{{ formatTime(msg.timestamp) }}</span>
                        <GlassTag :variant="platformColor(msg.platform)" size="sm">{{ msg.platform }}</GlassTag>
                    </div>
                    <div class="log-bubble">
                        <p>{{ msg.content }}</p>
                    </div>
                </div>
            </div>

            <div v-else class="empty-state">
                <p class="empty-icon">📋</p>
                <p class="empty-title">这天没有记录</p>
            </div>
        </div>

        <!-- 导出按钮 -->
        <div class="log-footer" v-if="dayLog.messages.length > 0">
            <SoftButton variant="glass" size="sm" block @click="exportDay">导出当天日志</SoftButton>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/utils/api'
import GlassCard from '@/components/ui/GlassCard.vue'
import GlassTag from '@/components/ui/GlassTag.vue'
import SoftButton from '@/components/ui/SoftButton.vue'

const currentDate = ref(new Date().toISOString().slice(0, 10))
const dayLog = ref({ date: '', messages: [] })
const personas = ref([])
const currentPersona = ref('')

async function loadPersonas() {
    try {
        const res = await api('/api/prompts/personas')
        const data = await res.json()
        personas.value = data.personas.map(p => ({ id: p.id, name: p.name }))

        // 置顶排序
        const pinnedList = JSON.parse(localStorage.getItem('pinned_personas') || '[]')
        personas.value.sort((a, b) => {
            const aPinned = pinnedList.includes(a.id)
            const bPinned = pinnedList.includes(b.id)
            if (aPinned && !bPinned) return -1
            if (!aPinned && bPinned) return 1
            return 0
        })

        // 优先选择置顶的
        if (pinnedList.length > 0) {
            currentPersona.value = pinnedList[0]
        } else {
            try {
                const latestRes = await api('/api/messages/latest-persona')
                const latestData = await latestRes.json()
                currentPersona.value = latestData.personaId || personas.value[0]?.id || ''
            } catch {
                currentPersona.value = personas.value[0]?.id || ''
            }
        }

        await loadLog()
    } catch { }
}


function switchPersona(id) {
    currentPersona.value = id
    loadLog()
}

const displayDate = computed(() => {
    const d = new Date(currentDate.value)
    const today = new Date().toISOString().slice(0, 10)
    if (currentDate.value === today) return '今天'
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (currentDate.value === yesterday) return '昨天'
    return `${d.getMonth() + 1}月${d.getDate()}日`
})

const platforms = computed(() => {
    const set = new Set(dayLog.value.messages.map(m => m.platform))
    return [...set].join(' · ')
})

function platformColor(p) {
    if (p === 'wechat') return 'soft'
    if (p === 'web') return 'purple'
    return 'default'
}

function formatTime(ts) {
    const d = new Date(parseInt(ts))
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function prevDay() {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() - 1)
    currentDate.value = d.toISOString().slice(0, 10)
    loadLog()
}

function nextDay() {
    const d = new Date(currentDate.value)
    d.setDate(d.getDate() + 1)
    const today = new Date().toISOString().slice(0, 10)
    if (d.toISOString().slice(0, 10) > today) return
    currentDate.value = d.toISOString().slice(0, 10)
    loadLog()
}

async function loadLog() {
    try {
        const res = await api(`/api/bus/log/${currentDate.value}?persona=${currentPersona.value}`)
        dayLog.value = await res.json()
    } catch {
        dayLog.value = { date: currentDate.value, messages: [] }
    }
}


function exportDay() {
    const blob = new Blob([JSON.stringify(dayLog.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `log-${currentDate.value}.json`
    a.click()
    URL.revokeObjectURL(url)
}

onMounted(loadPersonas)

</script>

<style scoped>
.logs-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: env(safe-area-inset-top, 44px);
    overflow-x: hidden;
}

.logs-header {
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

.logs-header h2 {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text);
}

/* 日期导航 */
.date-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    padding: 16px 0;
    flex-shrink: 0;
}

.date-arrow {
    background: none;
    border: none;
    font-size: 20px;
    color: var(--color-primary);
    cursor: pointer;
    opacity: 0.6;
    padding: 4px 8px;
}

.date-display {
    font-size: 14px;
    color: var(--color-text);
    font-weight: 400;
    min-width: 60px;
    text-align: center;
}

/* 统计 */
.log-stats {
    display: flex;
    gap: 8px;
    padding: 0 0 12px;
    flex-shrink: 0;
}

/* 消息列表 */
.log-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 20px;
}

.log-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.log-item {
    animation: fadeIn 0.3s var(--ease-soft) backwards;
}

.log-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
}

.log-time {
    font-size: 10px;
    color: var(--color-text-light);
    opacity: 0.5;
}

.log-bubble {
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--color-text);
    max-width: 85%;
}

.log-item.user .log-bubble {
    background: rgba(212, 137, 158, 0.1);
    border: 1px solid rgba(212, 137, 158, 0.08);
    margin-left: auto;
}

.log-item.assistant .log-bubble {
    background: var(--color-card);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid var(--color-border);
}

/* 空状态 */
.empty-state {
    text-align: center;
    padding: 48px 20px;
}

.empty-icon {
    font-size: 28px;
    margin-bottom: 10px;
}

.empty-title {
    font-size: 13px;
    color: var(--color-text-light);
    opacity: 0.5;
}

/* 底部 */
.log-footer {
    padding: 12px 0;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
    flex-shrink: 0;
}

.persona-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 0;
    overflow-x: auto;
    flex-shrink: 0;
}

.tab-item {
    padding: 7px 14px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    font-size: 12px;
    color: var(--color-text-light);
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.3s;
}

.tab-item.active {
    background: linear-gradient(135deg, #e8a8be, #d4899e);
    color: white;
    border-color: transparent;
}
</style>
