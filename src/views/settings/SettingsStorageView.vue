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
            <span class="settings-title">存储空间</span>
            <div style="width:36px;"></div>
        </div>

        <div class="sub-content">

            <!-- 数据管理 -->
            <div class="section-label-sm">数据管理</div>
            <div class="settings-group">
                <div class="settings-group-item action-item" @click="exportData">
                    <div class="sgi-icon-wrap" style="background: linear-gradient(135deg, #98CBEA, #70b0d8);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </div>
                    <div class="sgi-label">导出数据</div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        class="sgi-arrow">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>

                <div class="settings-group-item action-item" @click="triggerImport">
                    <div class="sgi-icon-wrap" style="background: linear-gradient(135deg, #D8CDEA, #b8a8d8);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <div class="sgi-label">导入数据</div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        class="sgi-arrow">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
                <input type="file" ref="importInput" accept=".json" style="display:none" @change="importData" />
            </div>

            <!-- 云端同步 -->
            <div class="section-label-sm">云端</div>
            <div class="settings-group">
                <div class="settings-group-item action-item" @click="syncToCloud">
                    <div class="sgi-icon-wrap" style="background: linear-gradient(135deg, #7ed6a0, #5bc280);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                            <polyline points="16 16 12 12 8 16" />
                            <line x1="12" y1="12" x2="12" y2="21" />
                            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                        </svg>
                    </div>
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">上传至云端</div>
                        <div class="sgi-desc">数据已存储在 Supabase</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        class="sgi-arrow">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>

                <div class="settings-group-item action-item" @click="forceSync">
                    <div class="sgi-icon-wrap" style="background: linear-gradient(135deg, #F5EAD0, #e8d5a8);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                    </div>
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">强制同步</div>
                        <div class="sgi-desc">清除缓存并重新加载</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        class="sgi-arrow">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>

            <!-- 恢复 -->
            <div class="section-label-sm">恢复</div>
            <div class="settings-group">
                <div class="settings-group-item action-item" @click="restoreBuiltinPersonas">
                    <div class="sgi-icon-wrap" style="background: linear-gradient(135deg, #E8C0C9, #d4899e);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                            <path d="M3 3v5h5" />
                        </svg>
                    </div>
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">恢复内置人格</div>
                        <div class="sgi-desc">恢复被隐藏的系统内置角色</div>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        class="sgi-arrow">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>

            <!-- 结果提示 -->
            <Transition name="toast-fade">
                <div v-if="resultMsg" class="result-bar" :class="resultSuccess ? 'success' : 'error'">
                    {{ resultMsg }}
                </div>
            </Transition>

        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '@/utils/api'

const importInput = ref(null)
const resultMsg = ref('')
const resultSuccess = ref(true)

function showResult(msg, success = true) {
    resultMsg.value = msg
    resultSuccess.value = success
    setTimeout(() => { resultMsg.value = '' }, 3000)
}

async function exportData() {
    try {
        const res = await api('/api/export')
        const serverData = await res.json()
        const localData = {
            custom_wallpaper: localStorage.getItem('custom_wallpaper') || '',
            wallpaper_scope: localStorage.getItem('wallpaper_scope') || 'home',
            custom_font_url: localStorage.getItem('custom_font_url') || '',
            custom_font_name: localStorage.getItem('custom_font_name') || '',
            custom_app_icons: localStorage.getItem('custom_app_icons') || '{}',
            chat_entry_mode: localStorage.getItem('chat_entry_mode') || 'direct',
            theme_mode: localStorage.getItem('theme_mode') || 'auto',
            api_config: localStorage.getItem('api_config') || '{}',
            api_configs: localStorage.getItem('api_configs') || '[]',
            sub_api_config: localStorage.getItem('sub_api_config') || '{}',
            sub_api_configs: localStorage.getItem('sub_api_configs') || '[]',
            output_prefs: localStorage.getItem('output_prefs') || '{}',
            word_cards: localStorage.getItem('word_cards') || '[]',
            together_start_date: localStorage.getItem('together_start_date') || '',
            home_bubble_left: localStorage.getItem('home_bubble_left') || '',
            home_bubble_right: localStorage.getItem('home_bubble_right') || '',
            home_user_avatar: localStorage.getItem('home_user_avatar') || '',
            pinned_personas: localStorage.getItem('pinned_personas') || '[]',
            user_name: localStorage.getItem('user_name') || '',
            user_phone: localStorage.getItem('user_phone') || '',
            user_masks: localStorage.getItem('user_masks') || '[]',
            calendar_data: localStorage.getItem('calendar_data') || '{}',
            period_data: localStorage.getItem('period_data') || '[]',
        }
        const blob = new Blob([JSON.stringify({ ...serverData, localSettings: localData }, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `melt-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        showResult('导出成功 ✓')
    } catch (e) {
        showResult('导出失败: ' + e.message, false)
    }
}

function triggerImport() { importInput.value?.click() }

async function importData(event) {
    const file = event.target.files[0]
    if (!file) return
    try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.localSettings) {
            Object.entries(data.localSettings).forEach(([key, value]) => {
                if (value) localStorage.setItem(key, value)
            })
        }
        const serverData = { ...data }
        delete serverData.localSettings
        await api('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serverData)
        })
        showResult('导入成功，刷新页面生效 ✓')
    } catch (e) {
        showResult('导入失败: ' + e.message, false)
    }
}

function syncToCloud() {
    showResult('数据已在云端（Supabase），无需额外同步 ✓')
}

async function forceSync() {
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('melt_cache_')) localStorage.removeItem(key)
    })
    showResult('缓存已清除，即将刷新...')
    setTimeout(() => { location.reload() }, 1500)
}

async function restoreBuiltinPersonas() {
    try {
        const builtinIds = ['xiaorou', 'cool', 'assistant']
        for (const id of builtinIds) {
            await api(`/api/personas/builtin/${id}/restore`, { method: 'POST' })
        }
        localStorage.removeItem('hidden_personas')
        showResult('已恢复所有内置人格 ✓')
    } catch (e) {
        showResult('恢复失败: ' + e.message, false)
    }
}
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
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border: 1px solid rgba(255, 240, 242, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(217, 163, 175, 0.08);
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
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(217, 163, 175, 0.08);
}

.settings-group-item:last-child {
    border-bottom: none;
}

.action-item {
    cursor: pointer;
    transition: background 0.15s;
}

.action-item:active {
    background: rgba(217, 163, 175, 0.06);
}

.sgi-icon-wrap {
    width: 32px;
    height: 32px;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.sgi-icon-wrap svg {
    width: 16px;
    height: 16px;
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
}

.sgi-arrow {
    width: 14px;
    height: 14px;
    stroke: #D4C8CA;
    flex-shrink: 0;
}

.result-bar {
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 12px;
    margin-top: 8px;
}

.result-bar.success {
    color: #6BAF7A;
    background: rgba(107, 175, 122, 0.1);
}

.result-bar.error {
    color: #C07070;
    background: rgba(192, 112, 112, 0.1);
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
