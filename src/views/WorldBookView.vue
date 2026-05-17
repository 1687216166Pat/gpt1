<template>
    <div class="worldbook-page">
        <div class="worldbook-header">
            <button class="back-btn" @click="$router.push('/')">‹</button>
            <h2>世界书</h2>
            <div class="header-actions">
                <button class="header-btn" @click="toggleSelectMode" :class="{ active: selectMode }">✓</button>
                <button class="header-btn" @click="showAdd = true">+</button>
            </div>
        </div>

        <!-- 注入位置说明（可收起） -->
        <div class="guide-section" v-if="showGuide">
            <GlassCard size="sm" class="guide-card">
                <p class="guide-title" @click="showGuide = false">注入位置说明 ▾</p>
                <div class="guide-list">
                    <p><strong>最高覆盖</strong> — 绝对核心，强规则、安全限制、禁止事项</p>
                    <p><strong>角色前</strong> — 世界观、背景设定、环境规则</p>
                    <p><strong>角色后</strong> — 补充设定、关系状态、临时人格偏移</p>
                    <p><strong>用户输入前</strong> — 权重低，像"参考资料"，适合关键词触发</p>
                    <p><strong>尾部临时层</strong> — 最低优先级，当前状态、一次性提醒</p>
                </div>
            </GlassCard>
        </div>
        <div class="guide-toggle" v-else @click="showGuide = true">
            <span>注入位置说明 ▸</span>
        </div>

        <!-- 批量操作栏 -->
        <div v-if="selectMode && selectedBooks.length > 0" class="batch-bar">
            <SoftButton variant="glass" size="sm" @click="selectAll">全选</SoftButton>
            <SoftButton variant="primary" size="sm" @click="showBindModal = true">绑定</SoftButton>
            <span class="batch-count">已选 {{ selectedBooks.length }}</span>
        </div>

        <div class="worldbook-list">
            <GlassCard v-for="book in books" :key="book.id" size="md" class="book-card" @click="selectMode ? toggleSelect(book.id) : editBook(book)">
                <div class="book-row">
                    <div v-if="selectMode" class="book-checkbox" :class="{ checked: selectedBooks.includes(book.id) }">
                        <span v-if="selectedBooks.includes(book.id)">✓</span>
                    </div>
                    <div class="book-info">
                        <p class="book-title">{{ book.title }}</p>
                        <div class="book-meta">
                            <GlassTag :variant="positionColor(book.position)" size="sm">{{ positionLabel(book.position) }}</GlassTag>
                            <GlassTag v-if="book.keyword_enabled" variant="warm" size="sm">关键词</GlassTag>
                            <GlassTag v-if="book.bind_type === 'global'" variant="soft" size="sm">全局</GlassTag>
                        </div>
                    </div>
                    <button class="delete-btn" @click.stop="deleteBook(book.id)">×</button>
                </div>
            </GlassCard>

            <div v-if="books.length === 0" class="empty-area">
                <p class="empty-icon">📖</p>
                <p class="empty-text">还没有世界书</p>
            </div>
        </div>

        <!-- 编辑/新建弹窗 -->
        <BlurModal :visible="showAdd || !!editingBook" @close="closeModal">
            <h3>{{ editingBook ? '编辑世界书' : '新建世界书' }}</h3>
            <DreamInput label="标题" v-model="bookForm.title" placeholder="世界书名称" />

            <div class="form-row">
                <label class="form-label">注入位置</label>
                <select v-model="bookForm.position" class="form-select">
                    <option value="override">最高覆盖</option>
                    <option value="before_char">角色前</option>
                    <option value="after_char">角色后</option>
                    <option value="before_user">用户输入前</option>
                    <option value="tail">尾部临时层</option>
                </select>
            </div>

            <div class="form-row">
                <label class="form-label">关键词触发</label>
                <div class="keyword-row">
                    <label class="toggle-mini">
                        <input type="checkbox" v-model="bookForm.keyword_enabled" />
                        <span class="toggle-dot"></span>
                    </label>
                    <DreamInput v-if="bookForm.keyword_enabled" v-model="bookForm.keywords" placeholder="关键词，用逗号分隔" />
                </div>
            </div>

            <DreamInput label="内容" type="textarea" v-model="bookForm.content" :rows="8" placeholder="世界观设定、背景信息、规则..." />

            <!-- 导入文件 -->
            <div class="import-area">
                <SoftButton variant="ghost" size="sm" @click="$refs.fileInput.click()">从文件导入</SoftButton>
                <input ref="fileInput" type="file" accept=".txt,.md,.json,.doc,.docx" style="display:none" @change="handleFileImport" />
            </div>

            <div class="modal-actions">
                <SoftButton variant="secondary" @click="closeModal">取消</SoftButton>
                <SoftButton variant="primary" @click="saveBook">保存</SoftButton>
            </div>
        </BlurModal>

        <!-- 绑定弹窗 -->
        <BlurModal :visible="showBindModal" @close="showBindModal = false">
            <h3>绑定世界书</h3>
            <div class="bind-option" :class="{ active: bindType === 'global' }" @click="bindType = 'global'">
                <p>全局绑定</p>
                <span class="bind-desc">所有角色都会加载</span>
            </div>
            <div class="bind-option" :class="{ active: bindType === 'specific' }" @click="bindType = 'specific'">
                <p>绑定特定角色</p>
                <span class="bind-desc">只有选中的角色会加载</span>
            </div>
            <div v-if="bindType === 'specific'" class="persona-select">
                <div v-for="p in personas" :key="p.id" class="persona-check" @click="toggleBindPersona(p.id)">
                    <div class="check-box" :class="{ checked: bindPersonas.includes(p.id) }">
                        <span v-if="bindPersonas.includes(p.id)">✓</span>
                    </div>
                    <span>{{ p.name }}</span>
                </div>
            </div>
            <div class="modal-actions">
                <SoftButton variant="secondary" @click="showBindModal = false">取消</SoftButton>
                <SoftButton variant="primary" @click="applyBind">确认绑定</SoftButton>
            </div>
        </BlurModal>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/utils/api'
import GlassCard from '@/components/ui/GlassCard.vue'
import GlassTag from '@/components/ui/GlassTag.vue'
import SoftButton from '@/components/ui/SoftButton.vue'
import DreamInput from '@/components/ui/DreamInput.vue'
import BlurModal from '@/components/ui/BlurModal.vue'

const books = ref([])
const personas = ref([])
const showAdd = ref(false)
const editingBook = ref(null)
const showGuide = ref(false)
const selectMode = ref(false)
const selectedBooks = ref([])
const showBindModal = ref(false)
const bindType = ref('global')
const bindPersonas = ref([])
const fileInput = ref(null)

const bookForm = reactive({
    title: '',
    content: '',
    position: 'before_char',
    keywords: '',
    keyword_enabled: false,
})

function positionLabel(pos) {
    const map = { override: '最高覆盖', before_char: '角色前', after_char: '角色后', before_user: '用户输入前', tail: '尾部临时层' }
    return map[pos] || '角色前'
}

function positionColor(pos) {
    const map = { override: 'pink', before_char: 'purple', after_char: 'warm', before_user: 'default', tail: 'soft' }
    return map[pos] || 'default'
}

async function loadBooks() {
    try {
        const res = await api('/api/worldbooks')
        books.value = await res.json()
    } catch {}
}

async function loadPersonas() {
    try {
        const res = await api('/api/prompts/personas')
        const data = await res.json()
        personas.value = data.personas
    } catch {}
}

function editBook(book) {
    editingBook.value = book
    bookForm.title = book.title
    bookForm.content = book.content
    bookForm.position = book.position || 'before_char'
    bookForm.keywords = book.keywords || ''
    bookForm.keyword_enabled = book.keyword_enabled || false
}

async function saveBook() {
    if (!bookForm.title || !bookForm.content) return
    if (editingBook.value) {
        await api(`/api/worldbooks/${editingBook.value.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookForm)
        })
    } else {
        await api('/api/worldbooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookForm)
        })
    }
    closeModal()
    await loadBooks()
}

async function deleteBook(id) {
    if (!confirm('确定删除？')) return
    await api(`/api/worldbooks/${id}`, { method: 'DELETE' })
    await loadBooks()
}

function closeModal() {
    showAdd.value = false
    editingBook.value = null
    bookForm.title = ''
    bookForm.content = ''
    bookForm.position = 'before_char'
    bookForm.keywords = ''
    bookForm.keyword_enabled = false
}

function toggleSelectMode() {
    selectMode.value = !selectMode.value
    if (!selectMode.value) selectedBooks.value = []
}

function toggleSelect(id) {
    const idx = selectedBooks.value.indexOf(id)
    if (idx > -1) selectedBooks.value.splice(idx, 1)
    else selectedBooks.value.push(id)
}

function selectAll() {
    if (selectedBooks.value.length === books.value.length) {
        selectedBooks.value = []
    } else {
        selectedBooks.value = books.value.map(b => b.id)
    }
}

function toggleBindPersona(id) {
    const idx = bindPersonas.value.indexOf(id)
    if (idx > -1) bindPersonas.value.splice(idx, 1)
    else bindPersonas.value.push(id)
}

async function applyBind() {
    await api('/api/worldbooks/bind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bookIds: selectedBooks.value,
            bindType: bindType.value,
            bindPersonas: bindPersonas.value.join(','),
        })
    })
    showBindModal.value = false
    selectMode.value = false
    selectedBooks.value = []
    await loadBooks()
}

async function handleFileImport(event) {
    const file = event.target.files[0]
    if (!file) return
    try {
        const text = await file.text()
        if (!bookForm.title) bookForm.title = file.name.replace(/\.[^.]+$/, '')
        bookForm.content = text
    } catch {}
}

onMounted(() => {
    loadBooks()
    loadPersonas()
})
</script>

<style scoped>
.worldbook-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: env(safe-area-inset-top, 44px);
    overflow-x: hidden;
}

.worldbook-header {
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

.worldbook-header h2 {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text);
}

.header-actions {
    display: flex;
    gap: 8px;
}

.header-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: var(--color-primary);
    cursor: pointer;
    opacity: 0.6;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
}

.header-btn.active {
    opacity: 1;
    background: rgba(212, 137, 158, 0.1);
}

/* 说明区 */
.guide-section {
    padding: 10px 0;
}

.guide-card {
    padding: 12px 14px !important;
}

.guide-title {
    font-size: 11px;
    color: var(--color-primary);
    cursor: pointer;
    margin-bottom: 8px;
}

.guide-list p {
    font-size: 11px;
    color: var(--color-text-light);
    line-height: 1.8;
}

.guide-list strong {
    color: var(--color-text);
    font-weight: 500;
}

.guide-toggle {
    padding: 8px 0;
    cursor: pointer;
}

.guide-toggle span {
    font-size: 11px;
    color: var(--color-primary);
    opacity: 0.6;
}

/* 批量操作栏 */
.batch-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 0;
}

.batch-count {
    font-size: 11px;
    color: var(--color-text-light);
    margin-left: auto;
}

/* 列表 */
.worldbook-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 0;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
}

.book-card {
    margin-bottom: 10px;
    cursor: pointer;
}

.book-row {
    display: flex;
    align-items: center;
    gap: 12px;
}

.book-checkbox {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 1.5px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: white;
    flex-shrink: 0;
    transition: all 0.2s;
}

.book-checkbox.checked {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

.book-info {
    flex: 1;
}

.book-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 6px;
}

.book-meta {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.delete-btn {
    background: none;
    border: none;
    font-size: 18px;
    color: var(--color-text-light);
    cursor: pointer;
    opacity: 0.4;
    padding: 4px;
}

/* 弹窗内 */
.form-row {
    margin-bottom: 14px;
}

.form-label {
    display: block;
    font-size: 11px;
    color: var(--color-text-light);
    margin-bottom: 6px;
}

.form-select {
    width: 100%;
    height: 38px;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 0 12px;
    font-size: 13px;
    background: var(--color-card);
    color: var(--color-text);
    outline: none;
    appearance: none;
    -webkit-appearance: none;
}

.keyword-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.toggle-mini {
    position: relative;
    width: 36px;
    height: 20px;
    flex-shrink: 0;
}

.toggle-mini input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-dot {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: var(--color-bg-secondary);
    border-radius: 20px;
    cursor: pointer;
    transition: 0.3s;
}

.toggle-dot:before {
    content: "";
    position: absolute;
    height: 14px; width: 14px;
    left: 3px; bottom: 3px;
    background: white;
    border-radius: 50%;
    transition: 0.3s;
}

.toggle-mini input:checked + .toggle-dot {
    background: var(--color-primary);
}

.toggle-mini input:checked + .toggle-dot:before {
    transform: translateX(16px);
}

.import-area {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 16px;
}

/* 绑定弹窗 */
.bind-option {
    padding: 14px;
    border-radius: 12px;
    border: 1px solid var(--color-border);
    margin-bottom: 8px;
    cursor: pointer;
    opacity: 0.5;
    transition: all 0.2s;
}

.bind-option.active {
    opacity: 1;
    border-color: var(--color-primary);
    background: rgba(212, 137, 158, 0.04);
}

.bind-option p {
    font-size: 14px;
    color: var(--color-text);
}

.bind-desc {
    font-size: 11px;
    color: var(--color-text-light);
}

.persona-select {
    margin-top: 12px;
}

.persona-check {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    cursor: pointer;
    font-size: 14px;
    color: var(--color-text);
}

.check-box {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    border: 1.5px solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: white;
}

.check-box.checked {
    background: var(--color-primary);
    border-color: var(--color-primary);
}

/* 空状态 */
.empty-area {
    text-align: center;
    padding: 48px 20px;
}

.empty-icon {
    font-size: 28px;
    margin-bottom: 10px;
}

.empty-text {
    font-size: 13px;
    color: var(--color-text-light);
    opacity: 0.5;
}
</style>
