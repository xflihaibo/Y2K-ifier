// Background Service Worker for Y2K-ifier

const RETRO_CSS_FILE = 'styles/retro.css';

// 检查受限 URL
function isRestrictedURL(url) {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('https://chrome.google.com/webstore')
  );
}

// 核心注入函数
async function injectRetro(tabId, url) {
  if (!tabId || isRestrictedURL(url)) return;

  try {
    // 获取 CRT 开关状态
    const data = await chrome.storage.local.get('crtEnabled');
    const crtEnabled = data.crtEnabled !== false; // 默认为 true

    // 1. 注入 CSS 样式表（仅主框架，便于关闭时 removeCSS 正确匹配）
    await chrome.scripting.insertCSS({
      target: { tabId, allFrames: false },
      files: [RETRO_CSS_FILE]
    });

    // 2. 注入脚本：插入挂件和跑马灯（根据 CRT 开关）
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (crtEnabled) => {
        // 确保清理旧元素
        const elementsToRemove = ['y2k-under-construction', 'y2k-marquee-bar'];
        elementsToRemove.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });

        // 添加激活类
        document.documentElement.classList.add('y2k-mode-active');

        // 根据 CRT 开关添加/移除 CRT 类
        if (crtEnabled) {
          document.documentElement.classList.add('y2k-crt-active');
        } else {
          document.documentElement.classList.remove('y2k-crt-active');
        }

        // 插入正在建设中挂件
        const widget = document.createElement('div');
        widget.id = 'y2k-under-construction';
        document.documentElement.appendChild(widget);

        // 只有 CRT 开启时才插入跑马灯
        if (crtEnabled) {
          const marquee = document.createElement('div');
          marquee.id = 'y2k-marquee-bar';
          marquee.innerHTML = `
            <div class="y2k-marquee-content">
              *** WELCOME TO THE WORLD WIDE WEB! *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 OR INTERNET EXPLORER 5.0 *** 
              OPTIMIZED FOR 800x600 RESOLUTION *** CLICK HERE TO SIGN MY GUESTBOOK! *** 
              LOADING... PLEASE WAIT... *** YOU ARE VISITOR #00042069 *** 
              STAY RETRO, STAY Y2K! ***
            </div>
          `;
          document.documentElement.appendChild(marquee);
        }
      },
      args: [crtEnabled]
    });
    console.log(`Y2K effects injected into: ${tabId}`);
  } catch (err) {
    if (!err.message.includes('No tab with id')) {
      console.warn(`Injection failed: ${err.message}`);
    }
  }
}

// 移除样式并恢复页面（主框架）
async function removeRetro(tabId, url) {
  if (!tabId || isRestrictedURL(url)) return;
  try {
    const target = { tabId, allFrames: false };
    await chrome.scripting.removeCSS({
      target,
      files: [RETRO_CSS_FILE]
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const ids = ['y2k-under-construction', 'y2k-marquee-bar'];
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
        document.documentElement.classList.remove('y2k-mode-active', 'y2k-crt-active');
        document.documentElement.style.marginTop = '';
      }
    });
  } catch (err) {
    if (!err.message?.includes('No tab with id')) {
      console.warn('Y2K removeRetro failed:', err.message);
    }
  }
}

// 关闭复古模式后重载当前标签页，确保页面完全复原
async function reloadActiveTabAfterDisable() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id && !isRestrictedURL(tab.url)) {
    try {
      await chrome.tabs.reload(tab.id);
    } catch (e) {
      console.warn('Y2K reload tab failed:', e.message);
    }
  }
}

// 更新 CRT 效果（不重新注入整个样式表）
async function updateCRT(tabId, url, crtEnabled) {
  if (!tabId || isRestrictedURL(url)) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: (enabled) => {
        if (enabled) {
          document.documentElement.classList.add('y2k-crt-active');
          // 如果跑马灯不存在，则创建它
          if (!document.getElementById('y2k-marquee-bar')) {
            const marquee = document.createElement('div');
            marquee.id = 'y2k-marquee-bar';
            marquee.innerHTML = `
              <div class="y2k-marquee-content">
                *** WELCOME TO THE WORLD WIDE WEB! *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 OR INTERNET EXPLORER 5.0 *** 
                OPTIMIZED FOR 800x600 RESOLUTION *** CLICK HERE TO SIGN MY GUESTBOOK! *** 
                LOADING... PLEASE WAIT... *** YOU ARE VISITOR #00042069 *** 
                STAY RETRO, STAY Y2K! ***
              </div>
            `;
            document.documentElement.appendChild(marquee);
          }
        } else {
          document.documentElement.classList.remove('y2k-crt-active');
          // 移除跑马灯
          const marquee = document.getElementById('y2k-marquee-bar');
          if (marquee) marquee.remove();
        }
      },
      args: [crtEnabled]
    });
  } catch (err) {
    if (!err.message.includes('No tab with id')) {
      console.warn(`CRT update failed: ${err.message}`);
    }
  }
}

// 监听开关切换
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.isEnabled) {
      const isEnabled = changes.isEnabled.newValue;
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id && tab.url) {
            if (isEnabled) injectRetro(tab.id, tab.url);
            else removeRetro(tab.id, tab.url);
          }
        });
        // 关闭复古时重载当前标签页，确保页面完全复原
        if (!isEnabled) reloadActiveTabAfterDisable();
      });
    }
    if (changes.crtEnabled) {
      const crtEnabled = changes.crtEnabled.newValue;
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          // 只有在复古模式开启时才更新 CRT
          chrome.storage.local.get('isEnabled', (data) => {
            if (data.isEnabled !== false) {
              updateCRT(tab.id, tab.url, crtEnabled !== false);
            }
          });
        });
      });
    }
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && !isRestrictedURL(tab.url)) {
    chrome.storage.local.get(['isEnabled', 'crtEnabled'], (data) => {
      if (data.isEnabled !== false) {
        injectRetro(tabId, tab.url);
      }
    });
  }
});

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'toggleCRT') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.storage.local.get('isEnabled', (data) => {
          if (data.isEnabled !== false) {
            updateCRT(tabs[0].id, tabs[0].url, message.state);
          }
        });
      }
    });
  }
});

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isEnabled', 'crtEnabled'], (res) => {
    const defaults = {};
    if (res.isEnabled === undefined) defaults.isEnabled = true;
    if (res.crtEnabled === undefined) defaults.crtEnabled = true;
    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });
});
