<template>
    <div class="relationship-page">
        <div class="relationship-header">
            <button class="back-btn" @click="$router.push('/')">‹</button>
            <h2>关系</h2>
        </div>

        <div class="persona-tabs">
            <button v-for="p in personas" :key="p.id" class="tab-btn" :class="{ active: currentPersona === p.id }"
                @click="switchPersona(p.id)">
                {{ p.name }}
            </button>
        </div>

        <div class="radar-container">
            <svg viewBox="0 0 300 300" class="radar-chart">
                <!-- 背景网格 -->
                <polygon v-for="i in 4" :key="'grid-' + i" :points="getGridPoints(i * 25)" fill="none"
                    stroke="var(--color-bg-secondary)" stroke-width="1" />
                <!-- 轴线 -->
                <line v-for="(_, idx) in 5" :key="'axis-' + idx" x1="150" y1="150" :x2="getPoint(idx, 100).x"
                    :y2="getPoint(idx, 100).y" stroke="var(--color-bg-secondary)" stroke-width="1" />
                <!-- 数据区域 -->
                <polygon :points="dataPoints" fill="rgba(232, 160, 191, 0.2)" stroke="var(--color-primary)"
                    stroke-width="2" />
                <!-- 数据点 -->
                <circle v-for="(dim, idx) in dimensions" :key="'dot-' + idx" :cx="getPoint(idx, dim.progress * 100).x"
                    :cy="getPoint(idx, dim.progress * 100).y" r="4" fill="var(--color-primary)" />
                <!-- 标签 -->
                <text v-for="(dim, idx) in dimensions" :key="'label-' + idx" :x="getPoint(idx, 115).x"
                    :y="getPoint(idx, 115).y" text-anchor="middle" dominant-baseline="middle" font-size="11"
                    fill="var(--color-text)">
                    {{ dim.name }}
                </text>
            </svg>
        </div>

        <div class="dimension-list">
            <div v-for="dim in dimensions" :key="dim.dimension" class="dimension-item">
                <div class="dim-header">
                    <span class="dim-name">{{ dim.name }}</span>
                    <span class="dim-level">{{ dim.level }}</span>
                </div>
                <div class="dim-bar">
                    <div class="dim-fill" :style="{ width: (dim.progress * 100) + '%' }"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '@/utils/api'

const personas = ref([
    { id: 'xiaorou', name: '小柔' },
    { id: 'cool', name: '阿冷' },
    { id: 'assistant', name: '助手' }
])

const currentPersona = ref('xiaorou')
const dimensions = ref([])

async function loadDimensions(personaId) {
    try {
        const res = await api(`/api/relationship/${personaId}`)
        dimensions.value = await res.json()
    } catch (e) {
        console.error('加载关系维度失败:', e)
    }
}

function switchPersona(id) {
    currentPersona.value = id
    loadDimensions(id)
}

function getPoint(index, radius) {
    const angle = (Math.PI * 2 * index) / 5 - Math.PI / 2;
    return {
        x: 150 + radius * Math.cos(angle),
        y: 150 + radius * Math.sin(angle),
    };
}

function getGridPoints(radius) {
    return Array.from({ length: 5 }, (_, i) => {
        const p = getPoint(i, radius);
        return `${p.x},${p.y}`;
    }).join(" ");
}

const dataPoints = computed(() => {
    if (dimensions.value.length === 0) return "";
    return dimensions.value
        .map((dim, idx) => {
            const p = getPoint(idx, dim.progress * 100);
            return `${p.x},${p.y}`;
        })
        .join(" ");
})

onMounted(() => loadDimensions(currentPersona.value))
</script>

<style scoped>
.relationship-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: env(safe-area-inset-top, 44px);
}

.relationship-header {
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

.relationship-header h2 {
    font-size: 17px;
    font-weight: 600;
    color: var(--color-text);
}

.persona-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 0;
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

.radar-container {
    display: flex;
    justify-content: center;
    padding: 20px 0;
}

.radar-chart {
    width: 220px;
    height: 220px;
}

.dimension-list {
    flex: 1;
    overflow-y: auto;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
}

.dimension-item {
    padding: 12px 0;
    border-bottom: 1px solid var(--color-bg-secondary);
}

.dim-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 6px;
}

.dim-name {
    font-size: 14px;
    color: var(--color-text);
    font-weight: 500;
}

.dim-level {
    font-size: 12px;
    color: var(--color-primary);
    font-weight: 500;
}

.dim-bar {
    height: 4px;
    background: var(--color-bg-secondary);
    border-radius: 2px;
    overflow: hidden;
}

.dim-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
    border-radius: 2px;
    transition: width 0.5s ease;
}
</style>
