/* 
 * 玉界 - 聊天系统增强插件 (chat_system.js)
 * 修复版：增加了自动初始化逻辑，确保加载即运行
 * 风格：iOS iMessage / 液态玻璃 / 纯文字标签 / 禁止 Emoji
 */

// ===== 1. 全局配置 (不允许删除) =====
const ChatConfig = {
    userAvatar: '',
    userName: '用户',
    walletBalance: 5200.00,
    activeChatId: 'dev1',
    messages: {}, 
    contacts: [
        { id: 'dev1', name: '枝玉', bio: '你好，我是开发者枝玉。', avatar: '枝', status: 'online' }
    ],
    moments: [],
    settings: {
        replyCount: [1, 3], 
        showNarration: true,
        pronoun: '我', 
        globalWallpaper: ''
    }
};

// ===== 2. 注入专用CSS样式 (确保UI结构正确) =====
const style = document.createElement('style');
style.innerHTML = `
/* 移除所有emoji干扰 */
* { font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif; }

.msg-bubble {
    max-width: 75%; padding: 10px 16px; border-radius: 20px; font-size: 15px; 
    line-height: 1.4; position: relative; margin-bottom: 12px; transition: transform 0.2s;
}
/* 助手：黑色液态玻璃 + 白色文字 */
.msg-assistant {
    align-self: flex-start; background: rgba(0, 0, 0, 0.85); color: #ffffff;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom-left-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}
/* 用户：白色液态玻璃 + 黑色文字 */
.msg-user {
    align-self: flex-end; background: rgba(255, 255, 255, 0.7); color: #000000;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8); border-bottom-right-radius: 4px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05);
}
/* 旁白：居中无气泡 */
.msg-narration {
    align-self: center; color: #8e8e93; font-size: 13px; text-align: center;
    margin: 15px 0; max-width: 90%; background: none !important; backdrop-filter: none !important; box-shadow: none !important;
}

/* 详情半窗设置 */
.half-panel {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(35px);
    -webkit-backdrop-filter: blur(35px); z-index: 1000; transform: translateY(100%);
    transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
    display: flex; flex-direction: column;
}
.half-panel.active { transform: translateY(0); }
.half-panel-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.2); border-radius: 3px; margin: 12px auto; cursor: pointer; }

/* 底部标签栏 - 纯文字，无图标 */
.chat-tab-bar {
    height: 65px; display: flex; justify-content: space-around; align-items: center;
    background: rgba(242, 242, 247, 0.85); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(0,0,0,0.1); padding-bottom: 10px;
}
.chat-tab-item { font-size: 15px; font-weight: 500; color: #8e8e93; cursor: pointer; transition: 0.2s; }
.chat-tab-item.active { color: #000000; font-weight: 700; }

/* 状态浮窗 */
.status-peek {
    position: absolute; top: 70px; right: 20px; width: 220px;
    background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(255,255,255,0.7);
    backdrop-filter: blur(25px); border-radius: 24px; padding: 18px; z-index: 1100;
    box-shadow: 0 12px 40px rgba(0,0,0,0.1); display: none;
}
.status-row { padding: 10px 0; border-bottom: 0.5px dashed rgba(0,0,0,0.1); }
.status-label { font-size: 11px; color: #8e8e93; margin-bottom: 4px; }
.status-value { font-size: 13px; color: #000; font-weight: 600; }

.btn-black { background: #000; color: #fff; border: none; border-radius: 12px; padding: 12px; cursor: pointer; font-weight: 600; }
.btn-white { background: #fff; color: #000; border: 1px solid #e5e5ea; border-radius: 12px; padding: 12px; cursor: pointer; }
`;
document.head.appendChild(style);

// ===== 3. 核心函数覆盖与增强 =====

window.openApp = function(appName) {
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    
    if (!appWindow || !appContent) {
        console.error("致命错误：HTML中未找到 genericAppWindow 或 appContent 容器。");
        return;
    }

    // 显示应用窗口
    appWindow.style.display = 'flex';
    appContent.innerHTML = ''; 
    appContent.style.padding = '0';
    appContent.style.height = '100%';

    if (appName === 'chat') {
        renderChatContainer(appContent);
    } else {
        appContent.innerHTML = `<div style="padding:100px 20px; text-align:center; color:#8e8e93;">${appName} 正在开发中...</div>`;
    }
};

function renderChatContainer(container) {
    container.innerHTML = `
        <div id="chatMainWrap" style="flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative; height:100%;">
            <!-- 顶部导航 -->
            <div id="chatHeader" style="height:60px; display:flex; justify-content:space-between; align-items:center; padding:15px 20px 0; border-bottom:0.5px solid rgba(0,0,0,0.05); background:#f2f2f7;">
                <span style="font-size:20px; font-weight:800;" id="chatNavTitle">聊天</span>
                <span style="font-size:26px; cursor:pointer; font-weight:300;" onclick="showAddMenu()">+</span>
            </div>
            
            <!-- 内容视图区 -->
            <div id="chatViewArea" style="flex:1; overflow-y:auto; background:#f2f2f7;"></div>

            <!-- 底部标签栏 (只显示文字) -->
            <div class="chat-tab-bar" id="chatTabBar">
                <div class="chat-tab-item active" onclick="switchTab('chats')">聊天</div>
                <div class="chat-tab-item" onclick="switchTab('contacts')">联系人</div>
                <div class="chat-tab-item" onclick="switchTab('moments')">动态</div>
                <div class="chat-tab-item" onclick="switchTab('me')">我的</div>
            </div>
        </div>

        <div id="statusPeek" class="status-peek" onclick="this.style.display='none'">
            <div style="font-size:15px; font-weight:800; margin-bottom:12px;">窥视ta...</div>
            <div class="status-row"><div class="status-label">心情</div><div class="status-value" id="peek-mood">平静</div></div>
            <div class="status-row"><div class="status-label">好感值</div><div class="status-value" id="peek-fav">0</div></div>
            <div class="status-row"><div class="status-label">当前动作</div><div class="status-value" id="peek-action">无</div></div>
            <div class="status-row"><div class="status-label">内心想法</div><div class="status-value" id="peek-thought">无</div></div>
        </div>
    `;
    switchTab('chats');
}

window.switchTab = function(tab) {
    const view = document.getElementById('chatViewArea');
    const title = document.getElementById('chatNavTitle');
    const tabs = document.querySelectorAll('.chat-tab-item');
    if (!view) return;

    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'chats') {
        title.innerText = '聊天';
        tabs[0].classList.add('active');
        renderConversationList(view);
    } else if (tab === 'contacts') {
        title.innerText = '联系人';
        tabs[1].classList.add('active');
        renderContactsList(view);
    } else if (tab === 'moments') {
        title.innerText = '动态';
        tabs[2].classList.add('active');
        renderMomentsFeed(view);
    } else if (tab === 'me') {
        title.innerText = '我的';
        tabs[3].classList.add('active');
        renderMePage(view);
    }
};

// 会话列表
function renderConversationList(container) {
    container.innerHTML = `
        <div style="padding:5px 0;">
            ${ChatConfig.contacts.map(c => `
                <div style="background:#fff; margin-bottom:1px; padding:14px 16px; display:flex; align-items:center; gap:14px; cursor:pointer;" onclick="enterSingleChat('${c.id}')">
                    <div style="width:52px; height:52px; border-radius:14px; background:#000; color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; font-weight:800;">${c.avatar}</div>
                    <div style="flex:1; border-bottom:0.5px solid #f0f0f0; padding-bottom:10px;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span style="font-weight:700; font-size:16px;">${c.name}</span>
                            <span style="font-size:12px; color:#c7c7cc;">刚刚</span>
                        </div>
                        <div style="font-size:13px; color:#8e8e93; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.bio}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 单聊窗口
window.enterSingleChat = function(chatId) {
    const contact = ChatConfig.contacts.find(c => c.id === chatId);
    const mainWrap = document.getElementById('chatMainWrap');
    
    const chatWinHTML = `
        <div id="singleChatWindow" style="position:absolute; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:500; display:flex; flex-direction:column;">
            <!-- 聊天顶部 -->
            <div style="height:60px; display:flex; justify-content:space-between; align-items:center; padding:15px 16px 0; background:rgba(255,255,255,0.8); backdrop-filter:blur(20px); border-bottom:0.5px solid rgba(0,0,0,0.1);">
                <span onclick="exitSingleChat()" style="cursor:pointer; color:#000; font-size:22px; font-weight:300;"> < </span>
                <div style="text-align:center;" onclick="toggleChatDetails()">
                    <div id="chattingName" style="font-weight:800; font-size:17px;">${contact.name}</div>
                    <div id="chattingStatus" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
                </div>
                <div style="display:flex; gap:18px; align-items:center;">
                    <span style="font-size:22px; cursor:pointer;" onclick="togglePeekStatus()">ᥫ᭡</span>
                    <span style="font-size:18px; font-weight:700; cursor:pointer;" onclick="toggleChatDetails()"> > </span>
                </div>
            </div>

            <!-- 消息列表 -->
            <div id="chatBox" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column;">
                <div style="text-align:center; color:#c7c7cc; font-size:12px; margin-bottom:20px;">iMessage</div>
            </div>

            <!-- 输入框区域 -->
            <div style="padding:10px 16px 25px; background:#f2f2f7; border-top:0.5px solid rgba(0,0,0,0.1); display:flex; align-items:center; gap:12px;">
                <div style="width:30px; height:30px; border:1px solid #000; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:20px; font-weight:300;" onclick="toggleAddons()">+</div>
                <input type="text" id="chatMsgInput" style="flex:1; border:none; background:#fff; border-radius:20px; padding:10px 15px; outline:none; font-size:15px;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') performSend()">
                <div style="font-size:22px; cursor:pointer;" onclick="alert('语音模式')">∧</div>
                <div id="sendBtn" style="font-size:22px; color:#000; cursor:pointer; font-weight:300;" onclick="performSend()">+</div>
            </div>

            <!-- 设置详情半窗 -->
            <div id="chatDetailsPanel" class="half-panel">
                <div class="half-panel-handle" onclick="toggleChatDetails()"></div>
                <div style="flex:1; overflow-y:auto; padding:0 20px 40px;">
                    <div style="font-size:20px; font-weight:800; margin:10px 0 25px;">聊天详情</div>
                    
                    <!-- 详情内容根据提示词补全... -->
                    <div style="background:#fff; padding:18px; border-radius:20px; margin-bottom:15px; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:12px; letter-spacing:1px;">API消耗详情</div>
                        <div style="display:flex; flex-direction:column; gap:10px; font-size:14px; font-weight:500;">
                            <span>全部点数：1200</span>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px; color:#3a3a3c;">
                                <span>线上聊天：100</span>
                                <span>线下聊天：50</span>
                                <span>生成图片：200</span>
                                <span>语音：20</span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <input type="text" placeholder="此处可搜索聊天记录…" style="width:100%; border:none; background:#fff; padding:14px; border-radius:14px; font-size:14px;">
                    </div>

                    <div style="background:#fff; padding:18px; border-radius:20px; margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <span style="font-weight:600;">API总结功能 (50轮)</span>
                        </div>
                        <input type="range" min="10" max="200" value="50" style="width:100%; height:4px; background:#000; outline:none; appearance:none; border-radius:2px;">
                        <button class="btn-black" style="width:100%; margin-top:15px;">手动立即总结</button>
                    </div>

                    <button class="btn-white" style="width:100%; color:#ff3b30; font-weight:700;" onclick="alert('记录已清空')">清空聊天记录</button>
                </div>
            </div>
        </div>
    `;
    
    mainWrap.insertAdjacentHTML('beforeend', chatWinHTML);
};

window.exitSingleChat = function() {
    const win = document.getElementById('singleChatWindow');
    if (win) win.remove();
};

window.toggleChatDetails = function() {
    document.getElementById('chatDetailsPanel').classList.toggle('active');
};

window.togglePeekStatus = function() {
    const peek = document.getElementById('statusPeek');
    peek.style.display = peek.style.display === 'block' ? 'none' : 'block';
};

// 消息发送核心逻辑
window.performSend = async function() {
    const input = document.getElementById('chatMsgInput');
    const text = input.value.trim();
    if (!text) return;

    appendMsg('user', text);
    input.value = '';

    document.getElementById('chattingStatus').style.display = 'block';
    document.getElementById('chattingName').style.display = 'none';

    // 接入API
    await callChatAPI(text);
};

function appendMsg(role, text) {
    const box = document.getElementById('chatBox');
    if (!box) return;
    const msgDiv = document.createElement('div');
    
    const isNarration = text.startsWith('(') || text.startsWith('（');
    if (isNarration) {
        msgDiv.className = 'msg-bubble msg-narration';
    } else {
        msgDiv.className = `msg-bubble msg-${role}`;
    }
    
    msgDiv.innerText = text;
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
}

async function callChatAPI(userText) {
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if (!baseUrl || !apiKey) {
        appendMsg('system', '请先在系统设置中配置API');
        document.getElementById('chattingStatus').style.display = 'none';
        document.getElementById('chattingName').style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: `角色扮演。禁Emoji。回复禁超20字。必须带状态JSON：{"mood":"心情","favorability":50,"action":"动作","thought":"内心"}` },
                    { role: 'user', content: userText }
                ]
            })
        });

        const data = await response.json();
        document.getElementById('chattingStatus').style.display = 'none';
        document.getElementById('chattingName').style.display = 'block';

        if (data.choices && data.choices[0]) {
            let content = data.choices[0].message.content;
            const jsonMatch = content.match(/\{.*\}/);
            if (jsonMatch) {
                try {
                    const status = JSON.parse(jsonMatch[0]);
                    document.getElementById('peek-mood').innerText = status.mood;
                    document.getElementById('peek-fav').innerText = status.favorability;
                    document.getElementById('peek-action').innerText = status.action;
                    document.getElementById('peek-thought').innerText = status.thought;
                    content = content.replace(jsonMatch[0], '').trim();
                } catch(e) {}
            }
            appendMsg('assistant', content);
        }
    } catch (e) {
        document.getElementById('chattingStatus').style.display = 'none';
        document.getElementById('chattingName').style.display = 'block';
        appendMsg('system', 'API连接失败');
    }
}

// ===== 9. 自动启动入口 (核心修复部分) =====

function initChatSystem() {
    console.log("正在初始化聊天系统...");
    
    // 检查基础HTML结构是否准备好
    const appWindow = document.getElementById('genericAppWindow');
    if (!appWindow) {
        console.warn("未检测到 genericAppWindow，系统可能处于静态预览或HTML未完全加载。");
        return;
    }

    // 自动打开聊天应用
    window.openApp('chat');
    console.log("聊天系统已自动启动。");
}

// 确保在页面加载后自动运行
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initChatSystem);
} else {
    initChatSystem();
}

// 兜底方案：如果页面由于某种原因没有触发加载，2秒后强制检查一次
setTimeout(() => {
    const chatActive = document.getElementById('chatMainWrap');
    if (!chatActive) {
        console.log("执行兜底启动...");
        initChatSystem();
    }
}, 2000);

// 其他存根函数，防止调用报错
window.showAddMenu = function() { alert("1. 加联系人\n2. 创建群聊"); };
window.renderMomentsFeed = function(v) { v.innerHTML = '<div style="padding:40px; text-align:center; color:#8e8e93;">动态流 (Feed) 加载中...</div>'; };
window.renderMePage = function(v) { v.innerHTML = '<div style="padding:40px; text-align:center; color:#8e8e93;">个人主页建设中...</div>'; };
