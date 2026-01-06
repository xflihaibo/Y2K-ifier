document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('retroToggle');

    // 1. 初始化：从存储中获取当前状态
    const data = await chrome.storage.local.get('isEnabled');
    toggle.checked = data.isEnabled !== false; // 默认为 true

    // 2. 监听切换事件
    toggle.addEventListener('change', async () => {
        const newState = toggle.checked;
        
        // 3. 保存新状态
        await chrome.storage.local.set({ isEnabled: newState });

        // 4. 通知 Service Worker 立即更新当前标签页
        chrome.runtime.sendMessage({ action: 'toggleRetro', state: newState });
    });
});
