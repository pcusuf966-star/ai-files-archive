// Менеджер хранилища файлов
class FileStorage {
    constructor() {
        this.storageKey = 'ai_files_storage';
        this.files = this.loadFiles();
    }
    
    // Загрузка файлов из LocalStorage
    loadFiles() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Ошибка загрузки файлов:', error);
        }
        return [];
    }
    
    // Сохранение файлов в LocalStorage
    saveFiles() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.files));
            return true;
        } catch (error) {
            console.error('Ошибка сохранения файлов:', error);
            return false;
        }
    }
    
    // Добавление нового файла
    addFile(file) {
        const newFile = {
            id: Date.now(),
            name: file.name || 'Без названия',
            description: file.description || '',
            ai: file.ai || 'other',
            type: file.type || 'text',
            content: file.content || '',
            tags: file.tags || [],
            date: file.date || new Date().toISOString().split('T')[0],
            size: this.calculateSize(file.content),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.files.unshift(newFile);
        const success = this.saveFiles();
        
        if (success) {
            this.dispatchEvent('storageUpdated', { files: this.files });
        }
        
        return { success, file: newFile };
    }
    
    // Удаление файла
    deleteFile(id) {
        const initialLength = this.files.length;
        this.files = this.files.filter(file => file.id !== id);
        
        if (this.files.length < initialLength) {
            this.saveFiles();
            this.dispatchEvent('storageUpdated', { files: this.files });
            return true;
        }
        
        return false;
    }
    
    // Поиск файлов
    searchFiles(query, filter = 'all') {
        const searchTerm = query.toLowerCase();
        
        return this.files.filter(file => {
            // Фильтрация по AI модели
            if (filter !== 'all' && file.ai !== filter) {
                return false;
            }
            
            // Поиск по всем полям
            const searchIn = `
                ${file.name}
                ${file.description}
                ${file.tags.join(' ')}
                ${file.type}
                ${file.ai}
            `.toLowerCase();
            
            return searchIn.includes(searchTerm);
        });
    }
    
    // Получение статистики
    getStats() {
        const stats = {
            total: this.files.length,
            chatgpt: 0,
            deepseek: 0,
            grok: 0,
            claude: 0,
            other: 0,
            byType: {},
            byDate: {}
        };
        
        this.files.forEach(file => {
            // По AI моделям
            if (stats[file.ai] !== undefined) {
                stats[file.ai]++;
            } else {
                stats.other++;
            }
            
            // По типам файлов
            stats.byType[file.type] = (stats.byType[file.type] || 0) + 1;
            
            // По датам
            stats.byDate[file.date] = (stats.byDate[file.date] || 0) + 1;
        });
        
        return stats;
    }
    
    // Экспорт данных
    exportData() {
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            files: this.files,
            stats: this.getStats()
        };
    }
    
    // Импорт данных
    importData(data) {
        if (data && Array.isArray(data.files)) {
            this.files = data.files;
            this.saveFiles();
            this.dispatchEvent('storageUpdated', { files: this.files });
            return true;
        }
        return false;
    }
    
    // Расчет размера
    calculateSize(content) {
        const bytes = new Blob([content]).size;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    
    // События
    addEventListener(event, callback) {
        document.addEventListener(`fileStorage:${event}`, (e) => callback(e.detail));
    }
    
    dispatchEvent(event, detail) {
        document.dispatchEvent(new CustomEvent(`fileStorage:${event}`, { detail }));
    }
}

// Создаем глобальный экземпляр
const fileStorage = new FileStorage();

// Экспорт для использования в других файлах
window.FileStorage = fileStorage;