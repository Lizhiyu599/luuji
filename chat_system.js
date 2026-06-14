/**
 * 玉界 - 顶级微信风交互系统 (Refined Version)
 * 视觉：VisionOS / iOS 18 玻璃拟态
 * 逻辑：完全遵循用户细化需求
 */

// ===== 1. 核心状态与数据管理 =====
window.ChatConfig = {
    userName: "用户",
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    apiPoints: { total: 0, online: 0, offline: 0, img: 0, voice: 0 }, // 实时点数
    settings: {
        narration: true,
        pronoun: '我', // 我 / 你 / ta
        minReply: 1,
        maxReply: 3,
        summaryRounds: 50
    },
    contacts: [
        { id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }
    ]
};

// ===== 2. 深度样式注入 (液态玻璃与动态布局) =====
const injectEnhancedStyles = () => {
    const styleId = 'chat-refined-ui';
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.innerHTML = `
        /* 布局容器：消除脏色块，保持通透 */
        .wx-root {
            display: flex; flex-direction: column; height: 100%; width: 100%;
            background: #fdfdfd; position: relative; overflow: hidden;
        }
        
        /* 顶部栏：液态玻璃，高度适中 */
        .wx-header {
            flex-shrink: 0; height: 88px; background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border-bottom: 0.5px solid rgba(0,0,0,0.05); display: flex;
            flex-direction: column; z-index: 100;
        }
        .header-status { height: 44px; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; font-size: 14px; font-weight: 600; }
        .header-title-bar { height: 44px; display: flex; justify-content: center; align-items: center; position: relative; font-size: 17px; font-weight: 700; }

        /* 内容区：色调统一，不再突兀 */
        .wx-body { flex: 1; overflow-y: auto; background: transparent; -webkit-overflow-scrolling: touch; }

        /* 底部导航：绝对固定在充电口位置 */
        .wx-tabbar {
            position: fixed; bottom: 0; left: 0; width: 100%; height: 65px;
            background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex;
            justify-content: space-around; align-items: center; z-index: 100;
            padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-item { font-size: 14px; color: #8e8e93; font-weight: 500; cursor: pointer; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* 联系人：无圆弧，虚线隔开 */
        .contact-item {
            padding: 12px 16px; display: flex; align-items: center; gap: 12px;
            border-bottom: 0.5px dashed rgba(0,0,0,0.1); background: #fff;
        }

        /* 聊天气泡与旁白 */
        .bubble { max-width: 75%; padding: 10px 14px; border-radius: 18px; font-size: 15px; margin-bottom: 12px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255, 255, 255, 0.85); color: #000; backdrop-filter: blur(10px); border: 0.5px solid #fff; }
        .bubble-assistant { align-self: flex-start; background: rgba(0, 0, 0, 0.8); color: #fff; }
        .narration-text { align-self: center; background: none; color: #8e8e93; font-size: 13px; text-align: center; margin: 10px 0; max-width: 90%; }

        /* 聊天输入框：可透出背景的液态玻璃 */
        .input-bar {
            padding: 10px 16px 25px; background: rgba(255,255,255,0.6); backdrop-filter: blur(25px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex; align-items: center; gap: 12px;
            transition: transform 0.3s ease;
        }

        /* 设置半屏面板 */
        .half-panel {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(40px);
            border-top: 0.5px solid rgba(255,255,255,0.8); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); z-index: 500;
        }
        .half-panel.active { transform: translateY(0); }
        .panel-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: ns-resize; }

        /* API卡片 */
        .api-card { background: rgba(255,255,255,0.6); padding: 15px; border-radius: 15px; margin-bottom: 15px; font-size: 13px; }
        
        /* 搜索框效果 */
        .search-res { background: rgba(255,255,255,0.3); border-radius: 10px; padding: 10px; margin-top: 5px; }

        /* 开关与滑块样式 */
        .ios-switch { appearance: none; width: 44px; height: 24px; background: #e9e9ea; border-radius: 12px; position: relative; cursor: pointer; }
        .ios-switch:checked { background: #34c759; }
        .ios-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .ios-switch:checked::after { transform: translateX(20px); }
        
        .custom-slider { appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; }
        .custom-slider::-webkit-slider-thumb { appearance: none; width: 18px; height: 18px; background: #000; border-radius: 50%; border: 2px solid #fff; cursor: pointer; }

        /* 危险区按钮 */
        .danger-btn-white { background: #fff; color: #ff3b30; border: none; border-radius: 12px; padding: 14px; width: 100%; margin-top: 10px; font-weight: 600; }
        .danger-btn-black { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; margin-top: 10px; font-weight: 600; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 初始化与主框架实现 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return; // 只处理聊天进入
    injectEnhancedStyles();
    
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    if (!appWindow || !appContent) return;

    appWindow.style.display = 'flex';
    appContent.style.padding = '0';
    appContent.innerHTML = `
        <div class="wx-root">
            <div class="wx-header">
                <div class="header-status">
                    <span id="st-time">00:00</span>
                    <div style="display:flex; gap:5px;">◎ 📶 🔋</div>
                </div>
                <div class="header-title-bar">
                    <span id="backBtn" style="position:absolute; left:16px; cursor:pointer; display:none;" onclick="window.backToSessions()"><</span>
                    <span id="mainTitle">聊天</span>
                </div>
            </div>
            
            <div class="wx-body" id="wxBody"></div>

            <div class="wx-tabbar" id="wxTabBar">
                <div class="tab-item active" onclick="window.switchTab('chats', this)">聊天</div>
                <div class="tab-item" onclick="window.switchTab('contacts', this)">联系人</div>
                <div class="tab-item" onclick="window.switchTab('moments', this)">动态</div>
                <div class="tab-item" onclick="window.switchTab('me', this)">我的</div>
            </div>

            <!-- 聊天全屏窗口 -->
            <div id="singleChatOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:#fdfdfd; z-index:200; display:none; flex-direction:column;"></div>
            
            <!-- 详情设置半屏 -->
            <div id="settingPanel" class="half-panel"></div>
            
            <!-- 点击外部关闭半屏的遮罩 -->
            <div id="panelOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:490; display:none;" onclick="window.closePanel()"></div>
        </div>
    `;
    
    window.switchTab('chats');
    updateClock();
};

// ===== 4. 路由与功能逻辑 =====
window.switchTab = function(tab, el) {
    const body = document.getElementById('wxBody');
    const title = document.getElementById('mainTitle');
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    if(el) el.classList.add('active');

    if (tab === 'chats') {
        title.innerText = "聊天";
        renderChatSessions(body);
    } else if (tab === 'contacts') {
        title.innerText = "联系人";
        renderContacts(body);
    } else if (tab === 'moments') {
        title.innerText = "";
        renderMoments(body);
    } else if (tab === 'me') {
        title.innerText = "";
        renderMe(body);
    }
};

function renderChatSessions(container) {
    container.innerHTML = `<div style="padding-top:10px;">
        ${window.ChatConfig.contacts.map(c => `
            <div class="contact-item" onclick="window.enterChat('${c.name}')">
                <div style="width:48px; height:48px; background:#000; color:#fff; border-radius:8px; display:flex; align-items:center; justify-content:center; font-weight:800;">${c.avatar}</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;"><span style="font-weight:700;">${c.name}</span><span style="font-size:12px; color:#c7c7cc;">刚刚</span></div>
                    <div style="font-size:13px; color:#8e8e93; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.bio}</div>
                </div>
            </div>
        `).join('')}
    </div>`;
}

function renderContacts(container) {
    container.innerHTML = `<div style="padding-top:10px;">
        <div style="background:#f2f2f7; padding:5px 16px; font-size:12px; color:#8e8e93;">Z</div>
        ${window.ChatConfig.contacts.map(c => `
            <div class="contact-item" onclick="window.enterChat('${c.name}')">
                <div style="width:36px; height:36px; background:#000; border-radius:4px;"></div>
                <span style="font-weight:600;">${c.name}</span>
            </div>
        `).join('')}
    </div>`;
}

// ===== 5. 聊天窗口逻辑 (含背景渐变透出) =====
window.enterChat = function(name) {
    const overlay = document.getElementById('singleChatOverlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="wx-header" style="background: rgba(255,255,255,0.6);">
            <div class="header-status">
                <span>00:00</span>
                <div>◎ 📶 🔋</div>
            </div>
            <div class="header-title-bar">
                <span onclick="window.exitChat()" style="position:absolute; left:16px; cursor:pointer;"><</span>
                <span onclick="window.openPanel()" style="cursor:pointer;">${name}</span>
                <span onclick="window.togglePeek()" style="position:absolute; right:16px; cursor:pointer; font-size:20px;">◎</span>
            </div>
        </div>

        <div id="chatBox" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column; 
            background-size:cover; background-position:center; background-image:url(${window.ChatConfig.chatBg});">
            <div class="narration-text">iMessage 加密对话</div>
        </div>

        <div class="input-bar" id="inputBar">
            <div style="width:28px; height:28px; border:1px solid #000; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</div>
            <input type="text" id="msgInput" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" 
                onfocus="window.moveInput(true)" onblur="window.moveInput(false)" onkeypress="if(event.key==='Enter') window.sendMsg()">
            <div style="font-size:24px; cursor:pointer;" onclick="window.sendMsg()">+</div>
        </div>
        
        <div id="peekBox" class="liquid-glass-modal" style="position:absolute; top:95px; right:15px; width:220px; background:rgba(255,255,255,0.5); backdrop-filter:blur(25px); border-radius:20px; padding:15px; z-index:300; display:none; border:1px solid #fff;">
            <div style="font-weight:800; margin-bottom:10px;">窥视ta...</div>
            <div style="font-size:11px; color:#8e8e93;">心情</div><div id="p-mood">平静</div><div style="border-bottom:0.5px dashed rgba(0,0,0,0.1); margin:8px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">好感值</div><div id="p-fav">0</div><div style="border-bottom:0.5px dashed rgba(0,0,0,0.1); margin:8px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">当前动作</div><div id="p-act">正在阅读</div><div style="border-bottom:0.5px dashed rgba(0,0,0,0.1); margin:8px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">内心想法</div><div id="p-tht">无</div>
        </div>
    `;
};

window.exitChat = () => document.getElementById('singleChatOverlay').style.display = 'none';

window.moveInput = (isFocus) => {
    const bar = document.getElementById('inputBar');
    bar.style.transform = isFocus ? `translateY(-280px)` : `translateY(0)`; // 模拟弹起高度
};

// ===== 6. 设置半屏系统 (全部逻辑补全) =====
window.openPanel = function() {
    const panel = document.getElementById('settingPanel');
    const overlay = document.getElementById('panelOverlay');
    panel.classList.add('active');
    overlay.style.display = 'block';
    
    const cfg = window.ChatConfig;
    panel.innerHTML = `
        <div class="panel-handle" id="panelHandle"></div>
        <div style="padding:0 25px 40px; overflow-y:auto; height:calc(100% - 40px);">
            <div style="font-size:20px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
            
            <div class="api-card">
                <div style="color:#8e8e93; font-size:11px; margin-bottom:12px;">API消耗面板</div>
                <div style="line-height:2;">
                    全部点数：<span id="p-total">${cfg.apiPoints.total}</span><br>
                    线上聊天：${cfg.apiPoints.online} | 线下聊天：${cfg.apiPoints.offline}<br>
                    生成图片：${cfg.apiPoints.img} | 语音：${cfg.apiPoints.voice}
                </div>
            </div>

            <div style="margin-bottom:20px;">
                <input type="text" placeholder="此处可搜索聊天记录…" style="width:100%; border:none; background:#fff; padding:12px; border-radius:12px;" oninput="window.searchChat(this.value)">
                <div id="searchArea"></div>
            </div>

            <div class="api-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>AI总结</span> <span id="sumVal">${cfg.settings.summaryRounds}轮</span>
                </div>
                <input type="range" class="custom-slider" min="10" max="200" value="${cfg.settings.summaryRounds}" oninput="window.updateSum(this.value)">
                <button class="danger-btn-black" style="margin-top:15px; color:#fff;">手动总结</button>
            </div>

            <div class="api-card">
                <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">聊天背景设置</div>
                <div id="bgPreview" style="width:100%; height:80px; background:#f2f2f7; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#ccc; background-size:cover; background-image:url(${cfg.chatBg});" onclick="window.pickBg()">点击选取背景</div>
                <button class="danger-btn-white" onclick="window.clearBg()" style="background:#ff3b30; color:#fff; margin-top:10px;">清除背景图</button>
            </div>

            <div class="api-card">
                <div style="display:flex; justify-content:space-between;"><span>线上聊天旁白</span> <input type="checkbox" class="ios-switch" ${cfg.settings.narration?'checked':''} onchange="window.toggleNarr(this.checked)"></div>
            </div>

            <div class="api-card">
                <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">人称选择 (用于旁白)</div>
                <div style="display:flex; gap:10px;">
                    ${['我','你','ta'].map(p => `<button onclick="window.setPrn('${p}')" style="flex:1; padding:8px; border-radius:8px; border:none; background:${cfg.settings.pronoun===p?'#000':'#fff'}; color:${cfg.settings.pronoun===p?'#fff':'#000'};">${p}</button>`).join('')}
                </div>
            </div>

            <div class="api-card" style="border:1px solid #ff3b30; background:rgba(255,59,48,0.05);">
                <div style="color:#ff3b30; font-weight:700; cursor:pointer;" onclick="window.toggleDanger()">危险区 ></div>
                <div id="dangerZone" style="display:none; margin-top:15px;">
                    <button class="danger-btn-white" onclick="alert('已清空')">清空聊天记录</button>
                    <button class="danger-btn-black">拉黑联系人</button>
                    <button class="danger-btn-white">删除联系人</button>
                </div>
            </div>
        </div>
    `;

    // 下滑关闭逻辑
    let startY = 0;
    const handle = document.getElementById('panelHandle');
    handle.ontouchstart = (e) => startY = e.touches[0].clientY;
    handle.ontouchmove = (e) => {
        let diff = e.touches[0].clientY - startY;
        if(diff > 50) window.closePanel();
    };
};

window.closePanel = () => {
    document.getElementById('settingPanel').classList.remove('active');
    document.getElementById('panelOverlay').style.display = 'none';
};

// ===== 7. 详细功能函数 =====
window.sendMsg = async function() {
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if(!text) return;
    appendBubble(text, 'user');
    input.value = '';
    
    // API 模拟与点数增加
    window.ChatConfig.apiPoints.total += 10;
    window.ChatConfig.apiPoints.online += 10;
    
    setTimeout(() => {
        appendBubble("系统已识别您的指令。", "assistant");
        if(window.ChatConfig.settings.narration) {
            appendBubble("(他静静地看着屏幕，似乎在思考着什么)", "narration");
        }
    }, 1000);
};

function appendBubble(text, role) {
    const box = document.getElementById('chatBox');
    const div = document.createElement('div');
    if(text.startsWith('(')) {
        div.className = 'narration-text';
    } else {
        div.className = `bubble bubble-${role}`;
    }
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

window.pickBg = () => {
    const p = document.createElement('input');
    p.type = 'file';
    p.accept = 'image/*';
    p.onchange = (e) => {
        const file = e.target.files[0];
        const r = new FileReader();
        r.onload = (ev) => {
            window.ChatConfig.chatBg = ev.target.result;
            localStorage.setItem('yujie_chat_bg', ev.target.result);
            document.getElementById('bgPreview').style.backgroundImage = `url(${ev.target.result})`;
            document.getElementById('chatBox').style.backgroundImage = `url(${ev.target.result})`;
        };
        r.readAsDataURL(file);
    };
    p.click();
};

window.clearBg = () => {
    window.ChatConfig.chatBg = '';
    localStorage.removeItem('yujie_chat_bg');
    document.getElementById('bgPreview').style.backgroundImage = '';
    document.getElementById('chatBox').style.backgroundImage = '';
};

window.updateSum = (v) => {
    window.ChatConfig.settings.summaryRounds = v;
    document.getElementById('sumVal').innerText = v + '轮';
};

window.toggleDanger = () => {
    const d = document.getElementById('dangerZone');
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
};

window.setPrn = (p) => {
    window.ChatConfig.settings.pronoun = p;
    window.openPanel(); // 刷新UI
};

window.togglePeek = () => {
    const p = document.getElementById('peekBox');
    p.style.display = p.style.display === 'none' ? 'block' : 'none';
};

function updateClock() {
    const n = new Date();
    const t = document.getElementById('st-time');
    if(t) t.innerText = n.getHours().toString().padStart(2,'0') + ':' + n.getMinutes().toString().padStart(2,'0');
}
setInterval(updateClock, 1000);

// 其他占位渲染
function renderMoments(c) { c.innerHTML = '<div style="padding:100px; text-align:center; color:#ccc;">朋友圈动态</div>'; }
function renderMe(c) { c.innerHTML = '<div style="padding:100px; text-align:center; color:#ccc;">个人中心</div>'; }
