/* 
 * 玉界 - iOS Liquid Glass 聊天系统 (chat_system.js)
 * 风格：WeChat 架构 + iOS 玻璃视觉 + 极简黑白符号
 */

// ===== 1. 全局状态与持久化 =====
window.ChatState = {
    user: {
        name: "用户",
        avatar: localStorage.getItem('yujie_avatar') || '',
        balance: 5200.00
    },
    settings: JSON.parse(localStorage.getItem('yujie_settings')) || {
        bg: '',
        replyMin: 1,
        replyMax: 3,
        narration: true,
        pronoun: '我'
    },
    mental: { mood: "平静", favorability: 85, action: "静坐", thought: "等待指令" },
    isTyping: false
};

// ===== 2. 全局样式注入 (iOS 玻璃风格) =====
const injectIOSStyles = () => {
    const styleId = 'ios-liquid-glass-ui';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        :root { --glass: rgba(255, 255, 255, 0.4); --glass-heavy: rgba(255, 255, 255, 0.7); --blur: blur(30px); }
        
        /* 基础容器 */
        .ios-wrapper { display: flex; flex-direction: column; height: 100%; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        .ios-content { flex: 1; overflow-y: auto; padding-bottom: 20px; }
        
        /* 玻璃组件 */
        .glass-header { height: 60px; display: flex; justify-content: space-between; align-items: center; padding: 15px 20px 0; background: var(--glass); backdrop-filter: var(--blur); -webkit-backdrop-filter: var(--blur); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .glass-tabbar { height: 65px; display: flex; justify-content: space-around; align-items: center; background: var(--glass); backdrop-filter: var(--blur); border-top: 0.5px solid rgba(0,0,0,0.05); padding-bottom: env(safe-area-inset-bottom); z-index: 100; }
        .tab-item { font-size: 13px; color: #8e8e93; font-weight: 500; cursor: pointer; transition: 0.3s; }
        .tab-item.active { color: #000; font-weight: 700; transform: scale(1.1); }

        /* 聊天窗口：全屏玻璃 */
        .chat-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #f2f2f7; z-index: 500; display: none; flex-direction: column; }
        .chat-bg-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0.8; z-index: -1; }

        /* 气泡风格 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 12px; line-height: 1.4; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .bubble-user { align-self: flex-end; background: var(--glass-heavy); color: #000; backdrop-filter: var(--blur); border-bottom-right-radius: 4px; border: 0.5px solid rgba(255,255,255,0.8); }
        .bubble-ai { align-self: flex-start; background: rgba(0,0,0,0.8); color: #fff; backdrop-filter: var(--blur); border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 12px; text-align: center; box-shadow: none; }

        /* iOS Bottom Sheet (设置面板) */
        .bottom-sheet { position: absolute; bottom: 0; left: 0; width: 100%; height: 85%; background: var(--glass-heavy); backdrop-filter: blur(40px); border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); z-index: 1000; display: flex; flex-direction: column; }
        .bottom-sheet.active { transform: translateY(0); }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: pointer; }
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 20px 40px; }

        /* 状态浮窗 */
        .peek-modal { position: absolute; top: 70px; right: 20px; width: 220px; background: var(--glass); backdrop-filter: var(--blur); border-radius: 24px; border: 1px solid rgba(255,255,255,0.5); padding: 18px; display: none; z-index: 1500; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .peek-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 10px 0; }

        /* 通用玻璃卡片 */
        .glass-card { background: rgba(255,255,255,0.4); border-radius: 18px; padding: 15px; margin-bottom: 15px; border: 0.5px solid rgba(255,255,255,0.6); }
        
        /* 按钮与输入 */
        .glass-btn { background: #000; color: #fff; border-radius: 12px; border: none; padding: 12px; font-weight: 600; cursor: pointer; }
        .glass-input { background: rgba(255,255,255,0.5); border: none; border-radius: 12px; padding: 12px; outline: none; width: 100%; font-size: 15px; }
    `;
    document.head.appendChild(style);
};

// ===== 3. 初始化入口 (修复结构) =====
window.openApp = function(appName) {
    injectIOSStyles();
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    if (!appContent) return;

    appWindow.style.display = 'flex';
    appContent.style.padding = '0'; // 强制占满

    appContent.innerHTML = `
        <div class="ios-wrapper">
            <header class="glass-header" id="mainHeader">
                <div style="font-size:20px; font-weight:800;" id="tabTitle">聊天</div>
                <div style="font-size:24px; cursor:pointer;" onclick="alert('加好友/群聊')">+</div>
            </header>

            <div class="ios-content" id="tabContent"></div>

            <nav class="glass-tabbar">
                <div class="tab-item active" onclick="window.switchChatTab('chats', this)">聊天</div>
                <div class="tab-item" onclick="window.switchChatTab('contacts', this)">通讯录</div>
                <div class="tab-item" onclick="window.switchChatTab('moments', this)">动态</div>
                <div class="tab-item" onclick="window.switchChatTab('me', this)">我</div>
            </nav>

            <div id="chatWindow" class="chat-overlay"></div>
        </div>
        <input type="file" id="bgUploader" style="display:none" accept="image/*">
    `;
    window.switchChatTab('chats');
};

// ===== 4. 标签切换逻辑 =====
window.switchChatTab = function(tab, el) {
    const content = document.getElementById('tabContent');
    const title = document.getElementById('tabTitle');
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }

    if (tab === 'chats') {
        title.innerText = "聊天";
        renderChats(content);
    } else if (tab === 'contacts') {
        title.innerText = "通讯录";
        renderContacts(content);
    } else if (tab === 'moments') {
        title.innerText = "动态";
        renderMoments(content);
    } else if (tab === 'me') {
        title.innerText = "我";
        renderMe(content);
    }
};

// ===== 5. 聊天窗口 (iMessage + Liquid Glass) =====
window.enterSingleChat = function(id) {
    const win = document.getElementById('chatWindow');
    win.style.display = 'flex';
    win.innerHTML = `
        <div class="chat-bg-layer" id="chatBgLayer" style="background-image:url(${ChatState.settings.bg})"></div>
        <header class="glass-header">
            <div onclick="window.closeChat()" style="cursor:pointer; font-size:22px;"> < </div>
            <div style="text-align:center;">
                <div style="font-weight:800; font-size:17px;">枝玉</div>
                <div id="typingStatus" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
            </div>
            <div onclick="window.toggleSheet()" style="cursor:pointer; font-size:20px; font-weight:800;"> > </div>
        </header>

        <div id="msgFlow" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column;">
            <div class="bubble bubble-narration">iMessage (加密连接)</div>
        </div>

        <div style="padding:10px 16px 25px; background:var(--glass); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap:12px;">
            <div style="font-size:22px; cursor:pointer;" onclick="window.togglePeek()">ᥫ᭡</div>
            <input type="text" id="msgInput" class="glass-input" style="flex:1;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.sendMsg()">
            <div style="font-size:22px; cursor:pointer; color:#8e8e93;">∧</div>
            <div style="font-size:22px; cursor:pointer; font-weight:800;" onclick="window.sendMsg()">+</div>
        </div>

        <div id="peekArea" class="peek-modal"></div>
        <div id="settingSheet" class="bottom-sheet"></div>
    `;
    renderPeek();
    renderSheet();
};

window.closeChat = () => document.getElementById('chatWindow').style.display = 'none';

// ===== 6. 发送逻辑与背景设置 =====
window.sendMsg = async function() {
    const input = document.getElementById('msgInput');
    const flow = document.getElementById('msgFlow');
    const text = input.value.trim();
    if (!text) return;

    appendBubble(flow, 'user', text);
    input.value = '';

    document.getElementById('typingStatus').style.display = 'block';
    
    // 模拟API调用...
    setTimeout(() => {
        document.getElementById('typingStatus').style.display = 'none';
        appendBubble(flow, 'ai', "这是一条玻璃质感的自动回复。");
    }, 1500);
};

function appendBubble(container, role, text) {
    const div = document.createElement('div');
    const isNar = text.startsWith('(') || text.startsWith('（');
    div.className = `bubble ${isNar ? 'bubble-narration' : (role === 'user' ? 'bubble-user' : 'bubble-ai')}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// 背景图处理
window.triggerBg = () => {
    const up = document.getElementById('bgUploader');
    up.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                ChatState.settings.bg = ev.target.result;
                localStorage.setItem('yujie_settings', JSON.stringify(ChatState.settings));
                document.getElementById('chatBgLayer').style.backgroundImages = `url(${ev.target.result})`;
                alert('背景图已更新');
            };
            reader.readAsDataURL(file);
        }
    };
    up.click();
};

// ===== 7. 设置面板 (Bottom Sheet) =====
function renderSheet() {
    const sheet = document.getElementById('settingSheet');
    sheet.innerHTML = `
        <div class="sheet-handle" onclick="window.toggleSheet()"></div>
        <div class="sheet-content">
            <div style="font-size:20px; font-weight:800; margin-bottom:25px;">聊天详情</div>
            
            <div class="glass-card">
                <div style="font-size:11px; color:#8e8e93; margin-bottom:12px; letter-spacing:1px;">API 消耗监控</div>
                <div style="font-size:14px; line-height:1.8;">全部点数：1200<br>线上：100 | 线下：50 | 生图：200 | 语音：20</div>
            </div>

            <div class="glass-card">
                <input type="text" class="glass-input" placeholder="搜索聊天记录…">
            </div>

            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>AI 总结 (50轮)</span>
                    <span style="color:#007aff; font-size:13px;">手动立即总结</span>
                </div>
                <input type="range" style="width:100%; height:4px; appearance:none; background:#000; border-radius:2px;">
            </div>

            <div class="glass-card">
                <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">背景图设置</div>
                <div style="display:flex; gap:10px;">
                    <div onclick="window.triggerBg()" style="width:60px; height:60px; background:rgba(0,0,0,0.05); border:1px dashed #ccc; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px;">+</div>
                    <button class="glass-btn" onclick="ChatState.settings.bg=''; alert('已清除')">清除背景</button>
                </div>
            </div>

            <div class="glass-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span>最小回复: <span id="vMin">1</span></span>
                    <input type="range" min="1" max="10" value="1" oninput="vMin.innerText=this.value">
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>最大回复: <span id="vMax">3</span></span>
                    <input type="range" min="1" max="10" value="3" oninput="vMax.innerText=this.value">
                </div>
            </div>

            <div class="glass-card" style="display:flex; justify-content:space-between;">
                <span>开启旁白</span>
                <input type="checkbox" checked>
            </div>

            <div class="glass-card">
                <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">人称系统</div>
                <div style="display:flex; gap:15px;">
                    <label><input type="radio" name="p" checked> 我</label>
                    <label><input type="radio" name="p"> 你</label>
                    <label><input type="radio" name="p"> ta</label>
                </div>
            </div>

            <div style="padding:10px 0;">
                <div style="color:#ff3b30; font-weight:700; padding:15px; border-bottom:0.5px solid rgba(0,0,0,0.05);" onclick="confirm('确定清空？')">清空聊天记录</div>
                <div style="color:#000; font-weight:700; padding:15px;" onclick="alert('已拉黑')">拉黑联系人</div>
            </div>
        </div>
    `;
}

// ===== 8. 状态浮窗 & 通讯录 =====
function renderPeek() {
    const p = document.getElementById('peekArea');
    const s = ChatState.mental;
    p.innerHTML = `
        <div style="font-weight:800; margin-bottom:10px;">窥视ta...</div>
        <div style="font-size:11px; color:#8e8e93;">心情</div><div style="font-size:13px;">${s.mood}</div><div class="peek-divider"></div>
        <div style="font-size:11px; color:#8e8e93;">好感值</div><div style="font-size:13px;">${s.favorability}</div><div class="peek-divider"></div>
        <div style="font-size:11px; color:#8e8e93;">当前动作</div><div style="font-size:13px;">${s.action}</div><div class="peek-divider"></div>
        <div style="font-size:11px; color:#8e8e93;">内心想法</div><div style="font-size:13px;">${s.thought}</div>
    `;
}

window.toggleSheet = () => document.getElementById('settingSheet').classList.toggle('active');
window.togglePeek = () => {
    const p = document.getElementById('peekArea');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
};

// 通讯录实现
function renderContacts(container) {
    container.innerHTML = `
        <div style="padding:15px;">
            <div class="glass-card" style="margin-bottom:10px;">新的朋友 <span style="float:right;">></span></div>
            <div style="background:#f2f2f7; padding:5px 15px; font-size:12px; color:#8e8e93;">Z</div>
            <div class="glass-card" style="display:flex; align-items:center; gap:12px;" onclick="window.enterSingleChat()">
                <div style="width:36px; height:36px; background:#000; border-radius:8px; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800;">枝</div>
                <span style="font-weight:600;">枝玉</span>
            </div>
        </div>
        <div style="position:fixed; right:6px; top:120px; display:flex; flex-direction:column; gap:4px; font-size:10px; font-weight:700;">
            <span>A</span><span>B</span><span>C</span><span>Z</span><span>#</span>
        </div>
    `;
}

// 我的
function renderMe(container) {
    container.innerHTML = `
        <div style="padding:20px;">
            <div class="glass-card" style="display:flex; align-items:center; gap:20px; padding:30px 20px;">
                <div style="width:60px; height:60px; background:#eee; border-radius:12px;"></div>
                <div>
                    <div style="font-size:20px; font-weight:800;">${ChatState.user.name}</div>
                    <div style="color:#8e8e93; font-size:13px;">ID: yujie_v8</div>
                </div>
            </div>
            <div class="glass-card">服务 <span style="float:right; color:#8e8e93;">余额: ${ChatState.user.balance} ></span></div>
            <div class="glass-card">设置 <span style="float:right;">></span></div>
        </div>
    `;
}

function renderChats(container) {
    container.innerHTML = `
        <div style="padding:15px;">
            <div class="glass-card" style="display:flex; gap:15px; align-items:center;" onclick="window.enterSingleChat()">
                <div style="width:50px; height:50px; background:#000; color:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:800;">枝</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="font-weight:700;">枝玉</span>
                        <span style="color:#b2b2b2; font-size:11px;">10:24</span>
                    </div>
                    <div style="color:#8e8e93; font-size:13px;">正在等待您的回复...</div>
                </div>
            </div>
        </div>
    `;
}

function renderMoments(c) {
    c.innerHTML = `<div style="padding:60px 20px; text-align:center; color:#8e8e93;">动态功能正在接入玻璃 UI...</div>`;
}

console.log("玉界：iOS Liquid Glass 聊天系统已启动。");
