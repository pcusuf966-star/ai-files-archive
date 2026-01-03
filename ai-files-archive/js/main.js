// Основной скрипт приложения
class AIFilesApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupNavigation();
            this.setupEventListeners();
            this.loadDashboard();
            
            // Скрываем прелоадер
            setTimeout(() => {
                const preloader = document.getElementById('preloader');
                if (preloader) {
                    preloader.style.opacity = '0';
                    setTimeout(() => {
                        preloader.style.display = 'none';
                    }, 500);
                }
            }, 1000);
        });
    }
    
    setupNavigation() {
        // Обработка кликов по навигации
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('href').replace('#', '');
                this.navigateTo(page);
                
                // Обновляем активный пункт меню
                document.querySelectorAll('.nav-link').forEach(l => {
                    l.classList.remove('active');
                });
                link.classList.add('active');
            });
        });
        
        // Переключение темы
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('light-theme');
                const icon = themeToggle.querySelector('i');
                if (document.body.classList.contains('light-theme')) {
                    icon.classList.replace('fa-moon', 'fa-sun');
                } else {
                    icon.classList.replace('fa-sun', 'fa-moon');
                }
            });
        }
    }
    
    setupEventListeners() {
        // Слушаем обновления хранилища
        window.FileStorage.addEventListener('storageUpdated', ({ files }) => {
            this.updateDashboard();
            this.updateFileGrid();
        });
        
        // Поиск файлов
        const searchInput = document.getElementById('searchFiles');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.updateFileGrid();
            });
        }
        
        // Фильтры
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.updateFileGrid();
            });
        });
        
        // Управление файлами
        document.addEventListener('click', (e) => {
            // Удаление файла
            if (e.target.closest('.delete-btn')) {
                const card = e.target.closest('.file-card');
                if (card && confirm('Удалить этот файл?')) {
                    const fileId = card.dataset.id;
                    window.FileStorage.deleteFile(parseInt(fileId));
                }
            }
            
            // Копирование файла
            if (e.target.closest('.copy-btn')) {
                const card = e.target.closest('.file-card');
                if (card) {
                    const fileId = card.dataset.id;
                    const files = window.FileStorage.files;
                    const file = files.find(f => f.id == fileId);
                    
                    if (file) {
                        navigator.clipboard.writeText(file.content)
                            .then(() => this.showNotification('Код скопирован', 'success'));
                    }
                }
            }
        });
    }
    
    navigateTo(page) {
        // Скрываем текущую страницу
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });
        
        // Показываем выбранную страницу
        const targetPage = document.getElementById(page);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = page;
            
            // Загружаем контент страницы
            switch(page) {
                case 'dashboard':
                    this.loadDashboard();
                    break;
                case 'explore':
                    this.loadExplore();
                    break;
                case 'ai-models':
                    this.loadAIModels();
                    break;
            }
        }
    }
    
    loadDashboard() {
        this.updateStats();
        this.updateRecentFiles();
    }
    
    updateStats() {
        const stats = window.FileStorage.getStats();
        
        // Обновляем значения
        document.getElementById('totalFiles')?.textContent = stats.total;
        document.getElementById('chatgptFiles')?.textContent = stats.chatgpt;
        document.getElementById('deepseekFiles')?.textContent = stats.deepseek;
        document.getElementById('grokFiles')?.textContent = stats.grok;
        document.getElementById('claudeFiles')?.textContent = stats.claude;
    }
    
    updateRecentFiles() {
        const container = document.getElementById('recentFiles');
        if (!container) return;
        
        const files = window.FileStorage.files.slice(0, 6); // 6 последних файлов
        
        if (files.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>Пока нет файлов</p>
                    <a href="#upload" class="btn-secondary">Загрузить первый файл</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = files.map(file => this.createFileCard(file)).join('');
    }
    
    loadExplore() {
        this.updateFileGrid();
    }
    
    updateFileGrid() {
        const container = document.getElementById('filesGrid');
        if (!container) return;
        
        // Ищем файлы с учетом фильтров
        const files = window.FileStorage.searchFiles(this.searchQuery, this.currentFilter);
        
        if (files.length === 0) {
            container.innerHTML = `
                <div class="empty-state full-width">
                    <i class="fas fa-search"></i>
                    <h3>Файлы не найдены</h3>
                    <p>Попробуйте изменить фильтры или поисковый запрос</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = files.map(file => this.createFileCard(file)).join('');
    }
    
    createFileCard(file) {
        const aiBadges = {
            'chatgpt': { class: 'chatgpt', icon: 'fab fa-openai', text: 'ChatGPT' },
            'deepseek': { class: 'deepseek', icon: 'fas fa-search', text: 'DeepSeek' },
            'grok': { class: 'grok', icon: 'fab fa-x-twitter', text: 'Grok' },
            'claude': { class: 'claude', icon: 'fas fa-user-tie', text: 'Claude' },
            'other': { class: 'other', icon: 'fas fa-robot', text: 'AI' }
        };
        
        const ai = aiBadges[file.ai] || aiBadges.other;
        
        return `
            <div class="file-card" data-id="${file.id}">
                <div class="file-header">
                    <span class="ai-badge ${ai.class}">
                        <i class="${ai.icon}"></i> ${ai.text}
                    </span>
                    <span class="file-type">${file.type}</span>
                </div>
                
                <h3 class="file-title">${this.escapeHtml(file.name)}</h3>
                <p class="file-description">${this.escapeHtml(file.description)}</p>
                
                ${file.tags.length > 0 ? `
                <div class="file-tags">
                    ${file.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                ` : ''}
                
                <div class="file-info">
                    <span><i class="far fa-calendar"></i> ${file.date}</span>
                    <span><i class="fas fa-weight-hanging"></i> ${file.size}</span>
                </div>
                
                <div class="file-actions">
                    <button class="btn-secondary view-btn">
                        <i class="fas fa-eye"></i> Просмотр
                    </button>
                    <button class="btn-secondary copy-btn">
                        <i class="fas fa-copy"></i> Копировать
                    </button>
                    <button class="btn-secondary delete-btn">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `;
    }
    
    loadAIModels() {
        const stats = window.FileStorage.getStats();
        
        // Обновляем статистику по моделям
        document.getElementById('chatgptStats')?.textContent = stats.chatgpt;
        document.getElementById('deepseekStats')?.textContent = stats.deepseek;
        document.getElementById('grokStats')?.textContent = stats.grok;
        document.getElementById('claudeStats')?.textContent = stats.claude;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    showNotification(message, type = 'info') {
        // Используем уведомления из UploadManager
        if (window.UploadManager) {
            window.UploadManager.showNotification(message, type);
        }
    }
}

// Запускаем приложение
const app = new AIFilesApp();

// Экспорт для глобального доступа
window.AIFilesApp = app;

// Добавляем стили для пустых состояний
document.addEventListener('DOMContentLoaded', () => {
    if (!document.querySelector('#app-styles')) {
        const style = document.createElement('style');
        style.id = 'app-styles';
        style.textContent = `
            .empty-state {
                text-align: center;
                padding: 3rem 2rem;
                color: #94a3b8;
            }
            
            .empty-state.full-width {
                grid-column: 1 / -1;
            }
            
            .empty-state i {
                font-size: 3rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
            
            .empty-state h3 {
                color: #f1f5f9;
                margin-bottom: 0.5rem;
            }
            
            .explore-controls {
                display: flex;
                gap: 1rem;
                margin: 2rem 0;
                flex-wrap: wrap;
            }
            
            .search-box {
                flex: 1;
                min-width: 300px;
                position: relative;
            }
            
            .search-box i {
                position: absolute;
                left: 1rem;
                top: 50%;
                transform: translateY(-50%);
                color: #94a3b8;
            }
            
            .search-box input {
                width: 100%;
                padding: 0.875rem 1rem 0.875rem 3rem;
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid #334155;
                border-radius: 8px;
                color: #f1f5f9;
                font-size: 1rem;
            }
            
            .filter-tabs {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .filter-btn {
                padding: 0.75rem 1.25rem;
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid #334155;
                border-radius: 8px;
                color: #94a3b8;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.3s ease;
            }
            
            .filter-btn:hover {
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
            }
            
            .filter-btn.active {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
            
            .view-options {
                display: flex;
                gap: 0.5rem;
            }
            
            .view-option {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid #334155;
                border-radius: 8px;
                color: #94a3b8;
                cursor: pointer;
            }
            
            .view-option.active {
                background: #3b82f6;
                color: white;
                border-color: #3b82f6;
            }
            
            .pagination {
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 1rem;
                margin: 2rem 0;
            }
            
            .pagination-btn {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid #334155;
                border-radius: 8px;
                color: #94a3b8;
                cursor: pointer;
            }
            
            .pagination-btn:not(:disabled):hover {
                background: rgba(59, 130, 246, 0.1);
                color: #3b82f6;
            }
            
            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .page-info {
                color: #94a3b8;
            }
        `;
        document.head.appendChild(style);
    }
});