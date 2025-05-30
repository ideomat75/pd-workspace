import React, { useEffect, useRef, useCallback } from 'react';
import './Terminal.css';
import './Terminal_new.css';

const TerminalComponent = () => {
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddonInstance = useRef(null);
  
  // История команд и текущая команда
  const commandHistory = useRef([]);
  const historyIndex = useRef(-1);
  const currentCommand = useRef('');
  
  // Текущая директория и переменные окружения
  const currentDir = useRef('/home/user');
  const env = useRef({
    'HOME': '/home/user',
    'USER': 'user',
    'HOSTNAME': 'react-terminal',
    'PATH': '/usr/local/bin:/usr/bin:/bin',
    'SHELL': '/bin/bash',
    'TERM': 'xterm-256color',
    'PWD': '/home/user',
    'LANG': 'en_US.UTF-8'
  });

  // Простая файловая система
  const fileSystem = useRef({
    '/': {
      type: 'dir',
      contents: {
        'home': {
          type: 'dir',
          contents: {
            'user': {
              type: 'dir',
              contents: {
                'documents': {
                  type: 'dir',
                  contents: {
                    'readme.txt': {
                      type: 'file',
                      content: 'Это пример текстового файла в виртуальной файловой системе.'
                    }
                  }
                },
                'downloads': {
                  type: 'dir',
                  contents: {}
                }
              }
            }
          }
        },
        'etc': {
          type: 'dir',
          contents: {
            'hosts': {
              type: 'file',
              content: '127.0.0.1 localhost\n::1 localhost'
            }
          }
        },
        'var': {
          type: 'dir',
          contents: {
            'log': {
              type: 'dir',
              contents: {}
            }
          }
        }
      }
    }
  });

useEffect(() => {
  let mounted = true; // <-- только один раз
  let loadingInterval;
  const controller = new AbortController();
    // Асинхронная функция для загрузки и инициализации терминала
    const loadAndInitTerminal = async () => {
      try {
        // Импортируем нужные модули
        const { Terminal } = await import('xterm');
        const { FitAddon } = await import('xterm-addon-fit');
        
        // Если компонент уже размонтирован, выходим
        if (!mounted || !terminalRef.current) return;
        
        // Создаем терминал с настройками
        const terminal = new Terminal({
          cursorBlink: true,
          fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
          fontSize: 14,
          lineHeight: 1.2,
          theme: {
            background: '#1a1b26',
            foreground: '#c0caf5',
            cursor: '#c0caf5',
            selection: 'rgba(255, 255, 255, 0.3)',
            black: '#414868',
            red: '#f7768e',
            green: '#9ece6a',
            yellow: '#e0af68',
            blue: '#7aa2f7',
            magenta: '#bb9af7',
            cyan: '#7dcfff',
            white: '#a9b1d6',
            brightBlack: '#414868',
            brightRed: '#f7768e',
            brightGreen: '#9ece6a',
            brightYellow: '#e0af68',
            brightBlue: '#7aa2f7',
            brightMagenta: '#bb9af7',
            brightCyan: '#7dcfff',
            brightWhite: '#c0caf5'
          },
          allowTransparency: true,
          scrollback: 1000
        });
        
        // Сохраняем ссылку на терминал
        terminalInstance.current = terminal;
        
        // Загружаем CSS
        await import('xterm/css/xterm.css');
        
        // Создаем FitAddon
        const fitAddon = new FitAddon();
        fitAddonInstance.current = fitAddon;
        
        terminal.loadAddon(fitAddon);
        
        // Открываем терминал
        terminal.open(terminalRef.current);
        
        // Подгоняем размер
        setTimeout(() => {
          if (mounted && fitAddon) {
            try {
              fitAddon.fit();
            } catch (e) {
              console.warn('Ошибка при подгонке размера:', e);
            }
          }
        }, 100);
        
        // Приветственное сообщение
        terminal.writeln('\x1b[1;32m┌─────────────────────────────────────────────────┐\x1b[0m');
        terminal.writeln('\x1b[1;32m│   \x1b[1;36mLinux-подобный Терминал v1.0               \x1b[1;32m│\x1b[0m');
        terminal.writeln('\x1b[1;32m└─────────────────────────────────────────────────┘\x1b[0m');
        terminal.writeln('\x1b[1;34mИнициализация системы...\x1b[0m');
        terminal.writeln('\x1b[1;32m[OK]\x1b[0m Виртуальная файловая система загружена');
        terminal.writeln('\x1b[1;32m[OK]\x1b[0m Поддержка HTTP запросов активирована');
        terminal.writeln('\x1b[1;32m[OK]\x1b[0m Система готова к работе');
        terminal.writeln('');
        terminal.writeln('\x1b[1;33mВведите \x1b[1;37mhelp\x1b[1;33m для списка доступных команд\x1b[0m');
        
        // Отображаем промпт в стиле Linux
        writePrompt(terminal);
        
        // Обработка ввода
        setupInputHandling(terminal);
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
          if (fitAddonInstance.current) {
            try {
              fitAddonInstance.current.fit();
            } catch (e) {
              console.warn('Ошибка при изменении размера:', e);
            }
          }
        });
      } catch (error) {
        console.error('Ошибка инициализации терминала:', error);
      }
    };
    
    loadAndInitTerminal();
    
    return () => {
      mounted = false;
      window.removeEventListener('resize', () => {});
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, []);

  // Функция вывода промпта в стиле Linux
const writePrompt = useCallback((term) => {
  const username = env.current.USER;
  const hostname = env.current.HOSTNAME;
  const path = currentDir.current.replace(env.current.HOME, '~');
  term.write(`\x1b[1;32m${username}@${hostname}\x1b[0m:\x1b[1;34m${path}\x1b[0m$ `);
}, [env.current, currentDir.current]); // Добавьте зависимости

  // Получение пути к объекту в файловой системе
  const getObjectByPath = (path) => {
    // Обработка '~' и относительных путей
    let fullPath = path;
    if (path.startsWith('~')) {
      fullPath = env.current.HOME + path.slice(1);
    } else if (!path.startsWith('/')) {
      fullPath = currentDir.current === '/' 
        ? '/' + path 
        : currentDir.current + '/' + path;
    }
    
    // Упрощение пути (удаление . и ..)
    const parts = fullPath.split('/').filter(Boolean);
    const resolvedParts = [];
    
    for (const part of parts) {
      if (part === '..') {
        resolvedParts.pop();
      } else if (part !== '.') {
        resolvedParts.push(part);
      }
    }
    
    // Получение объекта из файловой системы
    let current = fileSystem.current['/'];
    
    if (fullPath === '/') {
      return { obj: current, path: '/' };
    }
    
    for (const part of resolvedParts) {
      if (!current || current.type !== 'dir' || !current.contents[part]) {
        return null;
      }
      current = current.contents[part];
    }
    
    return { obj: current, path: '/' + resolvedParts.join('/') };
  };

// Обработка команд
  const processCommand = (input, term) => {
    if (!input) return true;

    // Разбиваем строку на команду и аргументы
    // Учитываем кавычки для аргументов с пробелами
    const parts = [];
    let current = '';
    let inQuotes = false;
    let escapeNext = false;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];

      if (escapeNext) {
        current += char;
        escapeNext = false;
      } else if (char === '\\') {
        escapeNext = true;
      } else if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ' ' && !inQuotes) {
        if (current) {
          parts.push(current);
          current = '';
        }
      } else {
        current += char;
      }
    }

    if (current) {
      parts.push(current);
    }

    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Проверка на переменные окружения в команде
    const expandedArgs = args.map(arg => {
      if (arg.startsWith('$')) {
        const varName = arg.substring(1);
        return env.current[varName] || '';
      }
      return arg;
    });

    // Обработка команд
    switch (command) {
      case 'help':
        term.writeln('\x1b[1;36m╭───────────────────────────────────────────────╮\x1b[0m');
        term.writeln('\x1b[1;36m│          \x1b[1;33mДоступные команды:               \x1b[1;36m│\x1b[0m');
        term.writeln('\x1b[1;36m╰───────────────────────────────────────────────╯\x1b[0m');
        term.writeln('\x1b[1;33mhelp\x1b[0m              - Список команд');
        term.writeln('\x1b[1;33mclear\x1b[0m             - Очистить экран (также Ctrl+L)');
        term.writeln('\x1b[1;33mecho [текст]\x1b[0m      - Вывести текст');
        term.writeln('\x1b[1;33mpwd\x1b[0m               - Показать текущую директорию');
        term.writeln('\x1b[1;33mls [путь]\x1b[0m         - Список файлов в директории');
        term.writeln('\x1b[1;33mcd [путь]\x1b[0m         - Сменить директорию');
        term.writeln('\x1b[1;33mcat [файл]\x1b[0m        - Показать содержимое файла');
        term.writeln('\x1b[1;33mtouch [файл]\x1b[0m      - Создать пустой файл');
        term.writeln('\x1b[1;33mmkdir [директория]\x1b[0m - Создать директорию');
        term.writeln('\x1b[1;33mwhoami\x1b[0m            - Показать имя пользователя');
        term.writeln('\x1b[1;33mhostname\x1b[0m          - Показать имя хоста');
        term.writeln('\x1b[1;33mdate\x1b[0m              - Показать текущую дату и время');
        term.writeln('\x1b[1;33menv\x1b[0m               - Показать переменные окружения');
        term.writeln('\x1b[1;33mexport NAME=VALUE\x1b[0m - Установить переменную окружения');
        term.writeln('\x1b[1;33mcurl [URL] [опции]\x1b[0m - Отправить HTTP запрос');
        term.writeln('  \x1b[1;33m-X, --request\x1b[0m METHOD - Задать метод запроса (GET, POST, etc.)');
        term.writeln('  \x1b[1;33m-H, --header\x1b[0m "Name: Value" - Добавить заголовок');
        term.writeln('  \x1b[1;33m-d, --data\x1b[0m "data" - Отправить данные в теле запроса');
        term.writeln('  \x1b[1;33m--json\x1b[0m "{\\"key\\":\\"value\\"}" - Отправить JSON в теле запроса');
        term.writeln('\x1b[1;33mexit\x1b[0m              - Закрыть терминал');
        break;

      case 'clear':
        term.clear();
        break;

      case 'echo':
        const output = expandedArgs.join(' ');
        term.writeln(output);
        break;

      case 'pwd':
        term.writeln(currentDir.current);
        break;

      case 'cd':
        if (expandedArgs.length === 0) {
          // cd без аргументов переходит в домашний каталог
          currentDir.current = env.current.HOME;
          break;
        }

        const targetPath = expandedArgs[0];
        const target = getObjectByPath(targetPath);

        if (!target) {
          term.writeln(`\x1b[1;31mcd: ${targetPath}: Нет такого файла или каталога\x1b[0m`);
        } else if (target.obj.type !== 'dir') {
          term.writeln(`\x1b[1;31mcd: ${targetPath}: Не является каталогом\x1b[0m`);
        } else {
          currentDir.current = target.path;
          env.current.PWD = target.path;
        }
        break;

      case 'ls':
        let pathToList = currentDir.current;

        if (expandedArgs.length > 0) {
          const target = getObjectByPath(expandedArgs[0]);
          if (!target) {
            term.writeln(`\x1b[1;31mls: ${expandedArgs[0]}: Нет такого файла или каталога\x1b[0m`);
            break;
          }

          if (target.obj.type !== 'dir') {
            term.writeln(expandedArgs[0]);
            break;
          }

          pathToList = target.path;
        }

        const dirTarget = getObjectByPath(pathToList);
        if (dirTarget && dirTarget.obj.type === 'dir') {
          // Получаем список файлов и директорий
          for (const name in dirTarget.obj.contents) {
            const item = dirTarget.obj.contents[name];
            if (item.type === 'dir') {
              term.writeln(`\x1b[1;34m${name}/\x1b[0m`);
            } else {
              term.writeln(`\x1b[1;32m${name}\x1b[0m`);
            }
          }
        }
        break;

      case 'cat':
        if (expandedArgs.length === 0) {
          term.writeln('\x1b[1;31mcat: необходимо указать имя файла\x1b[0m');
          break;
        }

        const fileTarget = getObjectByPath(expandedArgs[0]);
        if (!fileTarget) {
          term.writeln(`\x1b[1;31mcat: ${expandedArgs[0]}: Нет такого файла или каталога\x1b[0m`);
        } else if (fileTarget.obj.type !== 'file') {
          term.writeln(`\x1b[1;31mcat: ${expandedArgs[0]}: Является директорией\x1b[0m`);
        } else {
          term.writeln(fileTarget.obj.content);
        }
        break;

      case 'touch':
        if (expandedArgs.length === 0) {
          term.writeln('\x1b[1;31mtouch: необходимо указать имя файла\x1b[0m');
          break;
        }

        const fileName = expandedArgs[0];
        const dirPath = fileName.includes('/')
          ? fileName.substring(0, fileName.lastIndexOf('/'))
          : currentDir.current;
        const baseName = fileName.includes('/')
          ? fileName.substring(fileName.lastIndexOf('/') + 1)
          : fileName;

        const parentDir = getObjectByPath(dirPath);
        if (!parentDir) {
          term.writeln(`\x1b[1;31mtouch: ${dirPath}: Нет такого файла или каталога\x1b[0m`);
        } else if (parentDir.obj.type !== 'dir') {
          term.writeln(`\x1b[1;31mtouch: ${dirPath}: Не является директорией\x1b[0m`);
        } else {
          parentDir.obj.contents[baseName] = {
            type: 'file',
            content: ''
          };
        }
        break;

      case 'mkdir':
        if (expandedArgs.length === 0) {
          term.writeln('\x1b[1;31mmkdir: необходимо указать имя директории\x1b[0m');
          break;
        }

        const dirName = expandedArgs[0];
        const parentPath = dirName.includes('/')
          ? dirName.substring(0, dirName.lastIndexOf('/'))
          : currentDir.current;
        const newDirName = dirName.includes('/')
          ? dirName.substring(dirName.lastIndexOf('/') + 1)
          : dirName;

        const parent = getObjectByPath(parentPath);
        if (!parent) {
          term.writeln(`\x1b[1;31mmkdir: ${parentPath}: Нет такого файла или каталога\x1b[0m`);
        } else if (parent.obj.type !== 'dir') {
          term.writeln(`\x1b[1;31mmkdir: ${parentPath}: Не является директорией\x1b[0m`);
        } else {
          parent.obj.contents[newDirName] = {
            type: 'dir',
            contents: {}
          };
        }
        break;

      case 'whoami':
        term.writeln(env.current.USER);
        break;

      case 'hostname':
        term.writeln(env.current.HOSTNAME);
        break;

      case 'date':
        term.writeln(new Date().toString());
        break;

      case 'env':
        for (const key in env.current) {
          term.writeln(`${key}=${env.current[key]}`);
        }
        break;

      case 'export':
        expandedArgs.forEach(arg => {
          const match = arg.match(/^([^=]+)=(.*)$/);
          if (match) {
            const [, name, value] = match;
            env.current[name] = value;
            term.writeln(`Установлена переменная: ${name}=${value}`);
          }
        });
        break;

      case 'fetch':
      case 'http':
      case 'curl':
        if (expandedArgs.length === 0) {
          term.writeln('\x1b[1;31mcurl: необходимо указать URL\x1b[0m');
          break;
        }

        const url = expandedArgs[0];
        term.writeln(`\x1b[1;34mОтправка запроса к ${url}...\x1b[0m`);

        // Определяем метод запроса
        let method = 'GET';
        let headers = {};
        let body = null;

        // Обрабатываем опции
        for (let i = 1; i < expandedArgs.length; i++) {
          const arg = expandedArgs[i];

          if (arg === '-X' || arg === '--request') {
            if (i + 1 < expandedArgs.length) {
              method = expandedArgs[i + 1];
              i++;
            }
          } else if (arg === '-H' || arg === '--header') {
            if (i + 1 < expandedArgs.length) {
              const headerParts = expandedArgs[i + 1].split(':');
              if (headerParts.length >= 2) {
                const headerName = headerParts[0].trim();
                const headerValue = headerParts.slice(1).join(':').trim();
                headers[headerName] = headerValue;
              }
              i++;
            }
          } else if (arg === '-d' || arg === '--data') {
            if (i + 1 < expandedArgs.length) {
              body = expandedArgs[i + 1];
              if (!headers['Content-Type']) {
                headers['Content-Type'] = 'application/x-www-form-urlencoded';
              }
              i++;
            }
          } else if (arg === '--json') {
            if (i + 1 < expandedArgs.length) {
              try {
                body = expandedArgs[i + 1];
                headers['Content-Type'] = 'application/json';
                i++;
              } catch (e) {
                term.writeln(`\x1b[1;31mОшибка JSON: ${e.message}\x1b[0m`);
                return true;
              }
            }
          }
        }

        // Выполняем запрос
        term.writeln(`\x1b[1;34mМетод: ${method}\x1b[0m`);
        if (Object.keys(headers).length > 0) {
          term.writeln('\x1b[1;34mЗаголовки:\x1b[0m');
          for (const header in headers) {
            term.writeln(`  ${header}: ${headers[header]}`);
          }
        }

        if (body) {
          term.writeln('\x1b[1;34mТело запроса:\x1b[0m');
          term.writeln(`  ${body}`);
        }

        try {
          // Показываем индикатор загрузки
          term.write('\x1b[1;33mЗагрузка ');
          let dots = 0;
          const loadingInterval = setInterval(() => {
            term.write('.');
            dots++;
            if (dots > 5) {
              term.write('\b\b\b\b\b     \b\b\b\b\b');
              dots = 0;
            }
          }, 300);

          // Выполняем запрос
          fetch(url, {
            method,
            headers,
            body: body ? body : undefined
          }).then(response => {
            clearInterval(loadingInterval);
            term.write('\r\x1b[K'); // Очищаем строку с индикатором

            term.writeln(`\x1b[1;32mСтатус: ${response.status} ${response.statusText}\x1b[0m`);
            term.writeln('\x1b[1;34mЗаголовки ответа:\x1b[0m');

            response.headers.forEach((value, name) => {
              term.writeln(`  ${name}: ${value}`);
            });

            // Получаем и выводим тело ответа
            return response.text();
          }).then(text => {
            term.writeln('\x1b[1;34mТело ответа:\x1b[0m');

            // Проверяем, является ли ответ JSON
            try {
              const json = JSON.parse(text);
              term.writeln(JSON.stringify(json, null, 2));
            } catch {
              // Если не JSON, выводим как обычный текст
              term.writeln(text);
            }

            // Отображаем промпт после завершения запроса
            writePrompt(term);
          }).catch(error => {
            clearInterval(loadingInterval);
            term.write('\r\x1b[K'); // Очищаем строку с индикатором
            term.writeln(`\x1b[1;31mОшибка: ${error.message}\x1b[0m`);

            // Отображаем промпт в случае ошибки
            writePrompt(term);
          });

          // Не показываем сразу промпт, так как запрос асинхронный
          return false;
        } catch (error) {
          term.writeln(`\x1b[1;31mОшибка: ${error.message}\x1b[0m`);
        }
        break;

      case 'exit':
        term.writeln('\x1b[1;31mЗакрытие терминала...\x1b[0m');
        window.dispatchEvent(new CustomEvent('terminal-exit'));
        break;

      default:
        term.writeln(`\x1b[1;31m${command}: команда не найдена\x1b[0m`);
    }

    return true;
  };

  // Функция для обработки ввода
const setupInputHandling = useCallback((term) => {
  term.onData((data) => {
    switch(data) {
      // Enter
      case '\r': {
        term.write('\r\n');

        // Добавляем команду в историю
        if (currentCommand.current.trim()) {
          commandHistory.current.unshift(currentCommand.current);
          if (commandHistory.current.length > 50) {
            commandHistory.current.pop();
          }
        }

        // Обрабатываем команду
        const result = processCommand(currentCommand.current.trim(), term);

        // Сбрасываем состояние
        historyIndex.current = -1;
        currentCommand.current = '';

        // Обновляем промпт
        if (result) {
          writePrompt(term);
        }
        break;
      }

      // Стрелка вверх
      case '\x1b[A': {
        if (commandHistory.current.length > 0 &&
            historyIndex.current < commandHistory.current.length - 1) {

          // Очистка текущей строки
          term.write('\x1b[2K\r');

          // Получаем команду из истории
          historyIndex.current++;
          currentCommand.current = commandHistory.current[historyIndex.current];
          term.write(currentCommand.current);
        }
        break;
      }

      // Стрелка вниз
      case '\x1b[B': {
        term.write('\x1b[2K\r'); // Очистка строки

        if (historyIndex.current > 0) {
          historyIndex.current--;
          currentCommand.current = commandHistory.current[historyIndex.current];
        } else {
          historyIndex.current = -1;
          currentCommand.current = '';
        }
        term.write(currentCommand.current);
        break;
      }

      // Ctrl+C
      case '\x03': {
        term.write('^C\r\n');
        currentCommand.current = '';
        writePrompt(term);
        break;
      }

      // Ctrl+L
      case '\x0c': {
        term.clear();
        writePrompt(term);
        currentCommand.current = '';
        break;
      }

      // Backspace
      case '\x7f': {
        if (currentCommand.current.length > 0) {
          currentCommand.current = currentCommand.current.slice(0, -1);
          term.write('\b \b');
        }
        break;
      }

      // Обычные символы
      default: {
        if (data.length === 1 && data.charCodeAt(0) >= 32) {
          currentCommand.current += data;
          term.write(data);
        }
      }
    }
  });
}, [
  // Явные зависимости
  processCommand,
  writePrompt,
  commandHistory.current,
  currentCommand.current,
  historyIndex.current
]);



  return (
    <div 
      ref={terminalRef} 
      className="terminal-container" 
      onClick={() => terminalInstance.current?.focus()}
    />
  );
};

export default TerminalComponent;