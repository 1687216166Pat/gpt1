<template>
    <div class="worldbook-page">
        <div class="worldbook-header">
            <button class="back-btn" @click="$router.push('/')">‹</button>
            <h2>世界书</h2>
            <button class="add-btn" @click="showAdd = true">+</button>
        </div>

        <div class="worldbook-list">
            <GlassCard v-for="book in books" :key="book.id" size="md" class="book-card" @click="editBook(book)">
                <p class="book-title">{{ book.title }}</p>
                <p class="book-preview">{{ book.content.slice(0, 60) }}...</p>
                <button class="delete-btn" @click.stop="deleteBook(book.id)">×</button>
            </GlassCard>
            <div v-if="books.length === 0" class="empty-area">
                <p class="empty-icon">📖</p>
                <p class="empty-text">还没有世界书</p>
                <p class="empty-sub">点右上角 + 创建一个</p>
            </div>
        </div>

        <!-- 编辑/新建弹窗 -->
        <BlurModal :visible="showAdd || !!editingBook" @close="closeModal">
            <h3>{{ editingBook ? '编辑世界书' : '新建世界书' }}</h3>
            <DreamInput label="标题" v-model="bookForm.title" placeholder="世界书名称" />
            <DreamInput label="内容" type="textarea" v-model="bookForm.content" :rows="10"
                placeholder="世界观设定、背景信息、规则..." />

            <!-- 导入文件 -->
            <div class="import-area">
                <p class="import-label">或从文件导入</p>
                <input type="file" @change="handleFileImport" class="file-input" />
            </div>

            <div class="modal-actions">
                <SoftButton variant="secondary" @click="closeModal">取消</SoftButton>
                <SoftButton variant="primary" @click="saveBook">保存</SoftButton>
            </div>
        </BlurModal>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/utils/api'
import GlassCard from '@/components/ui/GlassCard.vue'
import SoftButton from '@/components/ui/SoftButton.vue'
import DreamInput from '@/components/ui/DreamInput.vue'
import BlurModal from '@/components/ui/BlurModal.vue'

const books = ref([])
const showAdd = ref(false)
const editingBook = ref(null)

const bookForm = reactive({
    title: '',
    content: ''
})

async function loadBooks() {
    try {
        const res = await api('/api/worldbooks')
        books.value = await res.json()
    } catch (e) {
        console.error('加载世界书失败:', e)
    }
}

function editBook(book) {
    editingBook.value = book
    bookForm.title = book.title
    bookForm.content = book.content
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
}

async function handleFileImport(event) {
    const file = event.target.files[0]
    if (!file) return
    try {
        const text = await file.text()
        if (!bookForm.title) {
            bookForm.title = file.name.replace(/\.[^.]+$/, '')
        }
        bookForm.content = text
    } catch (e) {
        console.error('文件读取失败:', e)
    }
}

onMounted(loadBooks)
</script>

<style scoped>
.worldbook-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-top: env(safe-area-inset-top, 44px);
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

.add-btn {
    background: none;
    border: none;
    font-size: 22px;
    color: var(--color-primary);
    cursor: pointer;
    opacity: 0.75;
}

.worldbook-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px 0;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
}

.book-card {
    margin-bottom: 12px;
    cursor: pointer;
    position: relative;
    animation: fadeIn 0.4s var(--ease-soft) backwards;
}

.book-title {
    font-size: 15px;
    font-weight: 500;
    color: var(--color-text);
    margin-bottom: 6px;
}

.book-preview {
    font-size: 12px;
    color: var(--color-text-light);
    line-height: 1.5;
}

.delete-btn {
    position: absolute;
    top: 14px;
    right: 14px;
    background: none;
    border: none;
    font-size: 18px;
    color: var(--color-text-light);
    cursor: pointer;
    opacity: 0.5;
}

.empty-area {
    text-align: center;
    padding: 52px 20px;
    animation: fadeIn 0.5s var(--ease-soft);
}

.empty-icon {
    font-size: 32px;
    margin-bottom: 12px;
    animation: softFloat 6s ease-in-out infinite;
}

.empty-text {
    font-size: 14px;
    color: var(--color-text-light);
    margin-bottom: 4px;
}

.empty-sub {
    font-size: 12px;
    color: var(--color-text-light);
    opacity: 0.5;
}

.modal-actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
}

.import-area {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid var(--color-border);
}

.import-label {
    font-size: 11px;
    color: var(--color-text-light);
    margin-bottom: 8px;
}

.file-input {
    font-size: 11px;
    color: var(--color-text-light);
}
</style>
