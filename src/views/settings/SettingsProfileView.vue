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
            <span class="settings-title">个人信息</span>
            <button class="settings-save-btn" @click="save">保存</button>
        </div>

        <div class="sub-content">

            <!-- 头像区 -->
            <div class="profile-hero">
                <div class="profile-avatar-large" @click="triggerAvatarUpload">
                    <img v-if="profileAvatar && (profileAvatar.startsWith('http') || profileAvatar.startsWith('data'))"
                        :src="profileAvatar" />
                    <span v-else>{{ profileAvatar || '🌙' }}</span>
                    <div class="avatar-edit-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round">
                            <path
                                d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </div>
                </div>
                <input type="file" ref="avatarInput" accept="image/*" style="display:none"
                    @change="handleAvatarUpload" />
                <p class="profile-name-display">{{ profileName || '未设置名称' }}</p>
                <p class="profile-phone-display">{{ profilePhone || '✧ 未设置' }}</p>
            </div>

            <Transition name="toast-fade">
                <div v-if="showSaved" class="save-toast">已保存 ✓</div>
            </Transition>

            <!-- 基本信息 -->
            <div class="section-label-sm">基本信息</div>
            <div class="settings-group">
                <div class="settings-group-item">
                    <div class="sgi-label">名称</div>
                    <input class="sgi-input" v-model="profileName" placeholder="对外展示的名字" />
                </div>
                <div class="settings-group-item">
                    <div class="sgi-label">昵称</div>
                    <input class="sgi-input" v-model="profileNickname" placeholder="char 叫你的称呼" />
                </div>
                <div class="settings-group-item">
                    <div class="sgi-label">性别</div>
                    <div class="sgi-right">
                        <span class="sgi-value">{{ profileGender || '不设置' }}</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" class="sgi-arrow">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </div>
                    <select class="sgi-select-hidden" v-model="profileGender">
                        <option value="">不设置</option>
                        <option value="女">女</option>
                        <option value="男">男</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                <div class="settings-group-item">
                    <div class="sgi-label">专属号码</div>
                    <input class="sgi-input" v-model="profilePhone" placeholder="✧ 1314-520" />
                </div>
                <div class="settings-group-item">
                    <div class="sgi-label">头像 URL</div>
                    <input class="sgi-input" v-model="profileAvatarUrl" placeholder="https://..." />
                </div>
            </div>

            <!-- 角色设定 -->
            <div class="section-label-sm">角色设定</div>
            <div class="settings-group">
                <div class="settings-group-item">
                    <div class="sgi-label">身份</div>
                    <input class="sgi-input" v-model="profileIdentity" placeholder="例：大学生、设计师" />
                </div>
                <div class="settings-group-item col-item">
                    <div class="sgi-label">基础信息</div>
                    <textarea class="sgi-textarea" v-model="profileBio" placeholder="年龄、性格、爱好等基本描述..."
                        rows="3"></textarea>
                </div>
                <div class="settings-group-item col-item">
                    <div class="sgi-label">背景设定</div>
                    <textarea class="sgi-textarea" v-model="profileBackground" placeholder="角色的故事背景、世界观设定..."
                        rows="4"></textarea>
                </div>
                <div class="settings-group-item col-item">
                    <div class="sgi-label">与 char 的关系</div>
                    <textarea class="sgi-textarea" v-model="profileRelation" placeholder="你和 char 之间的关系设定..."
                        rows="3"></textarea>
                </div>
            </div>

            <!-- 人格面具 -->
            <div class="section-label-row">
                <span class="section-label-sm" style="margin:0;">人格面具</span>
                <div class="mask-header-btns">
                    <button class="save-as-mask-btn" @click="saveCurrentAsMask">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                        保存当前为面具
                    </button>
                    <button class="add-mask-btn" @click="addMask">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8M8 12h8" />
                        </svg>
                        新建
                    </button>
                </div>
            </div>
            <div class="settings-group">
                <div v-if="masks.length === 0" class="mask-empty">
                    还没有人格面具，点击新建或保存当前身份
                </div>
                <div v-for="(mask, idx) in masks" :key="mask.id" class="settings-group-item mask-item"
                    :class="{ 'mask-active': activeMaskId === mask.id }" @click="switchMask(mask)">
                    <div class="mask-avatar">{{ mask.avatar || '🎭' }}</div>
                    <div class="mask-info">
                        <div class="mask-name">{{ mask.name }}</div>
                        <div class="mask-desc">{{ mask.nickname ? `「${mask.nickname}」` : '' }} {{ mask.identity ||
                            mask.desc || '' }}</div>
                    </div>
                    <div class="mask-actions">
                        <span v-if="activeMaskId === mask.id" class="mask-active-badge">当前</span>
                        <button class="mask-edit-btn" @click.stop="editMask(idx)">编辑</button>
                        <button class="mask-del-btn" @click.stop="deleteMask(idx)">×</button>
                    </div>
                </div>
            </div>

            <!-- 其他 -->
            <div class="section-label-sm">其他</div>
            <div class="settings-group">
                <div class="settings-group-item danger-item" @click="clearProfile">
                    <div class="danger-label">清除个人信息</div>
                </div>
            </div>

        </div>

        <!-- 新建/编辑面具弹窗 -->
        <div v-if="showMaskModal" class="mask-modal-overlay" @click.self="showMaskModal = false">
            <div class="mask-modal">
                <div class="mask-modal-header">
                    <span>{{ editingMaskIdx >= 0 ? '编辑面具' : '新建面具' }}</span>
                    <button @click="showMaskModal = false">×</button>
                </div>
                <div class="mask-modal-body">
                    <div class="mask-field">
                        <label>名称</label>
                        <input v-model="maskForm.name" placeholder="这个身份叫什么" />
                    </div>
                    <div class="mask-field">
                        <label>昵称</label>
                        <input v-model="maskForm.nickname" placeholder="char 叫你的称呼" />
                    </div>
                    <div class="mask-field">
                        <label>性别</label>
                        <select v-model="maskForm.gender" class="mask-select">
                            <option value="">不设置</option>
                            <option value="女">女</option>
                            <option value="男">男</option>
                            <option value="其他">其他</option>
                        </select>
                    </div>
                    <div class="mask-field">
                        <label>头像 emoji</label>
                        <input v-model="maskForm.avatar" placeholder="🎭" />
                    </div>
                    <div class="mask-field">
                        <label>专属号码</label>
                        <input v-model="maskForm.phone" placeholder="✧ 另一个号码" />
                    </div>
                    <div class="mask-field">
                        <label>头像 URL</label>
                        <input v-model="maskForm.avatarUrl" placeholder="https://..." />
                    </div>
                    <div class="mask-field">
                        <label>身份</label>
                        <input v-model="maskForm.identity" placeholder="例：大学生、设计师" />
                    </div>
                    <div class="mask-field col-field">
                        <label>基础信息</label>
                        <textarea v-model="maskForm.bio" placeholder="年龄、性格、爱好..." rows="3"
                            class="mask-textarea"></textarea>
                    </div>
                    <div class="mask-field col-field">
                        <label>背景设定</label>
                        <textarea v-model="maskForm.background" placeholder="角色背景、世界观..." rows="3"
                            class="mask-textarea"></textarea>
                    </div>
                    <div class="mask-field col-field">
                        <label>与 char 的关系</label>
                        <textarea v-model="maskForm.relation" placeholder="关系设定..." rows="2"
                            class="mask-textarea"></textarea>
                    </div>
                    <div class="mask-field col-field">
                        <label>描述</label>
                        <input v-model="maskForm.desc" placeholder="简单描述" />
                    </div>
                </div>
                <div class="mask-modal-footer">
                    <button class="mask-btn-cancel" @click="showMaskModal = false">取消</button>
                    <button class="mask-btn-save" @click="saveMask">保存</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const profileName = ref('')
const profileNickname = ref('')
const profileGender = ref('')
const profilePhone = ref('')
const profileAvatar = ref('')
const profileAvatarUrl = ref('')
const profileIdentity = ref('')
const profileBio = ref('')
const profileBackground = ref('')
const profileRelation = ref('')
const avatarInput = ref(null)
const showSaved = ref(false)

const masks = ref(JSON.parse(localStorage.getItem('user_masks') || '[]'))
const activeMaskId = ref(localStorage.getItem('active_mask_id') || '')
const showMaskModal = ref(false)
const editingMaskIdx = ref(-1)
const maskForm = ref({
    name: '', nickname: '', gender: '', avatar: '🎭',
    phone: '', avatarUrl: '', identity: '', bio: '',
    background: '', relation: '', desc: ''
})

function load() {
    profileName.value = localStorage.getItem('user_name') || ''
    profileNickname.value = localStorage.getItem('user_nickname') || ''
    profileGender.value = localStorage.getItem('user_gender') || ''
    profilePhone.value = localStorage.getItem('user_phone') || '✧ 1314-5201314'
    profileAvatar.value = localStorage.getItem('home_user_avatar') || ''
    profileAvatarUrl.value = ''
    profileIdentity.value = localStorage.getItem('user_identity') || ''
    profileBio.value = localStorage.getItem('user_bio') || ''
    profileBackground.value = localStorage.getItem('user_background') || ''
    profileRelation.value = localStorage.getItem('user_relation') || ''
}

function save() {
    if (profileAvatarUrl.value.trim()) {
        profileAvatar.value = profileAvatarUrl.value.trim()
    }
    localStorage.setItem('user_name', profileName.value)
    localStorage.setItem('user_nickname', profileNickname.value)
    localStorage.setItem('user_gender', profileGender.value)
    localStorage.setItem('user_phone', profilePhone.value)
    localStorage.setItem('home_user_avatar', profileAvatar.value)
    localStorage.setItem('user_identity', profileIdentity.value)
    localStorage.setItem('user_bio', profileBio.value)
    localStorage.setItem('user_background', profileBackground.value)
    localStorage.setItem('user_relation', profileRelation.value)
    showSaved.value = true
    setTimeout(() => { showSaved.value = false }, 1500)
}

function triggerAvatarUpload() { avatarInput.value?.click() }

function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
        profileAvatar.value = ev.target.result
        profileAvatarUrl.value = ''
    }
    reader.readAsDataURL(file)
}

function clearProfile() {
    if (!confirm('确定清除个人信息？')) return
    const keys = ['user_name', 'user_nickname', 'user_gender', 'user_phone',
        'home_user_avatar', 'user_identity', 'user_bio', 'user_background', 'user_relation']
    keys.forEach(k => localStorage.removeItem(k))
    load()
}

// 保存当前身份为面具
function saveCurrentAsMask() {
    const mask = {
        id: Date.now().toString(),
        name: profileName.value || '未命名',
        nickname: profileNickname.value,
        gender: profileGender.value,
        avatar: profileAvatar.value || '🎭',
        phone: profilePhone.value,
        avatarUrl: profileAvatar.value.startsWith('http') ? profileAvatar.value : '',
        identity: profileIdentity.value,
        bio: profileBio.value,
        background: profileBackground.value,
        relation: profileRelation.value,
        desc: profileIdentity.value || ''
    }
    masks.value.push(mask)
    localStorage.setItem('user_masks', JSON.stringify(masks.value))
    showSaved.value = true
    setTimeout(() => { showSaved.value = false }, 1500)
}

function addMask() {
    editingMaskIdx.value = -1
    maskForm.value = {
        name: '', nickname: '', gender: '', avatar: '🎭',
        phone: '', avatarUrl: '', identity: '', bio: '',
        background: '', relation: '', desc: ''
    }
    showMaskModal.value = true
}

function editMask(idx) {
    editingMaskIdx.value = idx
    maskForm.value = { ...masks.value[idx] }
    showMaskModal.value = true
}

function saveMask() {
    if (!maskForm.value.name.trim()) return
    const mask = {
        id: editingMaskIdx.value >= 0 ? masks.value[editingMaskIdx.value].id : Date.now().toString(),
        ...maskForm.value
    }
    if (editingMaskIdx.value >= 0) {
        masks.value[editingMaskIdx.value] = mask
    } else {
        masks.value.push(mask)
    }
    localStorage.setItem('user_masks', JSON.stringify(masks.value))
    showMaskModal.value = false
}

function deleteMask(idx) {
    if (!confirm('删除这个面具？')) return
    masks.value.splice(idx, 1)
    localStorage.setItem('user_masks', JSON.stringify(masks.value))
}

function switchMask(mask) {
    activeMaskId.value = mask.id
    localStorage.setItem('active_mask_id', mask.id)
    localStorage.setItem('user_name', mask.name)
    localStorage.setItem('user_nickname', mask.nickname || '')
    localStorage.setItem('user_gender', mask.gender || '')
    localStorage.setItem('user_phone', mask.phone || '')
    localStorage.setItem('user_identity', mask.identity || '')
    localStorage.setItem('user_bio', mask.bio || '')
    localStorage.setItem('user_background', mask.background || '')
    localStorage.setItem('user_relation', mask.relation || '')
    if (mask.avatarUrl) localStorage.setItem('home_user_avatar', mask.avatarUrl)
    else if (mask.avatar && !mask.avatar.startsWith('data')) localStorage.setItem('home_user_avatar', mask.avatar)
    load()
}

onMounted(load)
</script>

<style scoped>
/* 基础容器 */
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

/* 背景光斑 */
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

/* 顶部导航 */
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

.settings-save-btn {
    background: none;
    border: none;
    font-size: 15px;
    color: #D9A3AF;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    padding: 4px 0;
}

/* 内容区 */
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

/* 头像区 */
.profile-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 24px 0 20px;
}

.profile-avatar-large {
    width: 86px;
    height: 86px;
    border-radius: 50%;
    background: linear-gradient(145deg, #FDE4E8, #F8D0D6);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 38px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    box-shadow: 0 6px 20px rgba(217, 163, 175, 0.25);
    border: 3px solid rgba(255, 255, 255, 0.9);
}

.profile-avatar-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-edit-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: linear-gradient(135deg, #E8C0C9, #D9A3AF);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 248, 250, 1);
}

.avatar-edit-badge svg {
    width: 12px;
    height: 12px;
}

.profile-name-display {
    font-size: 18px;
    font-weight: 700;
    color: #4A3F41;
    margin-top: 4px;
}

.profile-phone-display {
    font-size: 12px;
    color: #B8A9AC;
}

/* 分区标签 */
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

.section-label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 8px;
    margin-top: 20px;
}

.mask-header-btns {
    display: flex;
    gap: 10px;
    align-items: center;
}

/* 卡片组 */
.settings-group {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    border-radius: 22px;
    overflow: hidden;
    margin-bottom: 10px;
    box-shadow: 0 8px 24px rgba(217, 163, 175, 0.1), 0 2px 6px rgba(217, 163, 175, 0.06), 0 0 0 1px rgba(255, 255, 255, 0.5) inset;
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
    gap: 8px;
}

/* 字段 */
.sgi-label {
    font-size: 14px;
    color: #4A3F41;
    flex-shrink: 0;
    min-width: 80px;
}

.sgi-right {
    display: flex;
    align-items: center;
    gap: 4px;
}

.sgi-value {
    font-size: 13px;
    color: #B8A9AC;
}

.sgi-arrow {
    width: 14px;
    height: 14px;
    stroke: #D4C8CA;
}

.sgi-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #4A3F41;
    text-align: right;
    font-family: inherit;
}

.sgi-input::placeholder {
    color: #D4C8CA;
}

.sgi-input.full {
    width: 100%;
    text-align: left;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 240, 242, 0.5);
    border-radius: 14px;
    padding: 12px 14px;
    box-shadow: 0 4px 12px rgba(217, 163, 175, 0.06);
}

.sgi-select {
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #4A3F41;
    font-family: inherit;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
    text-align: right;
    padding-right: 4px;
}

.sgi-select-hidden {
    position: absolute;
    opacity: 0;
    right: 16px;
    width: 80px;
    height: 44px;
    cursor: pointer;
}

.sgi-textarea {
    width: 100%;
    border: 1px solid rgba(255, 240, 242, 0.5);
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 13px;
    color: #4A3F41;
    font-family: inherit;
    resize: none;
    outline: none;
    line-height: 1.5;
    box-shadow: 0 4px 12px rgba(217, 163, 175, 0.06);
}

.sgi-textarea::placeholder {
    color: #D4C8CA;
}

/* 开关 */
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

/* 按钮 */
.btn-row {
    display: flex;
    gap: 8px;
    margin-bottom: 10px;
}

.action-btn {
    flex: 1;
    height: 44px;
    border-radius: 16px;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
}

.action-btn.primary {
    background: linear-gradient(135deg, #E8C0C9, #D9A3AF);
    color: white;
    box-shadow: 0 6px 16px rgba(217, 163, 175, 0.3);
}

.action-btn.primary:active {
    transform: scale(0.97);
}

.action-btn.ghost {
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: saturate(180%) blur(16px);
    -webkit-backdrop-filter: saturate(180%) blur(16px);
    color: #6B5B5E;
    border: 1px solid rgba(255, 240, 242, 0.5);
    box-shadow: 0 4px 12px rgba(217, 163, 175, 0.08);
}

.action-btn.ghost:active {
    transform: scale(0.97);
    background: rgba(255, 255, 255, 0.65);
}

.action-btn.danger {
    background: rgba(192, 112, 112, 0.08);
    color: #C07070;
    border: 1px solid rgba(192, 112, 112, 0.15);
}

.action-btn.danger:active {
    transform: scale(0.97);
}

/* 小型操作按钮 */
.icon-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(232, 192, 201, 0.12);
    border: 1px solid rgba(232, 192, 201, 0.3);
    border-radius: 12px;
    padding: 6px 12px;
    font-size: 12px;
    color: #D9A3AF;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: background 0.2s;
    flex-shrink: 0;
}

.icon-btn:hover {
    background: rgba(232, 192, 201, 0.2);
}

.icon-btn:active {
    transform: scale(0.96);
}

.icon-btn svg {
    width: 13px;
    height: 13px;
    stroke: #D9A3AF;
}

/* 面具样式 */
.save-as-mask-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    font-size: 12px;
    color: #B8A9AC;
    cursor: pointer;
    font-family: inherit;
    transition: color 0.2s;
}

.save-as-mask-btn:hover {
    color: #D9A3AF;
}

.save-as-mask-btn svg {
    width: 13px;
    height: 13px;
    stroke: currentColor;
}

.add-mask-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    background: none;
    border: none;
    font-size: 13px;
    color: #D9A3AF;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
}

.add-mask-btn svg {
    width: 14px;
    height: 14px;
    stroke: #D9A3AF;
}

.mask-empty {
    padding: 20px 16px;
    font-size: 12px;
    color: #B8A9AC;
    text-align: center;
}

.mask-item {
    cursor: pointer;
    transition: background 0.15s;
}

.mask-item:active {
    background: rgba(217, 163, 175, 0.04);
}

.mask-active {
    background: rgba(232, 192, 201, 0.08);
}

.mask-avatar {
    font-size: 26px;
    flex-shrink: 0;
    width: 36px;
    text-align: center;
}

.mask-info {
    flex: 1;
    padding: 0 10px;
}

.mask-name {
    font-size: 14px;
    font-weight: 600;
    color: #4A3F41;
}

.mask-desc {
    font-size: 11px;
    color: #B8A9AC;
    margin-top: 2px;
}

.mask-actions {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
}

.mask-active-badge {
    font-size: 10px;
    color: #D9A3AF;
    font-weight: 700;
    background: rgba(232, 192, 201, 0.2);
    padding: 2px 8px;
    border-radius: 8px;
}

.mask-edit-btn {
    background: none;
    border: none;
    font-size: 12px;
    color: #B8A9AC;
    cursor: pointer;
    font-family: inherit;
    padding: 4px 6px;
}

.mask-del-btn {
    background: none;
    border: none;
    font-size: 16px;
    color: #D4C8CA;
    cursor: pointer;
    padding: 4px;
}

/* 危险操作 */
.danger-item {
    cursor: pointer;
    transition: background 0.15s;
}

.danger-item:active {
    background: rgba(192, 112, 112, 0.04);
}

.danger-label {
    color: #C07070;
    font-size: 14px;
    width: 100%;
    text-align: center;
}

/* 面具弹窗 */
.mask-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(74, 63, 65, 0.2);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: flex-end;
    padding: 0 12px 32px;
}

.mask-modal {
    background: rgba(255, 252, 252, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-radius: 24px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(217, 163, 175, 0.2);
    border: 1px solid rgba(255, 240, 242, 0.5);
    animation: slideUp 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.mask-modal::-webkit-scrollbar {
    display: none;
}

@keyframes slideUp {
    from {
        transform: translateY(40px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.mask-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 18px 12px;
    position: sticky;
    top: 0;
    background: rgba(255, 252, 252, 0.96);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(217, 163, 175, 0.1);
    font-size: 15px;
    font-weight: 700;
    color: #4A3F41;
}

.mask-modal-header button {
    background: rgba(232, 192, 201, 0.15);
    border: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 16px;
    color: #B8A9AC;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mask-modal-body {
    padding: 8px 18px;
    display: flex;
    flex-direction: column;
}

.mask-field {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid rgba(217, 163, 175, 0.08);
}

.mask-field:last-child {
    border-bottom: none;
}

.col-field {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
}

.mask-field label {
    font-size: 14px;
    color: #4A3F41;
    min-width: 100px;
    flex-shrink: 0;
}

.mask-field input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #4A3F41;
    text-align: right;
    font-family: inherit;
}

.mask-field input::placeholder {
    color: #D4C8CA;
}

.mask-select {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 14px;
    color: #4A3F41;
    text-align: right;
    font-family: inherit;
    -webkit-appearance: none;
    appearance: none;
}

.mask-textarea {
    width: 100%;
    border: 1px solid rgba(255, 240, 242, 0.5);
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 10px 12px;
    font-size: 13px;
    color: #4A3F41;
    font-family: inherit;
    resize: none;
    outline: none;
    line-height: 1.5;
}

.mask-textarea::placeholder {
    color: #D4C8CA;
}

.mask-modal-footer {
    display: flex;
    gap: 10px;
    padding: 12px 18px 16px;
    position: sticky;
    bottom: 0;
    background: rgba(255, 252, 252, 0.96);
    backdrop-filter: blur(10px);
    border-top: 1px solid rgba(217, 163, 175, 0.08);
}

.mask-btn-cancel {
    flex: 1;
    height: 44px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.5);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 240, 242, 0.5);
    font-size: 15px;
    color: #6B5B5E;
    cursor: pointer;
    font-family: inherit;
}

.mask-btn-save {
    flex: 1;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, #E8C0C9, #D9A3AF);
    border: none;
    font-size: 15px;
    color: white;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    box-shadow: 0 4px 12px rgba(217, 163, 175, 0.3);
}

/* 提示 */
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
