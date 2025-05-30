// FileSystem.js - отдельный модуль для работы с файловой системой
class FileSystemManager {
  constructor() {
    // Исходная структура файлов
    this.initialFileSystem = {
      id: 'root',
      name: 'Мой компьютер',
      type: 'folder',
      children: [
        {
          id: 'documents',
          name: 'Документы',
          type: 'folder',
          children: [
            {
              id: 'doc1',
              name: 'Важный документ.txt',
              type: 'file',
              content: 'Это содержимое важного документа'
            },
            {
              id: 'doc2',
              name: 'Заметки.txt',
              type: 'file',
              content: 'Список дел:\n- Сделать проект\n- Проверить почту\n- Позвонить'
            }
          ]
        },
        {
          id: 'pictures',
          name: 'Изображения',
          type: 'folder',
          children: []
        },
        {
          id: 'downloads',
          name: 'Загрузки',
          type: 'folder',
          children: [
            {
              id: 'download1',
              name: 'Инструкция.txt',
              type: 'file',
              content: 'Инструкция по использованию виртуального рабочего стола'
            }
          ]
        },
        {
          id: 'readme',
          name: 'README.txt',
          type: 'file',
          content: 'Добро пожаловать в виртуальный проводник файлов!'
        }
      ]
    };
    
    // Загрузка сохраненной файловой системы или использование начальной
    this.fileSystem = this.loadFileSystem();
  }
  
  // Загрузка файловой системы из localStorage
  loadFileSystem() {
    try {
      const savedFileSystem = localStorage.getItem('virtualFileSystem');
      if (savedFileSystem) {
        return JSON.parse(savedFileSystem);
      }
    } catch (e) {
      console.error('Ошибка при загрузке файловой системы:', e);
    }
    
    return this.initialFileSystem;
  }
  
  // Сохранение файловой системы в localStorage
  saveFileSystem() {
    try {
      localStorage.setItem('virtualFileSystem', JSON.stringify(this.fileSystem));
      return true;
    } catch (e) {
      console.error('Ошибка при сохранении файловой системы:', e);
      return false;
    }
  }
  
  // Получение всей файловой системы
  getFileSystem() {
    return this.fileSystem;
  }
  
  // Сброс файловой системы к начальному состоянию
  resetFileSystem() {
    this.fileSystem = JSON.parse(JSON.stringify(this.initialFileSystem));
    this.saveFileSystem();
    return this.fileSystem;
  }
  
  // Поиск элемента по ID
  findItemById(id, root = this.fileSystem) {
    if (!id) return null;
    
    if (root.id === id) {
      return root;
    }
    
    if (root.type === 'folder' && root.children) {
      for (const child of root.children) {
        const found = this.findItemById(id, child);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  // Поиск родительской папки элемента
  findParentFolder(id, root = this.fileSystem, parent = null) {
    if (!id) return null;
    
    if (root.id === id) {
      return parent;
    }
    
    if (root.type === 'folder' && root.children) {
      for (const child of root.children) {
        if (child.id === id) return root;
        
        const found = this.findParentFolder(id, child, root);
        if (found) return found;
      }
    }
    
    return null;
  }
  
  // Создание новой папки
  createFolder(parentId, folderName) {
    const parent = this.findItemById(parentId);
    
    if (!parent || parent.type !== 'folder') {
      throw new Error('Родительская папка не найдена или не является папкой');
    }
    
    const newFolder = {
      id: 'folder_' + Date.now(),
      name: folderName.trim(),
      type: 'folder',
      children: []
    };
    
    if (!parent.children) {
      parent.children = [];
    }
    
    parent.children.push(newFolder);
    this.saveFileSystem();
    
    return newFolder;
  }
  
  // Создание нового файла
  createFile(parentId, fileName, content = '') {
    const parent = this.findItemById(parentId);
    
    if (!parent || parent.type !== 'folder') {
      throw new Error('Родительская папка не найдена или не является папкой');
    }
    
    const newFile = {
      id: 'file_' + Date.now(),
      name: fileName.trim(),
      type: 'file',
      content: content
    };
    
    if (!parent.children) {
      parent.children = [];
    }
    
    parent.children.push(newFile);
    this.saveFileSystem();
    
    return newFile;
  }
  
  // Переименование элемента
  renameItem(id, newName) {
    const item = this.findItemById(id);
    
    if (!item) {
      throw new Error('Элемент не найден');
    }
    
    item.name = newName.trim();
    this.saveFileSystem();
    
    return item;
  }
  
  // Редактирование содержимого файла
  editFileContent(id, newContent) {
    const file = this.findItemById(id);
    
    if (!file || file.type !== 'file') {
      throw new Error('Файл не найден или элемент не является файлом');
    }
    
    file.content = newContent;
    this.saveFileSystem();
    
    return file;
  }
  
  // Удаление элемента
  deleteItem(id) {
    if (!id) {
      throw new Error('Не указан ID элемента для удаления');
    }
    
    if (id === 'root') {
      throw new Error('Нельзя удалить корневую папку');
    }
    
    const parent = this.findParentFolder(id);
    
    if (!parent) {
      throw new Error(`Родительская папка для элемента ${id} не найдена`);
    }
    
    if (!parent.children) {
      throw new Error(`У родительской папки ${parent.id} нет дочерних элементов`);
    }
    
    const index = parent.children.findIndex(child => child.id === id);
    
    if (index === -1) {
      throw new Error(`Элемент ${id} не найден в родительской папке ${parent.id}`);
    }
    
    const removedItem = parent.children.splice(index, 1)[0];
    this.saveFileSystem();
    
    return removedItem;
  }
  
  // Перемещение элемента в другую папку
  moveItem(id, newParentId) {
    if (id === 'root') {
      throw new Error('Нельзя переместить корневую папку');
    }
    
    // Проверка циклических зависимостей при перемещении папки
    if (this.isChildFolder(id, newParentId)) {
      throw new Error('Нельзя переместить папку внутрь её дочерней папки');
    }
    
    const item = this.findItemById(id);
    const currentParent = this.findParentFolder(id);
    const newParent = this.findItemById(newParentId);
    
    if (!item) {
      throw new Error('Элемент не найден');
    }
    
    if (!currentParent || !currentParent.children) {
      throw new Error('Текущая родительская папка не найдена');
    }
    
    if (!newParent || newParent.type !== 'folder') {
      throw new Error('Новая родительская папка не найдена или не является папкой');
    }
    
    // Удаление элемента из текущей родительской папки
    const index = currentParent.children.findIndex(child => child.id === id);
    
    if (index === -1) {
      throw new Error('Элемент не найден в текущей родительской папке');
    }
    
    const removedItem = currentParent.children.splice(index, 1)[0];
    
    // Добавление элемента в новую родительскую папку
    if (!newParent.children) {
      newParent.children = [];
    }
    
    newParent.children.push(removedItem);
    this.saveFileSystem();
    
    return {
      item: removedItem,
      fromParent: currentParent,
      toParent: newParent
    };
  }
  
  // Проверка, является ли одна папка дочерней по отношению к другой
  isChildFolder(parentId, childId) {
    const child = this.findItemById(childId);
    
    if (!child || child.type !== 'folder') {
      return false;
    }
    
    if (childId === parentId) {
      return true;
    }
    
    // Рекурсивная проверка для всех дочерних папок
    if (child.children) {
      for (const grandchild of child.children) {
        if (grandchild.type === 'folder' && this.isChildFolder(parentId, grandchild.id)) {
          return true;
        }
      }
    }
    
    return false;
  }
  
  // Копирование элемента
  copyItem(id, newParentId) {
    const item = this.findItemById(id);
    const newParent = this.findItemById(newParentId);
    
    if (!item) {
      throw new Error('Элемент не найден');
    }
    
    if (!newParent || newParent.type !== 'folder') {
      throw new Error('Новая родительская папка не найдена или не является папкой');
    }
    
    // Создание глубокой копии элемента с новым ID
    const copiedItem = JSON.parse(JSON.stringify(item));
    copiedItem.id = item.type + '_copy_' + Date.now();
    
    // Рекурсивное обновление ID всех дочерних элементов
    if (copiedItem.type === 'folder') {
      this.updateIds(copiedItem);
    }
    
    // Добавление копии в новую родительскую папку
    if (!newParent.children) {
      newParent.children = [];
    }
    
    newParent.children.push(copiedItem);
    this.saveFileSystem();
    
    return copiedItem;
  }
  
  // Рекурсивное обновление ID всех элементов в папке
  updateIds(folder) {
    if (!folder.children || folder.children.length === 0) {
      return;
    }
    
    for (const child of folder.children) {
      child.id = child.type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      
      if (child.type === 'folder') {
        this.updateIds(child);
      }
    }
  }
  
  // Поиск элементов по имени (полнотекстовый поиск)
  searchItems(query, root = this.fileSystem, results = []) {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const lowerQuery = query.toLowerCase().trim();
    
    // Проверка текущего элемента
    if (root.name.toLowerCase().includes(lowerQuery)) {
      results.push(root);
    }
    
    // Проверка содержимого файла
    if (root.type === 'file' && root.content && 
        root.content.toLowerCase().includes(lowerQuery)) {
      // Добавляем только если элемент еще не в результатах
      if (!results.find(item => item.id === root.id)) {
        results.push(root);
      }
    }
    
    // Рекурсивный поиск в дочерних элементах
    if (root.type === 'folder' && root.children) {
      for (const child of root.children) {
        this.searchItems(query, child, results);
      }
    }
    
    return results;
  }
  
  // Получение статистики по файловой системе
  getStatistics() {
    let totalFolders = 0;
    let totalFiles = 0;
    let totalSize = 0; // размер в символах
    
    const countItems = (item) => {
      if (item.type === 'folder') {
        totalFolders++;
        if (item.children) {
          item.children.forEach(countItems);
        }
      } else if (item.type === 'file') {
        totalFiles++;
        totalSize += (item.content ? item.content.length : 0);
      }
    };
    
    countItems(this.fileSystem);
    
    // Не считаем корневую папку
    totalFolders--;
    
    return {
      folders: totalFolders,
      files: totalFiles,
      size: totalSize,
      lastUpdated: new Date().toISOString()
    };
  }
}

// Экспорт файловой системы как синглтона
const fileSystemInstance = new FileSystemManager();
export default fileSystemInstance;