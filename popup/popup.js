function setToggleState(checkbox, stateEl) {
    if (!stateEl) return;
    stateEl.textContent = checkbox.checked ? '开' : '关';
}

document.addEventListener('DOMContentLoaded', async () => {
    const retroToggle = document.getElementById('retroToggle');
    const crtToggle = document.getElementById('crtToggle');
    const retroState = document.getElementById('retroState');
    const crtState = document.getElementById('crtState');

    // 1. 初始化：从存储中获取当前状态（CRT 扫描线默认开启）
    const data = await chrome.storage.local.get(['isEnabled', 'crtEnabled']);
    retroToggle.checked = data.isEnabled !== false; // 复古模式默认开
    crtToggle.checked = data.crtEnabled !== false;  // CRT 扫描线默认开
    if (data.crtEnabled === undefined) {
        await chrome.storage.local.set({ crtEnabled: true });
    }
    setToggleState(retroToggle, retroState);
    setToggleState(crtToggle, crtState);

    // 2. 监听复古模式切换事件
    retroToggle.addEventListener('change', async () => {
        const newState = retroToggle.checked;
        setToggleState(retroToggle, retroState);
        await chrome.storage.local.set({ isEnabled: newState });
        chrome.runtime.sendMessage({ action: 'toggleRetro', state: newState });
    });

    // 3. 监听 CRT 开关切换事件
    crtToggle.addEventListener('change', async () => {
        const newState = crtToggle.checked;
        setToggleState(crtToggle, crtState);
        await chrome.storage.local.set({ crtEnabled: newState });
        chrome.runtime.sendMessage({ action: 'toggleCRT', state: newState });
    });
});
