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
            <span class="settings-title">锁屏密码</span>
            <div style="width:36px;"></div>
        </div>

        <div class="sub-content">

            <!-- 锁屏开关 -->
            <div class="section-label-sm">锁屏保护</div>
            <div class="settings-group">
                <div class="settings-group-item">
                    <div class="sgi-label-wrap">
                        <div class="sgi-label">启用锁屏</div>
                        <div class="sgi-desc">启动 App 时需要输入密码</div>
                    </div>
                    <label class="toggle-sm">
                        <input type="checkbox" v-model="lockEnabled" @change="onToggleLock" />
                        <span class="slider-sm"></span>
                    </label>
                </div>
                <div v-if="lockEnabled" class="settings-group-item action-item" @click="showChangeModal = true">
                    <div class="sgi-label">修改密码</div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        class="sgi-arrow">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            </div>

            <!-- 说明 -->
            <div class="section-label-sm">说明</div>
            <div class="settings-group">
                <div class="settings-group-item col-item">
                    <div class="sgi-label">兜底密码</div>
                    <div class="sgi-desc">如果忘记密码，输入 <span class="code-hint">0000</span> 可以解锁并重置</div>
                </div>
                <div class="settings-group-item col-item">
                    <div class="sgi-label">密码格式</div>
                    <div class="sgi-desc">4 位数字密码，简单安全</div>
                </div>
            </div>

        </div>

        <!-- 设置初始密码弹窗 -->
        <div v-if="showSetModal" class="pin-modal-overlay">
            <div class="pin-modal">
                <div class="pin-modal-title">设置锁屏密码</div>
                <div class="pin-modal-desc">{{ pinStep === 1 ? '请输入新密码' : '再次输入确认' }}</div>
                <div class="pin-dots">
                    <div v-for="i in 4" :key="i" class="pin-dot" :class="{ filled: pinInput.length >= i }"></div>
                </div>
                <div v-if="pinError" class="pin-error">{{ pinError }}</div>
                <div class="pin-keyboard">
                    <button v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫']" :key="n" class="pin-key"
                        :class="{ 'pin-key-empty': n === '', 'pin-key-del': n === '⌫' }" @click="onPinKey(n)">
                        {{ n }}
                    </button>
                </div>
                <button class="pin-cancel" @click="cancelSet">取消</button>
            </div>
        </div>

        <!-- 修改密码弹窗 -->
        <div v-if="showChangeModal" class="pin-modal-overlay">
            <div class="pin-modal">
                <div class="pin-modal-title">修改密码</div>
                <div class="pin-modal-desc">{{ changeStep === 0 ? '输入当前密码' : changeStep === 1 ? '输入新密码' : '再次确认新密码' }}
                </div>
                <div class="pin-dots">
                    <div v-for="i in 4" :key="i" class="pin-dot" :class="{ filled: pinInput.length >= i }"></div>
                </div>
                <div v-if="pinError" class="pin-error">{{ pinError }}</div>
                <div class="pin-keyboard">
                    <button v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫']" :key="n" class="pin-key"
                        :class="{ 'pin-key-empty': n === '', 'pin-key-del': n === '⌫' }" @click="onChangeKey(n)">
                        {{ n }}
                    </button>
                </div>
                <button class="pin-cancel" @click="cancelChange">取消</button>
            </div>
        </div>

    </div>
</template>

<script setup>
import { ref } from 'vue'

const FALLBACK = '0000'

const lockEnabled = ref(localStorage.getItem('lock_enabled') === 'true')
const showSetModal = ref(false)
const showChangeModal = ref(false)
const pinInput = ref('')
const pinStep = ref(1)
const pinFirst = ref('')
const pinError = ref('')
const changeStep = ref(0)
const changeFirst = ref('')

function onToggleLock() {
    if (lockEnabled.value) {
        // 开启时先设置密码
        pinInput.value = ''
        pinStep.value = 1
        pinFirst.value = ''
        pinError.value = ''
        showSetModal.value = true
        lockEnabled.value = false // 等设置完才真正开启
    } else {
        localStorage.setItem('lock_enabled', 'false')
        localStorage.removeItem('lock_pin')
    }
}

function onPinKey(n) {
    if (n === '') return
    if (n === '⌫') {
        pinInput.value = pinInput.value.slice(0, -1)
        pinError.value = ''
        return
    }
    if (pinInput.value.length >= 4) return
    pinInput.value += String(n)

    if (pinInput.value.length === 4) {
        if (pinStep.value === 1) {
            pinFirst.value = pinInput.value
            pinInput.value = ''
            pinStep.value = 2
        } else {
            if (pinInput.value === pinFirst.value) {
                localStorage.setItem('lock_pin', pinFirst.value)
                localStorage.setItem('lock_enabled', 'true')
                lockEnabled.value = true
                showSetModal.value = false
                pinInput.value = ''
            } else {
                pinError.value = '两次密码不一致，请重新输入'
                pinInput.value = ''
                pinStep.value = 1
                pinFirst.value = ''
            }
        }
    }
}

function cancelSet() {
    showSetModal.value = false
    lockEnabled.value = false
    pinInput.value = ''
    pinError.value = ''
}

function onChangeKey(n) {
    if (n === '') return
    if (n === '⌫') {
        pinInput.value = pinInput.value.slice(0, -1)
        pinError.value = ''
        return
    }
    if (pinInput.value.length >= 4) return
    pinInput.value += String(n)

    if (pinInput.value.length === 4) {
        if (changeStep.value === 0) {
            const stored = localStorage.getItem('lock_pin') || FALLBACK
            if (pinInput.value === stored || pinInput.value === FALLBACK) {
                changeStep.value = 1
                pinInput.value = ''
            } else {
                pinError.value = '密码错误'
                pinInput.value = ''
            }
        } else if (changeStep.value === 1) {
            changeFirst.value = pinInput.value
            changeStep.value = 2
            pinInput.value = ''
        } else {
            if (pinInput.value === changeFirst.value) {
                localStorage.setItem('lock_pin', changeFirst.value)
                showChangeModal.value = false
                pinInput.value = ''
                changeStep.value = 0
            } else {
                pinError.value = '两次密码不一致'
                pinInput.value = ''
                changeStep.value = 1
                changeFirst.value = ''
            }
        }
    }
}

function cancelChange() {
    showChangeModal.value = false
    pinInput.value = ''
    pinError.value = ''
    changeStep.value = 0
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
    justify-content: space-between;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(217, 163, 175, 0.08);
    position: relative;
}

.settings-group-item:last-child {
    border-bottom: none;
}

.col-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
}

.action-item {
    cursor: pointer;
}

.action-item:active {
    background: rgba(217, 163, 175, 0.06);
}

.sgi-label {
    font-size: 14px;
    color: #4A3F41;
}

.sgi-label-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.sgi-desc {
    font-size: 12px;
    color: #B8A9AC;
    line-height: 1.5;
}

.sgi-arrow {
    width: 14px;
    height: 14px;
    stroke: #D4C8CA;
}

.code-hint {
    font-family: monospace;
    font-size: 13px;
    font-weight: 700;
    color: #D9A3AF;
    background: rgba(232, 192, 201, 0.15);
    padding: 1px 6px;
    border-radius: 6px;
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

/* 密码键盘弹窗 */
.pin-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(255, 248, 250, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    display: flex;
    align-items: center;
    justify-content: center;
}

.pin-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 24px 24px;
    width: 100%;
    max-width: 320px;
}

.pin-modal-title {
    font-size: 20px;
    font-weight: 800;
    color: #4A3F41;
    margin-bottom: 6px;
}

.pin-modal-desc {
    font-size: 13px;
    color: #B8A9AC;
    margin-bottom: 32px;
}

.pin-dots {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
}

.pin-dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(217, 163, 175, 0.4);
    transition: all 0.15s ease;
}

.pin-dot.filled {
    background: linear-gradient(135deg, #E8C0C9, #D9A3AF);
    border-color: transparent;
    box-shadow: 0 2px 8px rgba(217, 163, 175, 0.35);
}

.pin-error {
    font-size: 12px;
    color: #C07070;
    margin-bottom: 8px;
    text-align: center;
}

.pin-keyboard {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    width: 100%;
    margin-top: 20px;
}

.pin-key {
    height: 64px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 240, 242, 0.5);
    font-size: 22px;
    font-weight: 600;
    color: #4A3F41;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(217, 163, 175, 0.08);
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pin-key:active {
    transform: scale(0.94);
    background: rgba(232, 192, 201, 0.15);
}

.pin-key-empty {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
    pointer-events: none;
}

.pin-key-del {
    font-size: 18px;
    color: #B8A9AC;
}

.pin-cancel {
    margin-top: 20px;
    background: none;
    border: none;
    font-size: 14px;
    color: #B8A9AC;
    cursor: pointer;
    font-family: inherit;
    padding: 8px 16px;
}
</style>
