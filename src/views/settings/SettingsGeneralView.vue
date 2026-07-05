<template>
    <div class="sub-page">
        <div class="settings-blob sb-tl"></div>
        <div class="settings-blob sb-br"></div>

        <div class="settings-nav">
            <button class="settings-back" @click="$router.push('/settings')">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>
            <span class="settings-title">通用</span>
            <div style="width:36px;"></div>
        </div>

        <div class="sub-content">

            <!-- 语言与地区 -->
            <div class="section-label-sm">语言与地区</div>
            <div class="settings-group">
                <div class="settings-group-item">
                    <div class="sgi-label">界面语言</div>
                    <select class="sgi-select" v-model="appLanguage" @change="save">
                        <option value="zh">中文</option>
                        <option value="en">English</option>
                    </select>
                </div>
                <div class="settings-group-item">
                    <div class="sgi-label">地区</div>
                    <select class="sgi-select" v-model="appRegion" @change="save">
                        <option value="CN">中国大陆</option>
                        <option value="TW">台湾</option>
                        <option value="HK">香港</option>
                        <option value="US">美国</option>
                        <option value="JP">日本</option>
                        <option value="KR">韩国</option>
                    </select>
                </div>
            </div>

            <!-- 时间设置 -->
            <div class="section-label-sm">时间</div>
            <div class="settings-group">
                <div class="settings-group-item">
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">现实时间同步</div>
                        <div class="sgi-desc">让 char 感知现实时间、节假日、你的作息节奏</div>
                    </div>
                    <label class="toggle-sm">
                        <input type="checkbox" v-model="realTimeSync" @change="save" />
                        <span class="slider-sm"></span>
                    </label>
                </div>
                <div v-if="realTimeSync" class="settings-group-item">
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">节假日数据</div>
                        <div class="sgi-desc">{{ holidayStatus }}</div>
                    </div>
                    <button class="refresh-btn" @click="fetchHolidays">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                        同步
                    </button>
                </div>
                <div class="settings-group-item">
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">自定义纪年</div>
                        <div class="sgi-desc">为特定 char 绑定专属时间设定</div>
                    </div>
                    <label class="toggle-sm">
                        <input type="checkbox" v-model="customEraEnabled" @change="save" />
                        <span class="slider-sm"></span>
                    </label>
                </div>
                <div v-if="customEraEnabled" class="settings-group-item col-item">
                    <div class="sgi-label">纪年格式</div>
                    <input class="sgi-input full" v-model="customEraFormat" placeholder="例：星历{year}年{month}月{day}日"
                        @change="save" />
                    <div class="sgi-hint">用 {year} {month} {day} 代替年月日，现实时间会自动填入</div>
                </div>
                <div v-if="customEraEnabled" class="settings-group-item">
                    <div class="sgi-label">绑定角色</div>
                    <select class="sgi-select" v-model="customEraPersona" @change="save">
                        <option value="">全部角色</option>
                        <option v-for="p in personas" :key="p.id" :value="p.id">
                            {{ p.note || p.name }}
                        </option>
                    </select>
                </div>
            </div>

            <!-- 生活感知 -->
            <div class="section-label-sm">生活感知</div>
            <div class="settings-group">
                <div class="settings-group-item">
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">启用生活感知</div>
                        <div class="sgi-desc">通过 iOS 快捷指令上报手机状态</div>
                    </div>
                    <label class="toggle-sm">
                        <input type="checkbox" v-model="lifeAwareEnabled" @change="save" />
                        <span class="slider-sm"></span>
                    </label>
                </div>
                <div v-if="lifeAwareEnabled" class="settings-group-item col-item">
                    <div class="sgi-label">Webhook 地址</div>
                    <div class="webhook-box">
                        <span class="webhook-url">POST {{ webhookUrl }}/api/phone/status</span>
                        <span class="webhook-body">Body: {"type":"sleep","data":"入睡"}</span>
                    </div>
                    <div class="trigger-wrap">
                        <span class="trigger-chip">睡觉时</span>
                        <span class="trigger-chip">起床时</span>
                        <span class="trigger-chip">电量低于20%</span>
                        <span class="trigger-chip">打开某个App</span>
                        <span class="trigger-chip">连接WiFi</span>
                    </div>
                </div>
            </div>

            <!-- 微信同步 -->
            <div class="section-label-sm">微信同步</div>
            <div class="settings-group">
                <div class="settings-group-item col-item">
                    <div class="sgi-label">用户消息</div>
                    <div class="webhook-box">
                        <span class="webhook-url">POST {{ webhookUrl }}/api/sync/wechat/user</span>
                        <span class="webhook-body">Body: {"content":"消息内容"}</span>
                    </div>
                </div>
                <div class="settings-group-item col-item">
                    <div class="sgi-label">AI 回复</div>
                    <div class="webhook-box">
                        <span class="webhook-url">POST {{ webhookUrl }}/api/sync/wechat/ai</span>
                        <span class="webhook-body">Body: {"content":"AI回复内容"}</span>
                    </div>
                </div>
            </div>

            <Transition name="toast-fade">
                <div v-if="showSaved" class="save-toast">已保存 ✓</div>
            </Transition>

        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'

const appLanguage = ref(localStorage.getItem('app_language') || 'zh')
const appRegion = ref(localStorage.getItem('app_region') || 'CN')
const realTimeSync = ref(localStorage.getItem('real_time_sync') === 'true')
const customEraEnabled = ref(localStorage.getItem('custom_era_enabled') === 'true')
const customEraFormat = ref(localStorage.getItem('custom_era_format') || '')
const customEraPersona = ref(localStorage.getItem('custom_era_persona') || '')
const lifeAwareEnabled = ref(localStorage.getItem('life_aware_enabled') === 'true')
const holidayStatus = ref('未同步')
const showSaved = ref(false)
const personas = ref([])
const webhookUrl = ref(import.meta.env.VITE_API_URL || window.location.origin)

function save() {
    localStorage.setItem('app_language', appLanguage.value)
    localStorage.setItem('app_region', appRegion.value)
    localStorage.setItem('real_time_sync', realTimeSync.value)
    localStorage.setItem('custom_era_enabled', customEraEnabled.value)
    localStorage.setItem('custom_era_format', customEraFormat.value)
    localStorage.setItem('custom_era_persona', customEraPersona.value)
    localStorage.setItem('life_aware_enabled', lifeAwareEnabled.value)
    showSaved.value = true
    setTimeout(() => { showSaved.value = false }, 1500)
}

async function fetchHolidays() {
    holidayStatus.value = '同步中...'
    try {
        const year = new Date().getFullYear()
        const res = await fetch(`https://timor.tech/api/holiday/year/${year}`)
        const data = await res.json()
        localStorage.setItem('holiday_data', JSON.stringify(data))
        localStorage.setItem('holiday_year', year.toString())
        holidayStatus.value = `已同步 ${year} 年节假日数据`
    } catch {
        holidayStatus.value = '同步失败，请检查网络'
    }
}

async function loadPersonas() {
    try {
        const res = await api('/api/prompts/personas')
        const data = await res.json()
        personas.value = data.personas || []
    } catch { }
}

onMounted(() => {
    const cached = localStorage.getItem('holiday_year')
    if (cached) holidayStatus.value = `已同步 ${cached} 年数据`
    loadPersonas()
})
</script>

<style scoped>
.sub-page {
    width: 100%;
    height: 100%;
    padding-top: env(safe-area-inset-top, 44px);
    display: flex;
    flex-direction: column;
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

.settings-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px 4px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
}

.settings-back {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.55);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border: 1px solid rgba(255, 240, 242, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(217, 163, 175, 0.1);
}

.settings-back svg {
    width: 16px;
    height: 16px;
    stroke: #D9A3AF;
}

.settings-title {
    font-size: 17px;
    font-weight: 800;
    color: #4A3F41;
}

.sub-content {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 32px);
    position: relative;
    z-index: 1;
}

.sub-content::-webkit-scrollbar {
    display: none;
}

.section-label-sm {
    font-size: 11px;
    font-weight: 700;
    color: #B8A9AC;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    padding: 0 4px 8px;
    margin-top: 20px;
    display: block;
}

.settings-group {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-radius: 22px;
    overflow: hidden;
    margin-bottom: 10px;
    box-shadow: 0 8px 24px rgba(217, 163, 175, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
    border: 1px solid rgba(255, 240, 242, 0.4);
}

.settings-group-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(217, 163, 175, 0.08);
}

.settings-group-item:last-child {
    border-bottom: none;
}

.col-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}

.sgi-label {
    font-size: 14px;
    color: #4A3F41;
    flex-shrink: 0;
}

.sgi-label-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sgi-desc {
    font-size: 11px;
    color: #B8A9AC;
    line-height: 1.4;
}

.sgi-hint {
    font-size: 11px;
    color: #B8A9AC;
    padding: 0 2px;
}

.sgi-select {
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #4A3F41;
    font-family: inherit;
    appearance: none;
    -webkit-appearance: none;
    text-align: right;
}

.sgi-input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: #4A3F41;
    font-family: inherit;
}

.sgi-input.full {
    width: 100%;
}

.sgi-input::placeholder {
    color: #D4C8CA;
}

.toggle-sm {
    position: relative;
    width: 44px;
    height: 26px;
    flex-shrink: 0;
}

.toggle-sm input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider-sm {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(217, 163, 175, 0.2);
    border-radius: 13px;
    transition: 0.28s ease;
}

.slider-sm:before {
    position: absolute;
    content: "";
    height: 22px;
    width: 22px;
    left: 2px;
    bottom: 2px;
    background: white;
    border-radius: 50%;
    transition: 0.28s ease;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

.toggle-sm input:checked+.slider-sm {
    background: linear-gradient(135deg, #E8C0C9, #D9A3AF);
}

.toggle-sm input:checked+.slider-sm:before {
    transform: translateX(18px);
}

.refresh-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(232, 192, 201, 0.12);
    border: 1px solid rgba(232, 192, 201, 0.3);
    border-radius: 12px;
    padding: 6px 12px;
    font-size: 12px;
    color: #D9A3AF;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    flex-shrink: 0;
}

.refresh-btn svg {
    width: 13px;
    height: 13px;
    stroke: #D9A3AF;
}

.webhook-box {
    width: 100%;
    background: rgba(217, 163, 175, 0.06);
    border-radius: 12px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.webhook-url {
    font-size: 11px;
    color: #D9A3AF;
    font-family: monospace;
    word-break: break-all;
}

.webhook-body {
    font-size: 10px;
    color: #B8A9AC;
    font-family: monospace;
}

.trigger-wrap {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    width: 100%;
}

.trigger-chip {
    font-size: 11px;
    color: #6B5B5E;
    font-weight: 500;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(217, 163, 175, 0.2);
    border-radius: 10px;
    padding: 4px 10px;
}

.save-toast {
    text-align: center;
    color: #D9A3AF;
    font-size: 12px;
    padding: 8px 0;
}

.toast-fade-enter-active {
    transition: opacity 0.3s;
}

.toast-fade-leave-active {
    transition: opacity 0.5s;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
    opacity: 0;
}
</style>
