 /**
 * 玉界 - iOS 18 沉浸式系统 (手势+键盘适配增强版)
 * 修复：高额头、手势下拉、键盘弹起空隙
 */

window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    activeTab: 'chats',
    apiStats: {
        total: parseInt(localStorage.getItem('api_total') || 0),
        chatOnline: parseInt(localStorage.getItem('api_online') || 0),
    },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }]
};

// ===== 1. 深度优化样式 =====
const injectFinalStyle = () => {
    const styleId = 'yujie-ultra-ui';
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.innerHTML = `
        .chat-mode .app-header { display: none !important; }
        .chat-mode #appContent { padding: 0 !important; height: 100% !important; }

        /* 采用 Viewport 动态高度，解决键盘问题 */
        .chat-shell { 
            display: flex; flex-direction: column; 
            height: 100vh; width: 100%; 
            background: #f2f2f7; position: relative; overflow: hidden;
        }
        
        /* 紧凑型额头：状态栏(30px) + 标题栏(40px) = 70px */
        .chat-nav {
            flex-shrink: 0; height: 70px; display: flex; flex-direction: column;
            background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border-bottom: 0.5px solid rgba(0,0,0,0.08); z-index: 100;
        }
        .status-spacer { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 22px; font-weight: 300; cursor: pointer; color: #000; }
        .nav-title { font-size: 16px; font-weight: 600; color: #000; letter-spacing: -0.3px; cursor: pointer; }

        /* 内容区 */
        .chat-main { flex: 1; overflow-y: auto; background: #f2f2f7; -webkit-overflow-scrolling: touch; }

        /* 底部导航：固定贴底 */
        .chat-tabbar {
            height: 60px; background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex; justify-content: space-around;
            align-items: center; padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-btn { font-size: 13px; font-weight: 500; color: #8e8e93; }
        .tab-btn.active { color: #000; font-weight: 700; }

        /* 单聊全屏 */
        #singleChatBox { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #f2f2f7; z-index: 500; display: none; flex-direction: column; }
        .glass-bg { background: rgba(255, 255, 255, 0.45) !important; }

        /* 输入栏：适配键盘的关键 */
        .chat-input-bar {
            flex-shrink: 0; min-height: 54px; display: flex; align-items: center; padding: 8px 16px;
            background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.08); gap: 10px;
        }
        .add-btn { width: 26px; height: 26px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 18px; cursor: pointer; }

        /* 气泡 */
        .bubble { max-width: 75%; padding: 10px 14px; border-radius: 18px; font-size: 15px; margin-bottom: 10px; line-height: 1.4; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.9); backdrop-filter: blur(10px); color:#000; border-bottom-right-radius: 2px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.8); backdrop-filter: blur(15px); color:#fff; border-bottom-left-radius: 2px; }

        /* 半屏详情：支持下拉手势 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); z-index: 600; display: none; opacity: 0; transition: opacity 0.3s; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 82%;
            background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(40px);
            border-radius: 24px 24px 0 0; transform: translateY(100%); 
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            touch-action: none; /* 禁用默认滚动以便捕捉手势 */
        }
        .half-sheet.dragging { transition: none; } /* 拖拽时取消过渡动画 */
        .sheet-bar { width: 36px; height: 5px; background: rgba(0,0,0,0.15); border-radius: 3px; margin: 10px auto; cursor: grab; }
    `;
    document.head.appendChild(s);
};

// ===== 2. 键盘适配逻辑 =====
const initKeyboardAdapter = () => {
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const shell = document.querySelector('.chat-shell');
            const singleBox = document.getElementById('singleChatBox');
            if (shell) {
                // 将 shell 的高度设为可见区域高度，输入栏会自动吸附到底部
                const h = window.visualViewport.height;
                shell.style.height = h + 'px';
                if(singleBox) singleBox.style.height = h + 'px';
            }
        });
    }
};

// ===== 3. 手势下拉逻辑 =====
let startY = 0;
let currentY = 0;
const initGesture = (sheet) => {
    const bar = sheet.querySelector('.sheet-bar');
    
    const onStart = (e) => {
        startY = e.touches[0].clientY;
        sheet.classList.add('dragging');
    };

    const onMove = (e) => {
        currentY = e.touches[0].clientY;
        let delta = currentY - startY;
        if (delta > 0) {
            sheet.style.transform = `translateY(${delta}px)`;
        }
    };

    const onEnd = () => {
        sheet.classList.remove('dragging');
        let delta = currentY - startY;
        if (delta > 150) { // 下拉超过 150px 则关闭
            window.showSheet(false);
        } else {
            sheet.style.transform = `translateY(0)`; // 否则弹回
        }
        currentY = 0;
        startY = 0;
    };

    bar.addEventListener('touchstart', onStart);
    sheet.addEventListener('touchmove', onMove);
    sheet.addEventListener('touchend', onEnd);
};

// ===== 4. 应用接管与渲染 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectFinalStyle();
    initKeyboardAdapter();
    
    document.body.classList.add('chat-mode');
    const content = document.getElementById('appContent');
    
    content.innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav">
                <div class="status-spacer"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="window.exitChat()">‹</span>
                    <span class="nav-title" id="tabTitle">聊天</span>
                </div>
            </nav>
            <main class="chat-main" id="chatContainer"></main>
            <footer class="chat-tabbar">
                <div class="tab-btn active" onclick="window.navTab('chats', this)">聊天</div>
                <div class="tab-btn" onclick="window.navTab('contacts', this)">联系人</div>
                <div class="tab-btn" onclick="window.navTab('moments', this)">动态</div>
                <div class="tab-btn" onclick="window.navTab('me', this)">我的</div>
            </footer>
            <div id="singleChatBox"></div>
        </div>
    `;
    window.navTab('chats');
};

window.navTab = (tab, el) => {
    const container = document.getElementById('chatContainer');
    const title = document.getElementById('tabTitle');
    if (el) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    if (tab === 'chats') {
        title.innerText = "聊天";
        container.innerHTML = `
            <div style="background:#fff;">
                ${ChatConfig.contacts.map(c => `
                    <div style="padding:12px 16px; display:flex; gap:12px; border-bottom:0.5px dashed #eee; align-items:center;" onclick="window.openSingle('${c.name}')">
                        <div style="width:48px;height:48px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;">${c.avatar}</div>
                        <div style="flex:1; overflow:hidden;">
                            <div style="font-weight:600;">${c.name}</div>
                            <div style="color:#8e8e93; font-size:13px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">你好呀，准备好开始今天的对话了吗？</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        container.innerHTML = `<div style="padding:100px; text-align:center; color:#ccc;">${tab} 模块开发中</div>`;
    }
};

window.openSingle = function(name) {
    const box = document.getElementById('singleChatBox');
    box.style.display = 'flex';
    box.innerHTML = `
        <header class="chat-nav glass-bg">
            <div class="status-spacer"></div>
            <div class="nav-body">
                <span class="nav-back" onclick="window.closeSingle()">‹</span>
                <span class="nav-title" onclick="window.showSheet(true)">${name}</span>
            </div>
        </header>
        <div id="msgFlow" style="flex:1; overflow-y:auto; padding:15px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover;"></div>
        <div class="chat-input-bar glass-bg">
            <div class="add-btn" onclick="alert('相册/转账')">+</div>
            <input type="text" id="wxInput" style="flex:1; border:none; background:#fff; border-radius:12px; padding:10px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
            <div style="font-size:24px; cursor:pointer;" onclick="window.send()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.showSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-bar"></div>
                <div style="padding:0 24px 40px; overflow-y:auto; height:calc(100% - 40px);">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    <div style="background:rgba(255,255,255,0.4); border-radius:18px; padding:18px; margin-bottom:15px;">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:8px;">API 统计</div>
                        <div style="font-weight:700;">总点数: <span id="api-total">${ChatConfig.apiStats.total}</span></div>
                    </div>
                    <div style="background:rgba(255,255,255,0.4); border-radius:18px; padding:15px; margin-bottom:15px;">
                        <input type="text" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; padding:12px; border-radius:10px;">
                    </div>
                    <button style="width:100%; padding:15px; border:none; background:#000; color:#fff; border-radius:15px; font-weight:700;" onclick="window.closeSingle()">退出聊天</button>
                </div>
            </div>
        </div>
    `;
    initGesture(document.getElementById('detailSheet'));
};

window.showSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) {
        mask.style.display = 'block';
        setTimeout(() => {
            mask.style.opacity = '1';
            sheet.classList.add('active');
            sheet.style.transform = 'translateY(0)';
        }, 10);
    } else {
        mask.style.opacity = '0';
        sheet.classList.remove('active');
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => mask.style.display = 'none', 300);
    }
};

window.send = () => {
    const input = document.getElementById('wxInput');
    const text = input.value.trim();
    if(!text) return;
    const flow = document.getElementById('msgFlow');
    const d = document.createElement('div');
    d.className = 'bubble bubble-user';
    d.innerText = text;
    flow.appendChild(d);
    input.value = '';
    flow.scrollTop = flow.scrollHeight;
    
    // 模拟点数增加
    ChatConfig.apiStats.total += 10;
    localStorage.setItem('api_total', ChatConfig.apiStats.total);
};

window.closeSingle = () => document.getElementById('singleChatBox').style.display = 'none';
window.exitChat = () => {
    document.body.classList.remove('chat-mode');
    document.getElementById('genericAppWindow').style.display = 'none';
};

console.log("玉界：适配优化版注入成功。");               
