<template>
    <div class="memory-page">
        <div class="memory-header">
            <button class="back-btn" @click="goBack">‹</button>
            <h2>{{ viewTitle }}</h2>
        </div>

        <div class="persona-tabs" v-if="currentView === 'main'">
            <button v-for="p in personas" :key="p.id" class="tab-item" :class="{ active: currentPersona === p.id }"
                @click="switchPersona(p.id)">
                {{ p.name }}
            </button>
        </div>

        <div class="memory-content">
            <template v-if="currentView === 'main'">
                <!-- 总档案 -->
                <div class="section-block">
                    <h3 class="section-label">✧ 被长期保留的印象</h3>
                    <GlassCard size="md">
                        <p class="content-text" v-if="profile">{{ profile }}</p>
                        <p class="content-text empty" v-else>暂无档案</p>
                    </GlassCard>
                </div>

                <!-- 热力图 -->
                <div class="section-block">
                    <h3 class="section-label">◐ 最近留下来的痕迹</h3>
                    <GlassCard size="md">
                        <div class="heatmap">
                            <div v-for="day in heatmapDays" :key="day.date" class="heat-cell"
                                :style="{ opacity: day.intensity }" :title="day.date + ': ' + day.count + '条'"
                                @click="openDate(day.date)">
                            </div>
                        </div>
                    </GlassCard>
                </div>

                <!-- 记忆归档 -->
                <div class="section-block">
                    <h3 class="section-label">◌ 那些被时间保存的东西</h3>
                    <div class="tag-box">
                        <SoftButton v-for="year in Object.keys(dateTree)" :key="year" variant="glass" size="sm"
                            @click="openYear(year)">
                            {{ year }}年
                        </SoftButton>
                        <p v-if="Object.keys(dateTree).length === 0" class="empty-text">暂无归档记忆</p>
                    </div>
                </div>
            </template>

            <!-- 年视图 -->
            <template v-if="currentView === 'year'">
                <div class="tag-box">
                    <SoftButton v-for="month in dateTree[selectedYear]" :key="month" variant="glass" size="sm"
                        @click="openMonth(month)">
                        {{ parseInt(month) }}月
                    </SoftButton>
                </div>
            </template>

            <!-- 月视图 -->
            <template v-if="currentView === 'month'">
                <div class="tag-box">
                    <SoftButton v-for="day in monthDays" :key="day" variant="glass" size="sm"
                        @click="openDate(`${selectedYear}-${selectedMonth}-${day}`)">
                        {{ parseInt(day) }}日
                    </SoftButton>
                </div>
            </template>

            <!-- 日视图 -->
            <template v-if="currentView === 'date'">
                <div v-if="dayMemories.length > 0">
                    <GlassCard v-for="mem in dayMemories" :key="mem.id" size="sm">
                        <p class="content-text">{{ mem.content }}</p>
                    </GlassCard>
                </div>
                <p v-else class="empty-text">这天没有记忆</p>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/utils/api'
import GlassCard from '@/components/ui/GlassCard.vue'
import SoftButton from '@/components/ui/SoftButton.vue'

const personas = ref([])
const currentPersona = ref('')
const profile = ref('')
const heatmapData = ref({})
const dateTree = ref({})
const dayMemories = ref([])

const currentView = ref('main')
const selectedYear = ref('')
const selectedMonth = ref('')
const selectedDate = ref('')

const viewTitle = computed(() => {
    if (currentView.value === 'main') return '记忆库'
    if (currentView.value === 'year') return `${selectedYear.value}年`
    if (currentView.value === 'month') return `${selectedYear.value}年${parseInt(selectedMonth.value)}月`
    if (currentView.value === 'date') return selectedDate.value
    return '记忆库'
})

const heatmapDays = computed(() => {
    const days = []
    const now = new Date()
    for (let i = 59; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().slice(0, 10)
        const count = heatmapData.value[dateStr] || 0
        const intensity = count === 0 ? 0.08 : Math.min(1, 0.2 + count * 0.05)
        days.push({ date: dateStr, count, intensity })
    }
    return days
})

const monthDays = computed(() => {
    if (!selectedYear.value || !selectedMonth.value) return []
    const prefix = `${selectedYear.value}-${selectedMonth.value}`
    const days = new Set()
    Object.keys(heatmapData.value).forEach((d) => {
        if (d.startsWith(prefix)) {
            days.add(d.slice(8, 10))
        }
    })
    return [...days].sort()
})

async function loadPersonas() {
    try {
        const res = await api('/api/prompts/personas')
        const data = await res.json()
        personas.value = data.personas.map(p => ({ id: p.id, name: p.name }))
        if (personas.value.length > 0) {
            currentPersona.value = data.active || personas.value[0].id
            await loadAll()
        }
    } catch (e) {
        console.error('加载失败:', e)
    }
}

async function loadAll() {
    await Promise.all([loadProfile(), loadHeatmap(), loadDateTree()])
}

async function loadProfile() {
    try {
        const res = await api(`/api/memories/${currentPersona.value}`)
        const data = await res.json()
        profile.value = data.profile || ''
    } catch { }
}

async function loadHeatmap() {
    try {
        const res = await api(`/api/memories/${currentPersona.value}/heatmap`)
        heatmapData.value = await res.json()
    } catch { }
}

async function loadDateTree() {
    try {
        const res = await api(`/api/memories/${currentPersona.value}/dates`)
        dateTree.value = await res.json()
    } catch { }
}

function switchPersona(id) {
    currentPersona.value = id
    currentView.value = 'main'
    loadAll()
}

function openYear(year) {
    selectedYear.value = year
    currentView.value = 'year'
}

function openMonth(month) {
    selectedMonth.value = month
    currentView.value = 'month'
}

async function openDate(date) {
    selectedDate.value = date
    const [year, month] = date.split('-')
    selectedYear.value = year
    selectedMonth.value = month
    currentView.value = 'date'
    try {
        const res = await api(`/api/memories/${currentPersona.value}/date/${date}`)
        dayMemories.value = await res.json()
    } catch {
        dayMemories.value = []
    }
}

function goBack() {
    if (currentView.value === 'date') currentView.value = 'month'
    else if (currentView.value === 'month') currentView.value = 'year'
    else if (currentView.value === 'year') currentView.value = 'main'
    else window.history.length > 1 ? history.back() : location.href = '/'
}

onMounted(loadPersonas)
</script>

<style scoped>
.memory-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: env(safe-area-inset-top, 44px);
}

.memory-header {
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

.memory-header h2 {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text);
}

.persona-tabs {
    display: flex;
    gap: 8px;
    padding: 14px 0;
    overflow-x: auto;
    flex-shrink: 0;
}

.tab-item {
    padding: 7px 16px;
    border-radius: 20px;
    border: 1px solid var(--color-border);
    background: var(--color-card);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    font-size: 12px;
    color: var(--color-text-light);
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--duration-normal) var(--ease-soft);
}

.tab-item.active {
    background: linear-gradient(135deg, #e8a8be, #d4899e);
    color: white;
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(212, 137, 158, 0.2);
}

.memory-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
}

.section-block {
    margin-bottom: 24px;
    animation: fadeIn 0.4s var(--ease-soft) backwards;
}

.section-block:nth-child(2) {
    animation-delay: 0.06s;
}

.section-block:nth-child(3) {
    animation-delay: 0.12s;
}

.section-label {
    font-size: 12px;
    color: var(--color-text-light);
    margin-bottom: 10px;
    font-weight: 400;
    letter-spacing: 0.5px;
}

.content-text {
    font-size: 13px;
    color: var(--color-text);
    line-height: 1.7;
    white-space: pre-line;
}

.content-text.empty {
    color: var(--color-text-light);
    font-style: italic;
    opacity: 0.6;
}

.heatmap {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
}

.heat-cell {
    aspect-ratio: 1;
    border-radius: 4px;
    background: var(--color-primary);
    cursor: pointer;
    transition: transform 0.15s var(--ease-soft);
}

.heat-cell:active {
    transform: scale(1.4);
}

.tag-box {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.empty-text {
    color: var(--color-text-light);
    font-size: 13px;
    opacity: 0.6;
}
</style>
