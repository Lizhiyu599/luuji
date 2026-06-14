/**
 * 玉界 - 顶级 iOS 18 视觉交互系统
 * 目标：沉浸式玻璃、实时 API 联动、极简结构
 */

// ===== 1. 核心状态与持久化 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    activeTab: 'chats',
    // 实时 API 统计
    apiStats: {
        total: parseInt(localStorage.getItem('api_total') || 0),
        chatOnline: parseInt(localStorage.getItem('api_online') || 0),
        chatOffline: parseInt(localStorage.getItem('api_offline') || 0),
        image: parseInt(localStorage.getItem('api_image') || 0),
        voice: parseInt(localStorage.getItem('api_voice') || 0)
    },
    contacts: [
        { id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }
    ]
};

// 更新 API 点数的函数
window.updateApiStats = function(type) {
    ChatConfig.apiStats.total += 10; // 假设每轮 10 点
    if(type) ChatConfig.apiStats[type] += 10;
    localStorage.setItem('api_total', ChatConfig.apiStats.total);
    localStorage.setItem('api_' + type, ChatConfig.apiStats[type]);
    // 如果面板开着，同步刷新
    const el = document.getElementById('stat-total');
    if(el) el.innerText = ChatConfig.apiStats.total;
};

// ===== 2. 深度视觉注入 =====
const injectAdvancedStyles = () => {
    const styleId = 'yujie-advanced-ui';
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.innerHTML = `
        /* 布局层级 */
        .app-shell { display: flex; flex-direction: column; height: 100%; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 标题栏高度换算：状态栏+标题栏约 88px */
        .app-header {
            flex-shrink: 0; height: 88px; display: flex; flex-direction: column;
            background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; position: relative;
        }
        .header-status { height: 44px; width: 100%; } /* 预留给系统状态栏 */
        .header-title-bar { 
            height: 44px; display: flex; align-items: center; justify-content: center; 
            padding: 0 16px; position: relative; 
        }
        .header-title-text { font-size: 17px; font-weight: 600; color: #000; letter-spacing: -0.4px; }
        .header-left { position: absolute; left: 16px; font-size: 22px; font-weight: 300; cursor: pointer; }

        /* 内容区 */
        .app-main { flex: 1; overflow-y: auto; background: #f2f2f7; -webkit-overflow-scrolling: touch; }

        /* 底部导航栏 */
        .app-footer {
            height: 65px; display: flex; justify-content: space-around; align-items: center;
            background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); padding-bottom: env(safe-area-inset-bottom);
        }
        .footer-item { font-size: 14px; font-weight: 500; color: #8e8e93; cursor: pointer; transition: color 0.2s; }
        .footer-item.active { color: #000; font-weight: 700; }

        /* 联系人列表极简风格 */
        .contact-item {
            background: #fff; padding: 12px 16px; display: flex; align-items: center; gap: 12px;
            border-bottom: 0.5px dashed #e5e5ea; cursor: pointer;
        }
        .contact-item:last-child { border-bottom: none; }

        /* 聊天气泡 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 12px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.8); backdrop-filter: blur(10px); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); backdrop-filter: blur(15px); color: #fff; border-bottom-left-radius: 4px; }
        
        /* 沉浸式单聊窗口 */
        #chatOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f2f2f7; z-index: 500; display: none; flex-direction: column; }
        .chat-header-glass { background: rgba(255,255,255,0.4) !important; } /* 进入聊天后透出壁纸 */
        .chat-footer-glass { background: rgba(255,255,255,0.4) !important; }

        /* iOS 半屏详情 */
        .sheet-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.1); z-index: 600; display: none;
        }
        .bottom-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(40px);
            border-top: 0.5px solid rgba(255,255,255,0.5); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
        }
        .bottom-sheet.active { transform: translateY(0); }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: pointer; }

        /* 搜索框美化 */
        .search-container { position: relative; margin-bottom: 15px; }
        .search-results { 
            background: rgba(255,255,255,0.3); border-radius: 12px; margin-top: 5px; 
            padding: 8px; display: none; font-size: 13px; color: #3a3a3c;
        }
    `;
    document.head.appendChild(s);
};

// ===== 3. 核心应用架构 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectAdvancedStyles();
    
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    if (!appWindow || !appContent) return;

    appWindow.style.display = 'flex';
    appContent.style.padding = '0';
    appContent.innerHTML = `
        <div class="app-shell">
            <header class="app-header">
                <div class="header-status"></div>
                <div class="header-title-bar">
                    <span class="header-title-text" id="shellTitle">聊天</span>
                </div>
            </header>
            
            <main class="app-main" id="shellMain"></main>

            <footer class="app-footer">
                <div class="footer-item active" onclick="window.navTab('chats', this)">聊天</div>
                <div class="footer-item" onclick="window.navTab('contacts', this)">联系人</div>
                <div class="footer-item" onclick="window.navTab('moments', this)">动态</div>
                <div class="footer-item" onclick="window.navTab('me', this)">我的</div>
            </div>

            <div id="chatOverlay"></div>
        </div>
    `;
    window.navTab('chats');
};

// 导航切换
window.navTab = function(tab, el) {
    const main = document.getElementById('shellMain');
    const title = document.getElementById('shellTitle');
    if (el) {
        document.querySelectorAll('.footer-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
    }

    if (tab === 'chats') {
        title.innerText = "聊天";
        renderChats(main);
    } else if (tab === 'contacts') {
        title.innerText = "联系人";
        renderContacts(main);
    } else if (tab === 'moments') {
        title.innerText = "动态";
        renderMoments(main);
    } else if (tab === 'me') {
        title.innerText = "我的";
        renderMe(main);
    }
};

// ===== 4. 渲染逻辑：联系人与列表 =====
function renderChats(container) {
    container.innerHTML = `
        <div style="background:#fff;">
            ${ChatConfig.contacts.map(c => `
                <div class="contact-item" onclick="window.enterChat('${c.name}')">
                    <div style="width:50px; height:50px; background:#000; color:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800;">${c.avatar}</div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600;">${c.name}</span>
                            <span style="color:#c7c7cc; font-size:12px;">刚刚</span>
                        </div>
                        <div style="color:#8e8e93; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">你好，我是开发者枝玉。</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderContacts(container) {
    container.innerHTML = `
        <div style="background:#fff;">
            <div class="contact-item">
                <div style="width:36px; height:36px; background:#f2f2f7; border-radius:8px; display:flex; align-items:center; justify-content:center;">+</div>
                <span style="font-weight:600;">新的朋友</span>
            </div>
            <div style="height:24px; background:#f2f2f7; padding:0 16px; font-size:12px; color:#8e8e93; display:flex; align-items:center;">Z</div>
            ${ChatConfig.contacts.map(c => `
                <div class="contact-item" onclick="window.enterChat('${c.name}')">
                    <div style="width:36px; height:36px; background:#000; border-radius:8px;"></div>
                    <span style="font-weight:600;">${c.name}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== 5. 聊天窗口逻辑 (沉浸式) =====
window.enterChat = function(name) {
    const overlay = document.getElementById('chatOverlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <header class="app-header chat-header-glass">
            <div class="header-status"></div>
            <div class="header-title-bar">
                <span class="header-left" onclick="window.closeChat()"> < </span>
                <span class="header-title-text" onclick="window.toggleSheet(true)" style="cursor:pointer;">${name}</span>
                <span id="chat-typing" style="position:absolute; bottom:-10px; font-size:10px; color:#8e8e93; display:none;">输入中…</span>
            </div>
        </header>

        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column; 
            background-size:cover; background-position:center; background-image:url(${ChatConfig.chatBg});">
        </div>

        <div class="app-footer chat-footer-glass" style="padding:10px 16px 30px;">
            <input type="text" id="chatMsg" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.chatSend()">
            <div style="font-size:26px; margin-left:12px; cursor:pointer;" onclick="window.chatSend()">+</div>
        </div>

        <!-- 半屏详情 -->
        <div class="sheet-overlay" id="sheetOverlay" onclick="window.toggleSheet(false)">
            <div class="bottom-sheet" id="chatSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle" onclick="window.toggleSheet(false)"></div>
                <div style="padding:0 24px 40px; overflow-y:auto; height:calc(100% - 40px);">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    
                    <!-- API 面板 -->
                    <div style="background:rgba(255,255,255,0.4); border-radius:18px; padding:18px; margin-bottom:15px;">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:10px; letter-spacing:1px;">API 消耗详情</div>
                        <div style="font-size:14px; line-height:2;">
                            <div style="display:flex; justify-content:space-between; font-weight:700;"><span>总点数</span> <span id="stat-total">${ChatConfig.apiStats.total}</span></div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; font-size:12px; color:#3a3a3c; margin-top:8px;">
                                <span>线上: ${ChatConfig.apiStats.chatOnline}</span> <span>线下: ${ChatConfig.apiStats.chatOffline}</span>
                                <span>图片: ${ChatConfig.apiStats.image}</span> <span>语音: ${ChatConfig.apiStats.voice}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 搜索功能 -->
                    <div class="search-container">
                        <input type="text" id="chatSearch" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; border-radius:12px; padding:12px;" oninput="window.doSearch(this.value)">
                        <div id="searchRes" class="search-results"></div>
                    </div>

                    <div style="background:rgba(255,255,255,0.4); border-radius:18px; padding:15px; margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between;"><span>AI 总结 (50轮)</span> <span style="font-size:12px; color:#007aff;">手动</span></div>
                        <input type="range" style="width:100%; height:4px; appearance:none; background:#000; border-radius:2px; margin-top:15px;">
                    </div>

                    <div style="background:rgba(255,255,255,0.4); border-radius:18px; padding:15px; margin-bottom:15px;">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">聊天背景</div>
                        <div style="width:100%; height:80px; border:2px dashed #ccc; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#ccc; background-size:cover; background-image:url(${ChatConfig.chatBg});" onclick="window.pickChatBg()">点击更换</div>
                    </div>

                    <button style="width:100%; padding:15px; border-radius:15px; border:none; background:#000; color:#fff; font-weight:700;" onclick="window.clearChat()">清空聊天记录</button>
                </div>
            </div>
        </div>
    `;
};

// 发送消息
window.chatSend = function() {
    const input = document.getElementById('chatMsg');
    const flow = document.getElementById('chatFlow');
    const text = input.value.trim();
    if (!text) return;

    appendBubble(flow, 'user', text);
    input.value = '';
    
    // 模拟 API 逻辑
    document.getElementById('chat-typing').style.display = 'block';
    setTimeout(() => {
        document.getElementById('chat-typing').style.display = 'none';
        appendBubble(flow, 'assistant', "系统正在响应中...");
        window.updateApiStats('chatOnline'); // 对话成功，更新点数
    }, 1500);
};

function appendBubble(box, role, text) {
    const div = document.createElement('div');
    div.className = `bubble bubble-${role}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
    // 简单模拟存储消息用于搜索
    if(!window.chatHistory) window.chatHistory = [];
    window.chatHistory.push(text);
}

// 搜索功能
window.doSearch = function(val) {
    const res = document.getElementById('searchRes');
    if (!val || !window.chatHistory) { res.style.display = 'none'; return; }
    const matches = window.chatHistory.filter(h => h.includes(val));
    if (matches.length > 0) {
        res.innerHTML = matches.map(m => `<div style="padding:4px 0; border-bottom:0.5px solid rgba(0,0,0,0.05);">${m}</div>`).join('');
        res.style.display = 'block';
    } else {
        res.style.display = 'none';
    }
};

// 通用交互
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.toggleSheet = (show) => {
    const overlay = document.getElementById('sheetOverlay');
    const sheet = document.getElementById('chatSheet');
    overlay.style.display = show ? 'block' : 'none';
    setTimeout(() => sheet.classList.toggle('active', show), 10);
};
window.clearChat = () => { if(confirm('确定清空？')) document.getElementById('chatFlow').innerHTML = ''; };

// 背景图处理
window.pickChatBg = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                ChatConfig.chatBg = ev.target.result;
                localStorage.setItem('yujie_chat_bg', ev.target.result);
                document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`;
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
};

// 其余模块存根
window.renderMoments = (c) => { 
    c.innerHTML = `<div style="padding:100px 20px; text-align:center; color:#8e8e93; background:#fff; height:100%;">朋友圈模块加载中...</div>`; 
};
window.renderMe = (c) => { 
    c.innerHTML = `<div style="padding:40px 20px; text-align:center; background:#fff; height:100%;">个人中心模块加载中...</div>`; 
};

console.log("玉界：沉浸式高级聊天系统重构完成。");
