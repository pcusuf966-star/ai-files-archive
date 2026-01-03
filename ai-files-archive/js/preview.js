// Менеджер предпросмотра файлов
class PreviewManager {
    constructor() {
        this.currentFile = null;
        this.modal = null;
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupModal();
            this.setupEventListeners();
        });
    }
    
    setupModal() {
        // Создаем модальное окно если его нет
        if (!document.getElementById('previewModal')) {
            this.modal = document.createElement('div');
            this.modal.id = 'previewModal';
            this.modal.className = 'modal';
            this.modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 id="previewTitle">Предпросмотр файла</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <pre id="previewContent"><code>// Выберите файл для просмотра</code></pre>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="copyCodeBtn">
                            <i class="fas fa-copy"></i> Копировать код
                        </button>
                        <button class="btn btn-primary" id="downloadBtn">
                            <i class="fas fa-download"></i> Скачать
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(this.modal);
        } else {
            this.modal = document.getElementById('previewModal');
        }
        
        // Стили модального окна
        if (!document.querySelector('#modal-styles')) {
            const style = document.createElement('style');
            style.id = 'modal-styles';
            style.textContent = `
                .modal {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 10000;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem;
                }
                
                .modal-content {
                    background: #1e293b;
                    border-radius: 12px;
                    width: 90%;
                    max-width: 800px;
                    max-height: 80vh;
                    overflow: hidden;
                    border: 1px solid #334155;
                }
                
                .modal-header {
                    padding: 1.5rem;
                    border-bottom: 1px solid #334155;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .modal-header h3 {
                    margin: 0;
                    font-size: 1.25rem;
                }
                
                .modal-close {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 1.5rem;
                    cursor: pointer;
                    line-height: 1;
                }
                
                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    max-height: 50vh;
                }
                
                .modal-body pre {
                    margin: 0;
                    padding: 1rem;
                    background: #0f172a;
                    border-radius: 8px;
                    overflow-x: auto;
                }
                
                .modal-body code {
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
                
                .modal-footer {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #334155;
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                }
                
                .btn {
                    padding: 0.75rem 1.5rem;
                    border-radius: 8px;
                    border: none;
                    cursor: pointer;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .btn-secondary {
                    background: rgba(255, 255, 255, 0.1);
                    color: #f1f5f9;
                }
                
                .btn-primary {
                    background: #3b82f6;
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    setupEventListeners() {
        // Закрытие модального окна
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hide());
        }
        
        // Клик по фону
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });
        
        // Копирование кода
        const copyBtn = this.modal.querySelector('#copyCodeBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyCode());
        }
        
        // Скачивание файла
        const downloadBtn = this.modal.querySelector('#downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadFile());
        }
        
        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.hide();
            }
        });
    }
    
    // Показ предпросмотра файла
    show(file) {
        this.currentFile = file;
        
        // Обновляем заголовок
        const title = this.modal.querySelector('#previewTitle');
        if (title) {
            title.textContent = file.name;
        }
        
        // Обновляем контент с подсветкой синтаксиса
        const content = this.modal.querySelector('#previewContent');
        if (content) {
            const code = content.querySelector('code');
            code.textContent = file.content;
            this.highlightSyntax(code, file.type);
        }
        
        // Показываем модальное окно
        this.modal.style.display = 'flex';
    }
    
    // Скрытие модального окна
    hide() {
        this.modal.style.display = 'none';
        this.currentFile = null;
    }
    
    // Копирование кода в буфер обмена
    async copyCode() {
        if (!this.currentFile) return;
        
        try {
            await navigator.clipboard.writeText(this.currentFile.content);
            this.showNotification('Код скопирован в буфер обмена', 'success');
        } catch (error) {
            console.error('Ошибка копирования:', error);
            this.showNotification('Ошибка копирования', 'error');
        }
    }
    
    // Скачивание файла
    downloadFile() {
        if (!this.currentFile) return;
        
        const blob = new Blob([this.currentFile.content], { 
            type: 'text/plain;charset=utf-8' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        a.href = url;
        a.download = `${this.currentFile.name}.${this.currentFile.type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Файл скачан', 'success');
    }
    
    // Подсветка синтаксиса (базовая реализация)
    highlightSyntax(codeElement, fileType) {
        const code = codeElement.textContent;
        
        // Простая подсветка для HTML
        if (fileType === 'html') {
            let highlighted = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/(&lt;\/?)([a-z][a-z0-9]*)/gi, '$1<span class="html-tag">$2</span>')
                .replace(/(\s[a-z-]+)=/gi, ' <span class="html-attr">$1</span>=')
                .replace(/(".*?")/g, '<span class="html-string">$1</span>');
            
            codeElement.innerHTML = highlighted;
        }
        // Подсветка для JavaScript
        else if (fileType === 'javascript') {
            const keywords = ['function', 'const', 'let', 'var', 'if', 'else', 'return', 
                             'for', 'while', 'class', 'export', 'import', 'async', 'await'];
            
            let highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            keywords.forEach(keyword => {
                const regex = new RegExp(`\\b${keyword}\\b`, 'g');
                highlighted = highlighted.replace(regex, `<span class="js-keyword">${keyword}</span>`);
            });
            
            // Подсветка строк
            highlighted = highlighted.replace(/(".*?"|'.*?')/g, '<span class="js-string">$1</span>');
            
            // Подсветка комментариев
            highlighted = highlighted.replace(/\/\/.*$/gm, '<span class="js-comment">$&</span>');
            highlighted = highlighted.replace(/\/\*[\s\S]*?\*\//g, '<span class="js-comment">$&</span>');
            
            codeElement.innerHTML = highlighted;
        }
        // Для других типов - просто экранируем HTML
        else {
            codeElement.innerHTML = code
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        }
        
        // Добавляем стили подсветки
        if (!document.querySelector('#syntax-styles')) {
            const style = document.createElement('style');
            style.id = 'syntax-styles';
            style.textContent = `
                .html-tag { color: #f87171; }
                .html-attr { color: #60a5fa; }
                .html-string { color: #34d399; }
                
                .js-keyword { color: #f472b6; font-weight: bold; }
                .js-string { color: #34d399; }
                .js-comment { color: #94a3b8; font-style: italic; }
                
                .css-selector { color: #f87171; }
                .css-property { color: #60a5fa; }
                .css-value { color: #34d399; }
                
                .python-keyword { color: #f472b6; }
                .python-string { color: #34d399; }
                .python-comment { color: #94a3b8; }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Показ уведомлений
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            border-radius: 8px;
            z-index: 10001;
            animation: slideUp 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
        
        // Добавляем стили анимации
        if (!document.querySelector('#preview-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'preview-notification-styles';
            style.textContent = `
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes slideDown {
                    from { transform: translateY(0); opacity: 1; }
                    to { transform: translateY(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Создаем глобальный экземпляр
const previewManager = new PreviewManager();

// Экспорт для использования
window.PreviewManager = previewManager;

// Добавляем слушатель для открытия предпросмотра
document.addEventListener('click', (e) => {
    // Если клик по кнопке просмотра в карточке файла
    if (e.target.closest('.view-btn')) {
        const card = e.target.closest('.file-card');
        if (card) {
            const fileId = card.dataset.id;
            const files = window.FileStorage.files;
            const file = files.find(f => f.id == fileId);
            
            if (file) {
                previewManager.show(file);
            }
        }
    }
});