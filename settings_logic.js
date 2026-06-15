/**
 * 模块：settings_logic.js
 * 职责：API 连接测试、状态管理、加载动画处理
 */

window.SettingsLogic = {
    // 通用测试连接函数
    // btnId: 点击的按钮ID, statusId: 显示结果的容器ID, apiUrl: API地址, apiKey: 密钥
    testApiConnection: async function(btnId, statusId, apiUrl, apiKey) {
        const btn = document.getElementById(btnId);
        const statusContainer = document.getElementById(statusId);
        
        if (!apiUrl || !apiKey) {
            this.updateStatusUI(statusContainer, false, "配置不完整");
            return;
        }

        // 1. 交互：隐藏按钮，显示加载动画
        btn.style.display = 'none';
        statusContainer.innerHTML = this.getLoadingHTML();

        // 2. 10秒超时逻辑
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // 这里替换为你真实的后端测试接口，或模拟请求
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            if (response.ok) {
                this.updateStatusUI(statusContainer, true, "连接成功");
            } else {
                this.updateStatusUI(statusContainer, false, "连接失败");
            }
        } catch (e) {
            clearTimeout(timeoutId);
            const msg = e.name === 'AbortError' ? "连接超时" : "连接失败";
            this.updateStatusUI(statusContainer, false, msg);
        } finally {
            // 恢复按钮显示
            btn.style.display = 'block';
        }
    },

    // 生成三点波浪加载动画的 HTML
    getLoadingHTML: function() {
        return `
            <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
            <style>
                .loading-dots { display: flex; gap: 8px; justify-content: center; align-items: center; }
                .dot { width: 10px; height: 10px; background: #8e8e93; border-radius: 50%; animation: wave 1.4s infinite ease-in-out; }
                .dot:nth-child(1) { animation-delay: -0.32s; }
                .dot:nth-child(2) { animation-delay: -0.16s; }
                @keyframes wave {
                    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
                    40% { transform: scale(1); opacity: 1; background: #000; }
                }
            </style>
        `;
    },

    // 更新状态显示 (成功：绿色圆点，失败：红色圆点)
    updateStatusUI: function(container, isSuccess, text) {
        const color = isSuccess ? '#22c55e' : '#ef4444';
        container.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:center; gap:6px; margin-top:10px;">
                <div style="width:8px; height:8px; background:${color}; border-radius:50%;"></div>
                <span style="font-size:14px; color:${color};">${text}</span>
            </div>
        `;
    }
};
