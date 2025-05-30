import React, { useState, useEffect } from 'react';
import { Folder, File, FileText, FilePlus, FolderPlus, Trash, Edit, Menu, ChevronDown, ChevronRight } from 'lucide-react';
import fileSystem from './FileSystem'; // Импорт модуля файловой системы

// Улучшенный компонент проводника файлов
const FileExplorer = ({ onClose }) => {
  // Состояние для хранения структуры файлов
  const [fileSystemData, setFileSystemData] = useState(fileSystem.getFileSystem());

  // Текущая выбранная директория
  const [currentFolder, setCurrentFolder] = useState(null);
  
  // Выбранный файл/папка
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Состояние для контекстного меню
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    item: null
  });
  
  // Состояние для модальных окон
  const [modal, setModal] = useState({
    visible: false,
    type: null, // 'new-file', 'new-folder', 'rename', 'edit'
    item: null,
    name: '',
    content: ''
  });
  
  // Открытые папки в дереве
  const [expandedFolders, setExpandedFolders] = useState(['root']);
  
  // Функция для безопасного поиска элемента по ID
  const safelyFindItemById = (id) => {
    if (!id) return null;
    try {
      return fileSystem.findItemById(id);
    } catch (error) {
      console.error("Ошибка при поиске элемента:", error);
      return null;
    }
  };

  // Функция для безопасного поиска родительской папки
  const safelyFindParentFolder = (id) => {
    if (!id) return null;
    try {
      return fileSystem.findParentFolder(id);
    } catch (error) {
      console.error("Ошибка при поиске родительской папки:", error);
      return null;
    }
  };
  
  // Инициализация текущей папки
  useEffect(() => {
    if (!currentFolder) {
      setCurrentFolder(fileSystemData);
    }
  }, [currentFolder, fileSystemData]);
  
  // Загрузка обновленных данных при монтировании компонента
  useEffect(() => {
    const loadInitialData = () => {
      try {
        const fsData = fileSystem.getFileSystem();
        setFileSystemData({...fsData});
        setCurrentFolder({...fsData});
      } catch (error) {
        console.error("Ошибка при загрузке файловой системы:", error);
      }
    };
    
    loadInitialData();
    
    // Обработчик для восстановления состояния после изменений в localStorage
    const handleStorageChange = (e) => {
      if (e.key === 'virtualFileSystem') {
        loadInitialData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Обработчик изменений в файловой системе
  const handleFileSystemChange = () => {
    // Обновляем состояние всей файловой системы
    const updatedFileSystem = fileSystem.getFileSystem();
    setFileSystemData({...updatedFileSystem});
    
    // Обновляем текущую папку, если она существует
    if (currentFolder) {
      const updatedFolder = safelyFindItemById(currentFolder.id);
      if (updatedFolder) {
        setCurrentFolder({...updatedFolder});
      } else {
        // Если текущая папка была удалена, вернуться к корню
        setCurrentFolder({...updatedFileSystem});
      }
    } else {
      // Если текущая папка не установлена, используем корень
      setCurrentFolder({...updatedFileSystem});
    }
    
    // Обновляем выбранный элемент, если он существует
    if (selectedItem) {
      const updatedItem = safelyFindItemById(selectedItem.id);
      // Если элемент был удален, это установит null
      setSelectedItem(updatedItem ? {...updatedItem} : null);
    }
  };
  
  // Эффект для закрытия контекстного меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);
  
  // Обработчик клика по папке в дереве
  const handleFolderClick = (folder) => {
    setCurrentFolder(folder);
    setSelectedItem(null);
  };
  
  // Обработчик клика по файлу/папке в основной панели
  const handleItemClick = (item, event) => {
    event.stopPropagation();
    setSelectedItem(item);
  };
  
  // Обработчик двойного клика
  const handleItemDoubleClick = (item, event) => {
    event.stopPropagation();
    
    if (item.type === 'folder') {
      setCurrentFolder(item);
    } else if (item.type === 'file') {
      openFileEditor(item);
    }
  };
  
  // Открыть редактор файла
  const openFileEditor = (file) => {
    if (!file) {
      console.warn("Попытка открыть недействительный файл");
      return;
    }
    
    // Проверяем, что файл все еще существует в файловой системе
    const existingFile = safelyFindItemById(file.id);
    if (!existingFile) {
      console.warn(`Файл с ID ${file.id} не найден в файловой системе`);
      alert("Файл не найден. Возможно, он был удален.");
      handleFileSystemChange();
      return;
    }
    
    if (existingFile.type !== 'file') {
      console.warn(`Элемент с ID ${file.id} не является файлом`);
      alert("Выбранный элемент не является файлом.");
      return;
    }
    
    setModal({
      visible: true,
      type: 'edit',
      item: existingFile,
      name: existingFile.name,
      content: existingFile.content || ''
    });
  };
  
  // Обработчик контекстного меню
  const handleContextMenu = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item: item
    });
    
    // Выбираем элемент по которому был вызван контекст
    setSelectedItem(item);
  };
  
  // Создание новой папки
  const createNewFolder = () => {
    if (!currentFolder) {
      console.warn("Не выбрана текущая папка для создания новой папки");
      return;
    }
    
    // Проверка, что текущая папка существует и является папкой
    const folder = safelyFindItemById(currentFolder.id);
    if (!folder) {
      console.warn(`Папка с ID ${currentFolder.id} не найдена`);
      alert("Текущая папка не найдена. Обновление...");
      handleFileSystemChange();
      return;
    }
    
    if (folder.type !== 'folder') {
      console.warn(`Элемент с ID ${currentFolder.id} не является папкой`);
      alert("Выбранный элемент не является папкой");
      return;
    }

    setModal({
      visible: true,
      type: 'new-folder',
      item: folder,
      name: 'Новая папка',
      content: ''
    });
  };
  
  // Создание нового файла
  const createNewFile = () => {
    if (!currentFolder) {
      console.warn("Не выбрана текущая папка для создания файла");
      return;
    }
    
    // Проверка, что текущая папка существует и является папкой
    const folder = safelyFindItemById(currentFolder.id);
    if (!folder) {
      console.warn(`Папка с ID ${currentFolder.id} не найдена`);
      alert("Текущая папка не найдена. Обновление...");
      handleFileSystemChange();
      return;
    }
    
    if (folder.type !== 'folder') {
      console.warn(`Элемент с ID ${currentFolder.id} не является папкой`);
      alert("Выбранный элемент не является папкой");
      return;
    }

    setModal({
      visible: true,
      type: 'new-file',
      item: folder,
      name: 'Новый файл.txt',
      content: ''
    });
  };
  
  // Переименование элемента
  const renameItem = (item) => {
    if (!item || !item.id) {
      console.warn("Попытка переименовать недействительный элемент");
      return;
    }
    
    // Проверяем, что элемент все еще существует в файловой системе
    const existingItem = safelyFindItemById(item.id);
    if (!existingItem) {
      console.warn(`Элемент с ID ${item.id} не найден в файловой системе`);
      alert("Элемент не найден для переименования. Возможно, он был удален.");
      handleFileSystemChange();
      return;
    }

    setModal({
      visible: true,
      type: 'rename',
      item: existingItem,
      name: existingItem.name,
      content: existingItem.content || ''
    });
  };
  
  // Безопасная обработка операции удаления
  const deleteItem = (item) => {
    if (!item || !item.id) {
      console.warn("Попытка удалить недействительный элемент");
      return;
    }

    try {
      // Проверка, что элемент все еще существует в файловой системе
      const existingItem = safelyFindItemById(item.id);
      if (!existingItem) {
        console.warn(`Элемент с ID ${item.id} не найден в файловой системе`);
        handleFileSystemChange(); // Обновляем UI, чтобы отразить текущее состояние
        return;
      }

      // Проверка, что у элемента есть родитель
      const parent = safelyFindParentFolder(item.id);
      if (!parent) {
        console.warn(`Родительская папка для элемента с ID ${item.id} не найдена`);
        handleFileSystemChange();
        return;
      }

      fileSystem.deleteItem(item.id);
      handleFileSystemChange();
    } catch (error) {
      console.error('Ошибка при удалении элемента:', error);
      alert('Не удалось удалить элемент: ' + error.message);
    }
  };
  
  // Сохранение данных из модального окна
  const saveModal = () => {
    const { type, item, name, content } = modal;
    
    // Если имя пустое, игнорируем
    if (!name.trim()) {
      alert('Имя не может быть пустым!');
      return;
    }
    
    // Проверка существования элемента и родительской папки
    if ((type === 'rename' || type === 'edit') && !safelyFindItemById(item?.id)) {
      alert('Элемент для редактирования не найден!');
      setModal({ ...modal, visible: false });
      handleFileSystemChange();
      return;
    }
    
    if ((type === 'new-folder' || type === 'new-file') && !safelyFindItemById(item?.id)) {
      alert('Родительская папка не найдена!');
      setModal({ ...modal, visible: false });
      handleFileSystemChange();
      return;
    }
    
    try {
      switch (type) {
        case 'new-folder': 
          fileSystem.createFolder(item.id, name);
          break;
          
        case 'new-file':
          fileSystem.createFile(item.id, name, content);
          break;
          
        case 'rename':
          fileSystem.renameItem(item.id, name);
          break;
          
        case 'edit':
          fileSystem.renameItem(item.id, name);
          fileSystem.editFileContent(item.id, content);
          break;
        
        default:
          console.warn(`Неизвестный тип операции: ${type}`);
          break;
      }
      
      // Обновляем данные файловой системы
      handleFileSystemChange();
      
      // Закрываем модальное окно
      setModal({ ...modal, visible: false });
      
    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      alert('Не удалось сохранить: ' + error.message);
    }
  };
  
  // Переключение состояния раскрытия папки в дереве
  const toggleFolder = (folderId, event) => {
    event.stopPropagation();
    
    if (expandedFolders.includes(folderId)) {
      setExpandedFolders(expandedFolders.filter(id => id !== folderId));
    } else {
      setExpandedFolders([...expandedFolders, folderId]);
    }
  };
  
  // Отображение пути текущей директории
  const renderBreadcrumbs = () => {
    if (!currentFolder) return null;
    
    // Строим путь от корня до текущей папки
    const buildPath = (folder, path = []) => {
      if (folder.id === 'root') {
        return ['root', ...path];
      }
      
      const parent = safelyFindParentFolder(folder.id);
      if (!parent) {
        return ['root', ...path];
      }
      
      return buildPath(parent, [folder.id, ...path]);
    };
    
    // Получаем путь в виде массива ID папок
    const pathIds = buildPath(currentFolder).filter(id => id !== 'root');
    
    return (
      <div className="explorer-breadcrumbs">
        <span 
          className="breadcrumb-item"
          onClick={() => handleFolderClick(fileSystemData)}
        >
          Мой компьютер
        </span>
        
        {pathIds.map((id, index) => {
          const folder = safelyFindItemById(id);
          if (!folder) return null;
          
          return (
            <React.Fragment key={id}>
              <span className="breadcrumb-separator">/</span>
              <span 
                className="breadcrumb-item"
                onClick={() => handleFolderClick(folder)}
              >
                {folder.name}
              </span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };
  const renderFolderTree = (folder, level = 0) => {
    if (!folder) return null;
    
    const isExpanded = expandedFolders.includes(folder.id);
    const isActive = currentFolder && currentFolder.id === folder.id;
    
    return (
      <li key={folder.id} className="folder-tree-item">
        <div 
          className={`folder-tree-item-content ${isActive ? 'active' : ''}`}
          onClick={() => handleFolderClick(folder)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
        >
          {folder.type === 'folder' && folder.children && folder.children.length > 0 ? (
            <span onClick={(e) => toggleFolder(folder.id, e)} className="tree-toggle">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          ) : (
            <span className="tree-toggle-placeholder"></span>
          )}
          <Folder size={16} className="folder-icon" />
          <span className="tree-item-name">{folder.name}</span>
        </div>
        
        {folder.type === 'folder' && folder.children && folder.children.length > 0 && isExpanded && (
          <ul className="folder-tree-children">
            {folder.children
              .filter(child => child.type === 'folder')
              .map(childFolder => renderFolderTree(childFolder, level + 1))}
          </ul>
        )}
      </li>
    );
  };
  
  // Обработчик клика на пустое место в проводнике
  const handleExplorerClick = () => {
    setSelectedItem(null);
  };
  
  return (
    <div className="explorer-window" onClick={handleExplorerClick}>
      <div className="explorer-toolbar">
        <button className="explorer-button" onClick={createNewFolder}>
          <FolderPlus size={16} />
          <span>Новая папка</span>
        </button>
        <button className="explorer-button" onClick={createNewFile}>
          <FilePlus size={16} />
          <span>Новый файл</span>
        </button>
        {selectedItem && (
          <>
            <button 
              className="explorer-button"
              onClick={() => renameItem(selectedItem)}
            >
              <Edit size={16} />
              <span>Переименовать</span>
            </button>
            <button 
              className="explorer-button explorer-button-danger"
              onClick={() => deleteItem(selectedItem)}
            >
              <Trash size={16} />
              <span>Удалить</span>
            </button>
          </>
        )}
      </div>
      
      <div className="explorer-content">
        <div className="explorer-sidebar">
          <div className="folder-tree-header">Папки</div>
          <ul className="folder-tree">
            {renderFolderTree(fileSystemData)}
          </ul>
        </div>
        
        <div className="explorer-main">
          <div className="explorer-path">
            {currentFolder && (
              <>
                <h3 className="current-folder-name">{currentFolder.name}</h3>
                {renderBreadcrumbs()}
              </>
            )}
          </div>
          
          <div className="file-grid" onClick={(e) => e.stopPropagation()}>
            {currentFolder && currentFolder.children && currentFolder.children.length > 0 ? (
              currentFolder.children.map(item => (
                <div 
                  key={item.id}
                  className={`file-item ${selectedItem && selectedItem.id === item.id ? 'selected' : ''}`}
                  onClick={(e) => handleItemClick(item, e)}
                  onDoubleClick={(e) => handleItemDoubleClick(item, e)}
                  onContextMenu={(e) => handleContextMenu(e, item)}
                >
                  <div className="file-icon">
                    {item.type === 'folder' ? <Folder size={32} /> : <FileText size={32} />}
                  </div>
                  <div className="file-name">{item.name}</div>
                </div>
              ))
            ) : (
              <div className="empty-folder-message">
                Эта папка пуста
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Контекстное меню */}
      {contextMenu.visible && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item && contextMenu.item.type === 'file' && (
            <div className="context-menu-item" onClick={() => { openFileEditor(contextMenu.item); setContextMenu({ ...contextMenu, visible: false }); }}>
              <Edit size={16} />
              <span>Открыть</span>
            </div>
          )}
          <div className="context-menu-item" onClick={() => { renameItem(contextMenu.item); setContextMenu({ ...contextMenu, visible: false }); }}>
            <Edit size={16} />
            <span>Переименовать</span>
          </div>
          <div className="context-menu-item context-menu-item-danger" onClick={() => { deleteItem(contextMenu.item); setContextMenu({ ...contextMenu, visible: false }); }}>
            <Trash size={16} />
            <span>Удалить</span>
          </div>
        </div>
      )}
      
      {/* Модальное окно */}
      {modal.visible && (
        <div className="dialog-overlay" onClick={() => setModal({ ...modal, visible: false })}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">
              {modal.type === 'new-folder' && 'Создать новую папку'}
              {modal.type === 'new-file' && 'Создать новый файл'}
              {modal.type === 'rename' && 'Переименовать'}
              {modal.type === 'edit' && modal.item.name}
            </div>
            
            <div className="dialog-content">
              <div className="dialog-field">
                <label>Название:</label>
                <input 
                  type="text" 
                  className="dialog-input" 
                  value={modal.name}
                  onChange={(e) => setModal({ ...modal, name: e.target.value })}
                  autoFocus
                />
              </div>
              
              {(modal.type === 'new-file' || modal.type === 'edit') && (
                <div className="dialog-field">
                  <label>Содержимое:</label>
                  <textarea 
                    className="file-content-editor" 
                    value={modal.content}
                    onChange={(e) => setModal({ ...modal, content: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            <div className="dialog-actions">
              <button 
                className="dialog-button dialog-button-secondary"
                onClick={() => setModal({ ...modal, visible: false })}
              >
                Отмена
              </button>
              <button 
                className="dialog-button dialog-button-primary"
                onClick={saveModal}
              >
                {modal.type === 'edit' ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;