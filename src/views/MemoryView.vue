<template>
    <div class="memory-page">
        <div class="memory-header">
            <button class="back-btn" @click="goBack">‹</button>
            <h2>{{ viewTitle }}</h2>
        </div>

        <div class="persona-tabs" v-if="currentView === 'main'">
            <button v-for="p in personas" :key="p.id" class="tab-btn" :class="{ active: currentPersona === p.id }"
                @click="switchPersona(p.id)">
                {{ p.name }}
            </button>
        </div>

        <div class="memory-content">
            <!-- 主视图 -->
            <template v-if="currentView === 'main'">
                <!-- 总档案 -->
                <div class="section">
                    <h3>📋 总档案</h3>
                    <div class="profile-box">
                        <p v-if="profile">{{ profile }}</p>
                        <p v-else class="empty">暂无档案</p>
                    </div>
                </div>

                <!-- 热力图 -->
                <div class="section">
                    <h3>📊 最近两个月</h3>
                    <div class="heatmap">
                        <div v-for="day in heatmapDays" :key="day.date" class="heat-cell"
                            :style="{ opacity: day.intensity }" :title="day.date + ': ' + day.count + '条'"
                            @click="openDate(day.date)">
                        </div>
                    </div>
                </div>

                <!-- 年份标签 -->
                <div class="section">
                    <h3>🗂️ 记忆归档</h3>
                    <div class="tag-box">
                        <button v-for="year in Object.keys(dateTree)" :key="year" class="tag-btn"
                            @click="openYear(year)">
                            {{ year }}年
                        </button>
                        <p v-if="Object.keys(dateTree).length === 0" class="empty">暂无归档记忆</p>
                    </div>
                </div>
            </template>

            <!-- 年视图 -->
            <template v-if="currentView === 'year'">
                <div class="tag-box">
                    <button v-for="month in dateTree[selectedYear]" :key="month" class="tag-btn"
                        @click="openMonth(month)">
                        {{ parseInt(month) }}月
                    </button>
                </div>
            </template>

            <!-- 月视图 -->
            <template v-if="currentView === 'month'">
                <div class="tag-box">
                    <button v-for="day in monthDays" :key="day" class="tag-btn"
                        @click="openDate(`${selectedYear}-${selectedMonth}-${day}`)">
                        {{ parseInt(day) }}日
                    </button>
                </div>
            </template>

            <!-- 日视图 -->
            <template v-if="currentView === 'date'">
                <div v-if="dayMemories.length > 0">
                    <div v-for="mem in dayMemories" :key="mem.id" class="memory-item">
                        <div class="memory-text">{{ mem.content }}</div>
                    </div>
                </div>
                <p v-else class="empty">这天没有记忆</p>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/utils/api'

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
        const intensity = count === 0 ? 0.1 : Math.min(1, 0.2 + count * 0.05)
        days.push({ date: dateStr, count, intensity })
    }
    return days
})

const monthDays = computed(() => {
    if (!selectedYear.value || !selectedMonth.value) return []
    // 获取该月有记忆的日期
    const prefix = `${selectedYear.value}-${selectedMonth.value}`
    const days = new Set()
    Object.keys(heatmapData.value).forEach((d) => {
        if (d.startsWith(prefix)) {
            days.add(d.slice(8, 10))
        }
    })
    // 也从 dateTree 的记忆数据里补充
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
    await Promise.all([
        loadProfile(),
        loadHeatmap(),
        loadDateTree()
    ])
}

async function loadProfile() {
    try {
        const res = await api(`/api/memories/${currentPersona.value}`)
        const data = await res.json()
        profile.value = data.profile || ''
    } catch (e) { }
}

async function loadHeatmap() {
    try {
        const res = await api(`/api/memories/${currentPersona.value}/heatmap`)
        heatmapData.value = await res.json()
    } catch (e) { }
}

async function loadDateTree() {
    try {
        const res = await api(`/api/memories/${currentPersona.value}/dates`)
        dateTree.value = await res.json()
    } catch (e) { }
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
    } catch (e) {
        dayMemories.value = []
    }
}

function goBack() {
    if (currentView.value === 'date') {
        currentView.value = 'month'
    } else if (currentView.value === 'month') {
        currentView.value = 'year'
    } else if (currentView.value === 'year') {
        currentView.value = 'main'
    } else {
        window.history.length > 1 ? history.back() : location.href = '/'
    }
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
    padding: 8px 0;
    border-bottom: 1px solid var(--color-bg-secondary);
}

.back-btn {
    background: none;
    border: none;
    font-size: 28px;
    color: var(--color-primary);
    cursor: pointer;
    padding: 0 4px;
}

.memory-header h2 {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
}

.persona-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 0;
    flex-wrap: wrap;
}

.tab-btn {
    padding: 6px 16px;
    border-radius: 20px;
    border: 1px solid var(--color-bg-secondary);
    background: var(--color-white);
    font-size: 13px;
    color: var(--color-text);
    cursor: pointer;
}

.tab-btn.active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

.memory-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
}

.section {
    margin-bottom: 24px;
}

.section h3 {
    font-size: 14px;
    color: var(--color-text);
    margin-bottom: 10px;
    font-weight: 500;
}

.profile-box {
    background: var(--color-white);
    border-radius: 12px;
    padding: 14px;
    font-size: 14px;
    color: var(--color-text);
    line-height: 1.6;
    white-space: pre-line;
}

/* 热力图 */
.heatmap {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
}

.heat-cell {
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--color-primary);
    cursor: pointer;
    transition: transform 0.1s;
}

.heat-cell:active {
    transform: scale(1.3);
}

/* 标签盒子 */
.tag-box {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.tag-btn {
    padding: 10px 20px;
    border-radius: 12px;
    border: 1px solid var(--color-bg-secondary);
    background: var(--color-white);
    font-size: 14px;
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.15s;
}

.tag-btn:active {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

/* 记忆条目 */
.memory-item {
    background: var(--color-white);
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 8px;
}

.memory-text {
    font-size: 14px;
    color: var(--color-text);
    line-height: 1.5;
    white-space: pre-line;
}

.empty {
    color: var(--color-text-light);
    font-size: 13px;
}
</style>
