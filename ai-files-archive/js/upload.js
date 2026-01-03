// Менеджер загрузки файлов
class UploadManager {
    constructor() {
        this.dropZone = null;
        this.fileInput = null;
        this.currentFiles = [];
        this.init();
    }
    
    init() {
        // Инициализация после загрузки DOM
        document.addEventListener('DOMContentLoaded', () => {
            this.setupElements();
            this.setupEventListeners();
        });
    }
    
    setupElements() {
        this.dropZone = document.getElementById('dropZone') || document.querySelector('.drop-zone');
        this.fileInput = document.getElementById('fileInput') || document.querySelector('input[type="file"]');
        this.browseBtn = document.getElementById('browseBtn') || document.querySelector('.browse-btn');
    }
    
    setupEventListeners() {
        if (this.dropZone) {
            // Drag & drop события
            this.dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.dropZone.classList.add('dragover');
            });
            
            this.dropZone.addEventListener('dragleave', () => {
                this.dropZone.classList.remove('dragover');
            });
            
            this.dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.dropZone.classList.remove('dragover');
                
                const files = Array.from(e.dataTransfer.files);
                this.handleFiles(files);
            });
            
            // Клик по зоне
            this.dropZone.addEventListener('click', () => {
                this.fileInput?.click();
            });
        }
        
        if (this.browseBtn) {
            this.browseBtn.addEventListener('click', () => {
                this.fileInput?.click();
            });
        }
        
        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
            });
        }
        
        // Форма сохранения
        const saveBtn = document.getElementById('saveFile');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveCurrentFile();
            });
        }
        
        // Очистка формы
        const clearBtn = document.getElementById('clearForm');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearForm();
            });
        }
    }
    
    // Обработка выбранных файлов
    async handleFiles(files) {
        if (!files.length) return;
        
        // Пока поддерживаем только первый файл
        const file = files[0];
        
        try {
            // Чтение файла
            const content = await this.readFile(file);
            
            // Автозаполнение формы
            this.populateForm(file, content);
            
            // Показать уведомление
            this.showNotification(`Файл "${file.name}" загружен`, 'success');
            
        } catch (error) {
            console.error('Ошибка загрузки файла:', error);
            this.showNotification('Ошибка загрузки файла', 'error');
        }
    }
    
    // Чтение файла как текста
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            
            if (file.type.startsWith('text/') || 
                file.name.endsWith('.html') ||
                file.name.endsWith('.js') ||
                file.name.endsWith('.css') ||
                file.name.endsWith('.json') ||
                file.name.endsWith('.txt') ||
                file.name.endsWith('.md')) {
                reader.readAsText(file);
            } else {
                reject(new Error('Неподдерживаемый тип файла'));
            }
        });
    }
    
    // Заполнение формы данными из файла
    populateForm(file, content) {
        // Название файла
        const nameInput = document.getElementById('fileName');
        if (nameInput) {
            const name = file.name.replace(/\.[^/.]+$/, "");
            nameInput.value = name;
        }
        
        // Тип файла
        const typeSelect = document.getElementById('fileType');
        if (typeSelect) {
            const extension = file.name.split('.').pop().toLowerCase();
            const typeMap = {
                'html': 'html',
                'js': 'javascript',
                'css': 'css',
                'py': 'python',
                'json': 'json',
                'txt': 'text',
                'md': 'markdown'
            };
            
            if (typeMap[extension]) {
                typeSelect.value = typeMap[extension];
            }
        }
        
        // Описание
        const descInput = document.getElementById('fileDescription');
        if (descInput) {
            const size = this.formatFileSize(file.size);
            descInput.value = `Файл ${file.name} (${size})`;
        }
        
        // Сохраняем контент в data-атрибут
        if (this.dropZone) {
            this.dropZone.dataset.fileContent = content;
        }
    }
    
    // Сохранение файла в хранилище
    saveCurrentFile() {
        const aiModel = document.getElementById('aiModel')?.value;
        const fileName = document.getElementById('fileName')?.value;
        const fileType = document.getElementById('fileType')?.value;
        const fileDescription = document.getElementById('fileDescription')?.value;
        const fileTags = document.getElementById('fileTags')?.value;
        
        if (!aiModel || !fileName) {
            this.showNotification('Заполните обязательные поля', 'error');
            return;
        }
        
        // Получаем контент файла
        const content = this.dropZone?.dataset.fileContent || 
                       `// Файл создан через AI Files Archive\n// Тип: ${fileType}\n\n`;
        
        // Подготавливаем данные
        const fileData = {
            name: fileName,
            description: fileDescription,
            ai: aiModel,
            type: fileType,
            content: content,
            tags: fileTags ? fileTags.split(',').map(t => t.trim()).filter(t => t) : [],
            date: new Date().toISOString().split('T')[0]
        };
        
        // Сохраняем через FileStorage
        const result = window.FileStorage.addFile(fileData);
        
        if (result.success) {
            this.showNotification('Файл успешно сохранен!', 'success');
            this.clearForm();
            
            // Обновляем интерфейс
            this.dispatchEvent('fileSaved', { file: result.file });
        } else {
            this.showNotification('Ошибка сохранения файла', 'error');
        }
    }
    
    // Очистка формы
    clearForm() {
        const form = document.querySelector('form');
        if (form) form.reset();
        
        if (this.dropZone) {
            delete this.dropZone.dataset.fileContent;
        }
        
        if (this.fileInput) {
            this.fileInput.value = '';
        }
    }
    
    // Форматирование размера файла
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Показ уведомлений
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Стили уведомления
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        // Добавляем стили анимации
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // События
    addEventListener(event, callback) {
        document.addEventListener(`uploadManager:${event}`, (e) => callback(e.detail));
    }
    
    dispatchEvent(event, detail) {
        document.dispatchEvent(new CustomEvent(`uploadManager:${event}`, { detail }));
    }
}

// Создаем глобальный экземпляр
const uploadManager = new UploadManager();

// Экспорт для использования
window.UploadManager = uploadManager;