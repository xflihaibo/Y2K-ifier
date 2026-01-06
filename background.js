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
    // 1. 注入 CSS 样式表
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      files: [RETRO_CSS_FILE]
    });

    // 2. 注入脚本：插入挂件和跑马灯
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // 确保清理旧元素
        const elementsToRemove = ['y2k-under-construction', 'y2k-marquee-bar'];
        elementsToRemove.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });

        // 添加激活类
        document.documentElement.classList.add('y2k-mode-active');

        // 插入正在建设中挂件
        const widget = document.createElement('div');
        widget.id = 'y2k-under-construction';
        document.documentElement.appendChild(widget);

        // 插入跑马灯
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
    });
    console.log(`Y2K effects injected into: ${tabId}`);
  } catch (err) {
    if (!err.message.includes('No tab with id')) {
      console.warn(`Injection failed: ${err.message}`);
    }
  }
}

// 移除样式
async function removeRetro(tabId, url) {
  if (!tabId || isRestrictedURL(url)) return;
  try {
    await chrome.scripting.removeCSS({
      target: { tabId: tabId },
      files: [RETRO_CSS_FILE]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const ids = ['y2k-under-construction', 'y2k-marquee-bar'];
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) el.remove();
        });
        document.documentElement.classList.remove('y2k-mode-active');
      }
    });
  } catch (err) {}
}

// 监听开关切换
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.isEnabled) {
    const isEnabled = changes.isEnabled.newValue;
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (isEnabled) injectRetro(tab.id, tab.url);
        else removeRetro(tab.id, tab.url);
      });
    });
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && !isRestrictedURL(tab.url)) {
    chrome.storage.local.get('isEnabled', (data) => {
      if (data.isEnabled !== false) {
        injectRetro(tabId, tab.url);
      }
    });
  }
});

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['isEnabled'], (res) => {
    if (res.isEnabled === undefined) chrome.storage.local.set({ isEnabled: true });
  });
});
