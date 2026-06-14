/* 
 * 玉界 - 顶级聊天交互系统插件 (chat_system.js)
 * 风格：iOS iMessage / 液态玻璃 / 极简黑白
 * 严禁：禁止一切 Emoji，使用符号 ᥫ᭡, >, <, +, ∧
 */

// ===== 1. 核心状态数据 =====
const ChatSystemData = {
    balance: 5200.00,
    userName: "用户",
    currentChat: "枝玉",
    pronoun: "我", // 我, 你, ta
    isNarrationOpen: true,
    contacts: [
        { id: "dev1", name: "枝玉", avatar: "枝", bio: "你好，我是开发者枝玉。", letters: "Z" }
    ],
    // 心理状态
    mental: { mood: "平静", favorability: 0, action: "静坐", thought: "无" }
};

// ===== 2. 注入核心样式 (含液态玻璃与气泡) =====
const injectStyles = () => {
    if (document.getElementById('chat-enhanced-style')) return;
    const style = document.createElement('style');
    style.id = 'chat-enhanced-style';
    style.innerHTML = `
        /* 布局容器 */
        .chat-full-container { height: 100%; display: flex; flex-direction: column; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* iMessage 气泡：助手-黑，用户-白 */
        .bubble { max-width: 78%; padding: 12px 16px; border-radius: 22px; font-size: 15px; line-height: 1.5; margin-bottom: 10px; position: relative; word-wrap: break-word; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.85); color: #fff; border-bottom-left-radius: 4px; backdrop-filter: blur(20px); }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.7); color: #000; border-bottom-right-radius: 4px; backdrop-filter: blur(20px); border: 0.5px solid rgba(255,255,255,0.8); }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 13px; text-align: center; max-width: 90%; margin: 15px 0; }

        /* 液态玻璃半窗 */
        .liquid-half-panel { 
            position: absolute; bottom: 0; left: 0; width: 100%; height: 85%; 
            background: rgba(255,255,255,0.25); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
            border-top: 0.5px solid rgba(255,255,255,0.5); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); z-index: 1000;
        }
        .liquid-half-panel.active { transform: translateY(0); }
        .panel-close-area { height: 40px; width: 100%; display: flex; justify-content: center; align-items: center; cursor: pointer; }
        .panel-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; }

        /* 底部标签栏 - 纯文字 */
        .tab-bar-text { height: 60px; background: rgba(242,242,247,0.8); backdrop-filter: blur(20px); display: flex; justify-content: space-around; align-items: center; border-top: 0.5px solid rgba(0,0,0,0.1); }
        .tab-item { font-size: 14px; font-weight: 500; color: #8e8e93; cursor: pointer; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* 红包/转账 UI */
        .bill-card { background: #1a1a1a; color: #fff; padding: 15px; border-radius: 12px; width: 200px; margin: 10px 0; }
        .bill-header { display: flex; align-items: center; gap: 8px; font-size: 12px; margin-bottom: 8px; opacity: 0.8; }
        .bill-body { font-size: 18px; font-weight: 600; border-bottom: 0.5px solid rgba(255,255,255,0.1); padding-bottom: 8px; margin-bottom: 5px; }
        .bill-footer { font-size: 10px; opacity: 0.5; }

        /* 状态浮窗 (ᥫ᭡) */
        .peek-window { 
            position: absolute; top: 70px; right: 20px; width: 220px; 
            background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border: 0.5px solid rgba(255,255,255,0.8);
            border-radius: 20px; padding: 15px; z-index: 2000; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .peek-dash { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }
    `;
    document.head.appendChild(style);
};

// ===== 3. 初始化入口：强制覆盖原有逻辑 =====
const initChatSystem = () => {
    injectStyles();
    
    // 核心：劫持 openApp
    const originalOpenApp = window.openApp;
    window.openApp = function(appName) {
        if (appName === 'chat') {
            startEnhancedChat();
        } else {
            // 调用原始逻辑处理其他APP
            if (typeof originalOpenApp === 'function') originalOpenApp(appName);
        }
    };
    
    console.log("玉界：聊天交互系统注入成功。");
};

// 执行初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatSystem);
} else {
    initChatSystem();
}

// ===== 4. 页面切换逻辑 =====
function startEnhancedChat() {
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    const appTitle = document.getElementById('appTitle');

    appWindow.style.display = 'flex';
    appTitle.innerText = '聊天';
    appContent.style.padding = '0';
    appContent.innerHTML = `
        <div class="chat-full-container">
            <div id="chatHeader" style="height:50px; display:flex; justify-content:space-between; align-items:center; padding:0 20px; background:#f2f2f7; border-bottom:0.5px solid rgba(0,0,0,0.1);">
                <div style="font-size:18px; font-weight:700;" id="currentTabTitle">聊天</div>
                <div style="font-size:24px; cursor:pointer;" onclick="showTopAddMenu()">+</div>
            </div>
            
            <div id="chatMainDisplay" style="flex:1; overflow-y:auto; position:relative;"></div>

            <div class="tab-bar-text">
                <div class="tab-item active" onclick="switchChatTab('chats', this)">聊天</div>
                <div class="tab-item" onclick="switchChatTab('contacts', this)">联系人</div>
                <div class="tab-item" onclick="switchChatTab('moments', this)">动态</div>
                <div class="tab-item" onclick="switchChatTab('me', this)">我的</div>
            </div>
            
            <!-- 状态浮窗 -->
            <div id="peekWindow" class="peek-window" onclick="this.style.display='none'">
                <div style="font-weight:700; margin-bottom:10px;">窥视ta...</div>
                <div style="font-size:11px; color:#8e8e93;">心情</div><div id="p-mood" style="font-size:13px;">平静</div><div class="peek-dash"></div>
                <div style="font-size:11px; color:#8e8e93;">好感值</div><div id="p-fav" style="font-size:13px;">0</div><div class="peek-dash"></div>
                <div style="font-size:11px; color:#8e8e93;">当前动作</div><div id="p-act" style="font-size:13px;">无</div><div class="peek-dash"></div>
                <div style="font-size:11px; color:#8e8e93;">内心想法</div><div id="p-tht" style="font-size:13px;">无</div>
            </div>
        </div>
    `;
    switchChatTab('chats');
}

// 标签切换
window.switchChatTab = function(type, el) {
    const container = document.getElementById('chatMainDisplay');
    const title = document.getElementById('currentTabTitle');
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }

    if (type === 'chats') {
        title.innerText = "聊天";
        renderSessionList(container);
    } else if (type === 'contacts') {
        title.innerText = "联系人";
        renderContactList(container);
    } else if (type === 'moments') {
        title.innerText = "动态";
        renderMoments(container);
    } else if (type === 'me') {
        title.innerText = "我的";
        renderMePage(container);
    }
};

// ===== 5. 会话列表与聊天窗口 =====
function renderSessionList(container) {
    container.innerHTML = `
        <div style="padding:10px 0;">
            ${ChatSystemData.contacts.map(c => `
                <div style="background:#fff; padding:15px; display:flex; align-items:center; gap:12px; border-bottom:0.5px solid #f0f0f0; cursor:pointer;" onclick="openSingleChat('${c.name}')">
                    <div style="width:50px; height:50px; background:#000; color:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700;">${c.avatar}</div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600;">${c.name}</span>
                            <span style="color:#c7c7cc; font-size:12px;">刚刚</span>
                        </div>
                        <div style="color:#8e8e93; font-size:13px;">你好，我是开发者枝玉。</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.openSingleChat = function(name) {
    const container = document.getElementById('chatMainDisplay');
    container.innerHTML = `
        <div id="chatWin" style="height:100%; display:flex; flex-direction:column; background:#f2f2f7; position:absolute; top:0; left:0; width:100%; z-index:10;">
            <!-- 聊天头 -->
            <div style="height:50px; display:flex; justify-content:space-between; align-items:center; padding:0 16px; background:rgba(255,255,255,0.85); backdrop-filter:blur(20px); border-bottom:0.5px solid rgba(0,0,0,0.1);">
                <span onclick="switchChatTab('chats')" style="cursor:pointer; font-size:18px;"> < </span>
                <div style="text-align:center;" onclick="showChatDetail()">
                    <div style="font-weight:700;" id="chattingName">${name}</div>
                    <div id="inputStatus" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
                </div>
                <div style="display:flex; gap:15px; align-items:center;">
                    <span style="cursor:pointer;" onclick="togglePeek()">ᥫ᭡</span>
                    <span style="cursor:pointer; font-weight:700;" onclick="showChatDetail()"> > </span>
                </div>
            </div>

            <!-- 消息列表 -->
            <div id="msgBox" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column;">
                <div style="text-align:center; color:#c7c7cc; font-size:12px; margin-bottom:20px;">iMessage</div>
            </div>

            <!-- 输入框栏 -->
            <div style="padding:10px 16px 25px; background:#f2f2f7; border-top:0.5px solid rgba(0,0,0,0.1); display:flex; align-items:center; gap:12px;">
                <div style="width:30px; height:30px; border:1px solid #000; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="toggleAddMenu()">+</div>
                <input type="text" id="chatInput" style="flex:1; border:none; background:#fff; border-radius:20px; padding:10px 15px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') sendMsg()">
                <div style="font-size:22px; cursor:pointer;" onclick="alert('语音已开启')">∧</div>
                <div style="font-size:26px; cursor:pointer;" onclick="sendMsg()">+</div>
            </div>

            <!-- 多交互功能菜单 -->
            <div id="addMenu" class="liquid-half-panel" style="height:40%;">
                <div class="panel-close-area" onclick="toggleAddMenu()"><div class="panel-bar"></div></div>
                <div style="padding:20px; display:grid; grid-template-columns:repeat(4,1fr); gap:20px; text-align:center; font-size:12px; color:#8e8e93;">
                    <div onclick="alert('请在相册功能中上传表情包')">表情包</div>
                    <div onclick="alert('请选择图库图片')">相册</div>
                    <div onclick="openRedPacket()">红包</div>
                    <div onclick="openTransfer()">转账</div>
                    <div onclick="alert('链接已识别')">文件</div>
                    <div onclick="promptLocation()">位置</div>
                </div>
            </div>

            <!-- 聊天设置半窗 -->
            <div id="chatDetailPanel" class="liquid-half-panel">
                <div class="panel-close-area" onclick="showChatDetail()"><div class="panel-bar"></div></div>
                <div style="padding:0 25px 40px; overflow-y:auto;">
                    <div style="font-size:20px; font-weight:700; margin:10px 0 20px;">聊天详情</div>
                    <div style="background:#fff; padding:15px; border-radius:15px; margin-bottom:15px;">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">API消耗详情</div>
                        <div style="font-size:13px; line-height:1.8;">全部点数：1200<br>线上聊天：100 | 线下聊天：50<br>生成图片：200 | 语音：20</div>
                    </div>
                    <div style="background:#fff; padding:15px; border-radius:15px; margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span>自动总结 (50轮)</span>
                            <span style="font-size:12px; color:#8e8e93;">手动 ></span>
                        </div>
                        <input type="range" style="width:100%; height:4px; background:#000; appearance:none;">
                    </div>
                    <button class="btn-white" style="width:100%; color:#ff3b30; font-weight:700;" onclick="clearHistory()">清空聊天记录</button>
                </div>
            </div>
        </div>
    `;
};

// ===== 6. 发送与 API 逻辑 =====
window.sendMsg = async function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    appendBubble(text, 'user');
    input.value = '';

    // 显示“输入中…”
    document.getElementById('inputStatus').style.display = 'block';
    document.getElementById('chattingName').style.display = 'none';

    // 真正的请求逻辑
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if (!baseUrl || !apiKey) {
        appendBubble("系统：请在主设置页面配置API信息。", "narration");
        return;
    }

    try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: `角色扮演中。回复禁止超20字。严禁emoji。结尾必须带状态JSON：{"mood":"心情","favorability":10,"action":"动作","thought":"想法"}` },
                    { role: 'user', content: text }
                ]
            })
        });

        const data = await response.json();
        document.getElementById('inputStatus').style.display = 'none';
        document.getElementById('chattingName').style.display = 'block';

        if (data.choices && data.choices[0]) {
            let content = data.choices[0].message.content;
            
            // 解析状态 JSON
            const jsonMatch = content.match(/\{.*\}/);
            if (jsonMatch) {
                try {
                    const st = JSON.parse(jsonMatch[0]);
                    ChatSystemData.mental = st;
                    updatePeekUI();
                    content = content.replace(jsonMatch[0], '').trim();
                } catch(e) {}
            }
            appendBubble(content, 'assistant');
        }
    } catch (e) {
        appendBubble("系统：API链接超时。", "narration");
    }
};

function appendBubble(text, role) {
    const box = document.getElementById('msgBox');
    if (!box) return;
    const div = document.createElement('div');
    const isNarration = text.startsWith('(') || text.startsWith('（');
    
    if (isNarration) {
        div.className = 'bubble bubble-narration';
    } else {
        div.className = `bubble bubble-${role}`;
    }
    
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// ===== 7. 多交互面板实现 (红包/转账/位置) =====
window.openRedPacket = function() {
    const amount = prompt("请输入红包金额 (0.01 - 200):");
    if (!amount || isNaN(amount)) return;
    const note = prompt("备注 (可不填):") || "恭喜发财";
    
    ChatSystemData.balance -= parseFloat(amount);
    appendBubble(`用户发出了一个 [红包]`, 'narration');
    const box = document.getElementById('msgBox');
    const card = document.createElement('div');
    card.className = 'bill-card';
    card.style.alignSelf = 'flex-end';
    card.innerHTML = `
        <div class="bill-header">🧧 红包</div>
        <div class="bill-body">${note}</div>
        <div class="bill-footer">金额: ${amount} | 点击领取</div>
    `;
    box.appendChild(card);
};

window.openTransfer = function() {
    const amount = prompt("请输入转账金额:");
    if (!amount || isNaN(amount)) return;
    ChatSystemData.balance -= parseFloat(amount);
    const box = document.getElementById('msgBox');
    const card = document.createElement('div');
    card.className = 'bill-card';
    card.style.alignSelf = 'flex-end';
    card.style.background = '#000';
    card.innerHTML = `
        <div class="bill-header">转账</div>
        <div class="bill-body">¥ ${amount}</div>
        <div class="bill-footer">点击确认收款</div>
    `;
    box.appendChild(card);
};

window.promptLocation = function() {
    const loc = prompt("输入当前地点:");
    const dist = prompt("与角色相距 (如：100米):");
    appendBubble(`(当前位置：${loc}，距离你：${dist})`, 'narration');
};

// ===== 8. UI 辅助函数 =====
window.toggleAddMenu = () => document.getElementById('addMenu').classList.toggle('active');
window.showChatDetail = () => document.getElementById('chatDetailPanel').classList.toggle('active');
window.togglePeek = () => {
    const p = document.getElementById('peekWindow');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
};
function updatePeekUI() {
    document.getElementById('p-mood').innerText = ChatSystemData.mental.mood;
    document.getElementById('p-fav').innerText = ChatSystemData.mental.favorability;
    document.getElementById('p-act').innerText = ChatSystemData.mental.action;
    document.getElementById('p-tht').innerText = ChatSystemData.mental.thought;
}

// ===== 9. 其他板块简易实现 =====
function renderContactList(c) {
    c.innerHTML = `
        <div style="background:#fff;">
            <div style="padding:15px; border-bottom:0.5px solid #f0f0f0; font-weight:600;">新的朋友 <span style="float:right; color:#ccc;">></span></div>
            <div style="background:#f2f2f7; padding:5px 15px; font-size:12px; color:#8e8e93;">Z</div>
            <div style="padding:15px; display:flex; align-items:center; gap:10px;">
                <div style="width:36px; height:36px; background:#000; border-radius:8px;"></div>
                <span>枝玉</span>
            </div>
        </div>
        <div style="position:fixed; right:5px; top:120px; font-size:10px; display:flex; flex-direction:column; gap:2px; font-weight:700;">
            <span>A</span><span>B</span><span>C</span><span>Z</span><span>#</span>
        </div>
    `;
}

function renderMoments(c) {
    c.innerHTML = `
        <div style="height:200px; background:#aaa; position:relative;">
            <div style="position:absolute; right:15px; bottom:-20px; display:flex; align-items:flex-end; gap:12px;">
                <span style="color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.5); font-weight:700; margin-bottom:20px;">用户</span>
                <div style="width:70px; height:70px; background:#eee; border-radius:12px; border:2px solid #fff;"></div>
            </div>
        </div>
        <div style="padding:40px 20px; color:#8e8e93; text-align:center;">暂无动态</div>
    `;
}

function renderMePage(c) {
    c.innerHTML = `
        <div style="background:#fff; padding:30px; display:flex; flex-direction:column; align-items:center; border-bottom:0.5px solid #eee;">
            <div style="width:80px; height:80px; background:#f2f2f7; border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:40px; color:#ccc;">+</div>
            <div style="margin-top:15px; font-size:20px; font-weight:700;">${ChatSystemData.userName}</div>
        </div>
        <div style="margin-top:10px; background:#fff;">
            <div style="padding:15px; border-bottom:0.5px solid #f0f0f0;">服务 (钱包余额: ${ChatSystemData.balance.toFixed(2)}) <span style="float:right;">></span></div>
            <div style="padding:15px; border-bottom:0.5px solid #f0f0f0;">收藏 <span style="float:right;">></span></div>
            <div style="padding:15px;">设置 <span style="float:right;">></span></div>
        </div>
    `;
}

window.clearHistory = () => { if(confirm("确定清空？")) document.getElementById('msgBox').innerHTML = ''; };
