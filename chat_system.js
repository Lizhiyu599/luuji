/**
 * 玉界 - 顶级全功能沉浸式交互系统 (最终修复版)
 * 包含：手势下拉、键盘适配、API 联动、背景头像持久化、搜索功能
 */

// ===== 1. 核心状态与持久化数据 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    momentsBg: localStorage.getItem('yujie_moments_bg') || '',
    userName: "用户",
    wallet: 5200.00,
    apiStats: {
        total: parseInt(localStorage.getItem('api_total') || 0),
        chatOnline: parseInt(localStorage.getItem('api_online') || 0),
        chatOffline: parseInt(localStorage.getItem('api_offline') || 0),
        image: parseInt(localStorage.getItem('api_image') || 0),
        voice: parseInt(localStorage.getItem('api_voice') || 0)
    },
    contacts: [
        { id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }
    ],
    mental: { mood: "静谧", favorability: 90, action: "正在优化系统", thought: "希望能给宝宝最完美的体验。" }
};

// 实时更新 API 数据并持久化
window.updateRealApi = function(type) {
    ChatConfig.apiStats.total += 10;
    if(type) ChatConfig.apiStats[type] += 10;
    localStorage.setItem('api_total', ChatConfig.apiStats.total);
    localStorage.setItem('api_' + type, ChatConfig.apiStats[type]);
    const el = document.getElementById('api-total-display');
    if(el) el.innerText = ChatConfig.apiStats.total;
};

// ===== 2. 深度视觉与布局样式 =====
const injectUltraStyle = () => {
    if (document.getElementById('yujie-ultra-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-ultra-css';
    s.innerHTML = `
        /* 屏蔽原生干扰 */
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }

        /* 全局容器 */
        .chat-shell { 
            display: flex; flex-direction: column; height: 100vh; width: 100%; 
            background: #f2f2f7; position: relative; overflow: hidden;
        }

        /* 优化版额头 (70px) */
        .chat-nav-bar {
            flex-shrink: 0; height: 70px; display: flex; flex-direction: column;
            background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100;
        }
        .status-bar-space { height: 30px; }
        .nav-content { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-btn-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color: #000; }
        .nav-title-text { font-size: 16px; font-weight: 600; color: #000; letter-spacing: -0.3px; cursor: pointer; }

        /* 内容与底部导航 */
        .chat-main-body { flex: 1; overflow-y: auto; background: #f2f2f7; -webkit-overflow-scrolling: touch; }
        .chat-fixed-footer {
            position: fixed; bottom: 0; left: 0; width: 100%; height: 60px;
            background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex; justify-content: space-around;
            align-items: center; z-index: 100; padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-item { font-size: 13px; color: #8e8e93; font-weight: 500; text-align: center; cursor: pointer; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* 气泡与聊天背景 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 12px; line-height: 1.4; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); backdrop-filter: blur(15px); color: #fff; border-bottom-left-radius: 4px; }
        
        /* 沉浸式单聊窗口 */
        #singleChatLayer { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f2f2f7; z-index: 500; display: none; flex-direction: column; }
        .glass-header { background: rgba(255,255,255,0.4) !important; }
        .glass-footer { background: rgba(255,255,255,0.4) !important; }

        /* 输入栏 */
        .input-bar { height: 60px; display: flex; align-items: center; padding: 0 16px 20px; gap: 12px; }
        .add-circle { width: 28px; height: 28px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 20px; cursor: pointer; }

        /* 半屏详情与手势 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.15); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(40px);
            border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }
        .half-sheet.dragging { transition: none; }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: grab; }

        /* 列表虚线 */
        .line-item { background: #fff; padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 0.5px dashed #e5e5ea; cursor: pointer; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势与键盘适配驱动 =====
const initBehaviors = () => {
    // 键盘适配
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const h = window.visualViewport.height;
            const shell = document.querySelector('.chat-shell');
            if(shell) shell.style.height = h + 'px';
            const layer = document.getElementById('singleChatLayer');
            if(layer) layer.style.height = h + 'px';
        });
    }
};

// 手势下拉监听
let startY = 0;
window.initPullGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => {
        startY = e.touches[0].clientY;
        sheet.classList.add('dragging');
    };
    sheet.ontouchmove = (e) => {
        let delta = e.touches[0].clientY - startY;
        if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    };
    sheet.ontouchend = (e) => {
        sheet.classList.remove('dragging');
        let delta = e.changedTouches[0].clientY - startY;
        if (delta > 150) window.toggleSheet(false);
        else sheet.style.transform = `translateY(0)`;
    };
};

// ===== 4. 核心渲染与接管 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectUltraStyle();
    initBehaviors();
    
    document.body.classList.add('chat-active');
    const appContent = document.getElementById('appContent');
    const appWindow = document.getElementById('genericAppWindow');
    appWindow.style.display = 'flex';

    appContent.innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav-bar">
                <div class="status-bar-space"></div>
                <div class="nav-content">
                    <span class="nav-btn-back" onclick="window.closeWholeApp()">‹</span>
                    <span class="nav-title-text" id="mainTitle">聊天</span>
                </div>
            </nav>
            <main class="chat-main-body" id="mainBody"></main>
            <footer class="chat-fixed-footer">
                <div class="tab-item active" onclick="window.changeTab('chats', this)">聊天</div>
                <div class="tab-item" onclick="window.changeTab('contacts', this)">联系人</div>
                <div class="tab-item" onclick="window.changeTab('moments', this)">动态</div>
                <div class="tab-item" onclick="window.changeTab('me', this)">我的</div>
            </footer>
            <div id="singleChatLayer"></div>
            <input type="file" id="imgPicker" style="display:none" accept="image/*">
        </div>
    `;
    window.changeTab('chats');
};

window.changeTab = (tab, el) => {
    const body = document.getElementById('mainBody');
    const title = document.getElementById('mainTitle');
    if (el) {
        document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    if (tab === 'chats') {
        title.innerText = "聊天";
        body.innerHTML = `<div style="background:#fff;">${ChatConfig.contacts.map(c => `
            <div class="line-item" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;">${c.avatar}</div>
                <div style="flex:1;overflow:hidden;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span style="font-weight:600;">${c.name}</span><span style="color:#c7c7cc;font-size:12px;">刚刚</span></div>
                    <div style="color:#8e8e93;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">点击进入沉浸式对话...</div>
                </div>
            </div>`).join('')}</div>`;
    } else if (tab === 'contacts') {
        title.innerText = "联系人";
        body.innerHTML = `<div style="background:#fff;"><div class="line-item">新的朋友</div><div style="height:24px;background:#f2f2f7;padding:0 16px;font-size:12px;color:#8e8e93;display:flex;align-items:center;">Z</div><div class="line-item" onclick="window.enterChat('枝玉')">枝玉</div></div>`;
    } else if (tab === 'moments') {
        title.innerText = "动态";
        body.innerHTML = `<div style="height:200px;background:#aaa;background-size:cover;background-image:url(${ChatConfig.momentsBg});" onclick="window.pickImg('momentsBg')"></div><div style="padding:40px;text-align:center;color:#8e8e93;">动态流加载中...</div>`;
    } else if (tab === 'me') {
        title.innerText = "我的";
        body.innerHTML = `<div style="padding:40px;display:flex;flex-direction:column;align-items:center;background:#fff;"><div style="width:80px;height:80px;border-radius:20px;background-size:cover;background-image:url(${ChatConfig.userAvatar});border:1px solid #eee;" onclick="window.pickImg('userAvatar')"></div><div style="margin-top:10px;font-weight:800;font-size:20px;">${ChatConfig.userName}</div></div>`;
    }
};

// ===== 5. 单聊交互核心 =====
window.enterChat = function(name) {
    const layer = document.getElementById('singleChatLayer');
    layer.style.display = 'flex';
    layer.innerHTML = `
        <header class="chat-nav-bar glass-header">
            <div class="status-bar-space"></div>
            <div class="nav-content">
                <span class="nav-btn-back" onclick="window.closeChat()">‹</span>
                <span class="nav-title-text" onclick="window.toggleSheet(true)">${name}</span>
                <div id="typing" style="position:absolute;bottom:-10px;font-size:10px;color:#8e8e93;display:none;">输入中…</div>
            </div>
        </header>
        <div id="chatFlow" style="flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;background-size:cover;background-position:center;background-image:url(${ChatConfig.chatBg});"></div>
        <div class="chat-fixed-footer glass-footer" style="padding:10px 16px 30px;">
            <div class="add-circle" onclick="alert('相册/转账')">+</div>
            <input type="text" id="chatInput" style="flex:1;border:none;background:#fff;border-radius:18px;padding:10px 14px;outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.handleSend()">
            <div style="font-size:26px;cursor:pointer;" onclick="window.handleSend()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"></div>
                <div style="padding:0 24px 40px;overflow-y:auto;height:calc(100% - 40px);">
                    <div style="font-size:20px;font-weight:800;margin:10px 0 20px;">聊天详情</div>
                    <div style="background:rgba(255,255,255,0.4);border-radius:18px;padding:18px;margin-bottom:15px;">
                        <div style="color:#8e8e93;font-size:11px;margin-bottom:10px;">API 消耗</div>
                        <div style="font-size:14px;">总点数: <span id="api-total-display">${ChatConfig.apiStats.total}</span></div>
                    </div>
                    <div style="margin-bottom:15px;"><input type="text" id="searchInp" placeholder="搜索聊天记录…" style="width:100%;border:none;background:#fff;border-radius:12px;padding:12px;" oninput="window.doSearch(this.value)"><div id="searchRes" style="background:rgba(255,255,255,0.2);margin-top:5px;border-radius:8px;padding:10px;display:none;"></div></div>
                    <div style="background:rgba(255,255,255,0.4);border-radius:18px;padding:15px;margin-bottom:15px;" onclick="window.pickImg('chatBg')">更换聊天背景</div>
                    <button style="width:100%;padding:15px;border:none;background:#000;color:#fff;border-radius:15px;font-weight:700;" onclick="window.clearChat()">清空聊天记录</button>
                </div>
            </div>
        </div>
    `;
    window.initPullGesture(document.getElementById('detailSheet'));
};

window.handleSend = async function() {
    const input = document.getElementById('chatInput');
    const flow = document.getElementById('chatFlow');
    const text = input.value.trim();
    if(!text) return;
    appendBubble(flow, 'user', text);
    input.value = '';
    
    document.getElementById('typing').style.display = 'block';
    
    // 真实 API 请求逻辑
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');
    
    if(baseUrl && apiKey) {
        try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'system', content: '回复禁超20字，禁emoji。' }, { role: 'user', content: text }]
                })
            });
            const data = await res.json();
            document.getElementById('typing').style.display = 'none';
            if(data.choices) {
                appendBubble(flow, 'assistant', data.choices[0].message.content);
                window.updateRealApi('chatOnline');
            }
        } catch(e) {
            document.getElementById('typing').style.display = 'none';
            appendBubble(flow, 'assistant', "连接超时");
        }
    } else {
        setTimeout(() => {
            document.getElementById('typing').style.display = 'none';
            appendBubble(flow, 'assistant', "请先配置 API 密钥。");
        }, 1000);
    }
};

function appendBubble(box, role, text) {
    const d = document.createElement('div');
    d.className = `bubble bubble-${role}`;
    d.innerText = text;
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    if(!window.historyLogs) window.historyLogs = [];
    window.historyLogs.push(text);
}

// ===== 6. 通用功能与持久化处理 =====
window.doSearch = (val) => {
    const res = document.getElementById('searchRes');
    if(!val || !window.historyLogs) { res.style.display='none'; return; }
    const matches = window.historyLogs.filter(t => t.includes(val));
    res.innerHTML = matches.map(m => `<div style="padding:4px 0;border-bottom:0.5px solid rgba(0,0,0,0.05);">${m}</div>`).join('');
    res.style.display = matches.length ? 'block' : 'none';
};

window.pickImg = (type) => {
    const p = document.getElementById('imgPicker');
    p.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const data = ev.target.result;
                ChatConfig[type] = data;
                localStorage.setItem('yujie_' + type, data);
                alert('设置成功，即将刷新预览');
                if(type === 'chatBg' && document.getElementById('chatFlow')) document.getElementById('chatFlow').style.backgroundImage = `url(${data})`;
                else window.changeTab(window.ChatConfig.activeTab);
            };
            reader.readAsDataURL(file);
        }
    };
    p.click();
};

window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    mask.style.display = show ? 'block' : 'none';
    setTimeout(() => sheet.classList.toggle('active', show), 10);
};

window.closeChat = () => document.getElementById('singleChatLayer').style.display = 'none';
window.closeWholeApp = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };
window.clearChat = () => { if(confirm('清空？')) document.getElementById('chatFlow').innerHTML = ''; };

// 强制覆盖 index.html 的原始逻辑
setInterval(() => {
    if (document.body.classList.contains('chat-active')) {
        const oldHeader = document.querySelector('.chat-active .app-header');
        if (oldHeader && oldHeader.style.display !== 'none') oldHeader.style.display = 'none';
    }
}, 500);

console.log("玉界：全功能沉浸式插件已重载。");
