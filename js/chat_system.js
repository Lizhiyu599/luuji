/* 
 * 玉界 - 微信风移动端聊天系统 (chat_system.js)
 * 修复：底部标签栏固定、联系人点击响应、头像图片上传、层级遮挡
 */

// ===== 1. 全局配置 (保留并扩展) =====
window.ChatConfig = {
    user: {
        name: "用户",
        avatar: null, // 存储图片Base64，若为null则显示文字
        balance: 5200.00
    },
    contacts: [
        { id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。', letters: 'Z' },
        { id: 'c2', name: '系统助手', avatar: '系', bio: '欢迎来到玉界。', letters: 'X' }
    ],
    activeTab: 'chats',
    mental: { mood: "平静", favorability: 80, action: "无", thought: "无" }
};

// ===== 2. 样式注入 (修复布局稳定性) =====
const injectGlobalStyles = () => {
    const styleId = 'chat-stable-ui-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        /* 核心三段式布局 */
        .chat-app-wrapper {
            display: flex; flex-direction: column; height: 100%; width: 100%;
            background: #f2f2f7; position: relative; overflow: hidden;
        }
        .chat-app-header {
            flex-shrink: 0; height: 50px; display: flex; justify-content: space-between;
            align-items: center; padding: 0 16px; background: #f2f2f7;
            border-bottom: 0.5px solid rgba(0,0,0,0.1); z-index: 10;
        }
        .chat-app-content {
            flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        }
        .chat-app-tabbar {
            flex-shrink: 0; height: 60px; display: flex; justify-content: space-around;
            align-items: center; background: rgba(246,246,246,0.9);
            backdrop-filter: blur(20px); border-top: 0.5px solid rgba(0,0,0,0.1); padding-bottom: env(safe-area-inset-bottom);
        }

        /* 标签项 */
        .tab-btn { font-size: 14px; color: #8e8e93; font-weight: 500; cursor: pointer; text-align: center; width: 25%; }
        .tab-btn.active { color: #07c160; font-weight: 700; }

        /* 通用头像 */
        .avatar-box {
            width: 48px; height: 48px; border-radius: 8px; background: #000;
            color: #fff; display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 18px; overflow: hidden; background-size: cover; background-position: center;
        }

        /* 单聊窗口：最高层级 */
        #singleChatWindow {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #f2f2f7; z-index: 1000; display: none; flex-direction: column;
        }

        /* 气泡样式 */
        .chat-bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 15px; margin-bottom: 12px; line-height: 1.4; word-break: break-all; }
        .bubble-assistant { align-self: flex-start; background: #fff; color: #000; border: 0.5px solid #ddd; }
        .bubble-user { align-self: flex-end; background: #000; color: #fff; }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 12px; }

        /* 半窗设置 */
        .liquid-panel {
            position: absolute; bottom: 0; width: 100%; height: 75%;
            background: rgba(255,255,255,0.7); backdrop-filter: blur(30px);
            border-radius: 24px 24px 0 0; transform: translateY(100%);
            transition: transform 0.3s ease; z-index: 1100;
        }
        .liquid-panel.active { transform: translateY(0); }
    `;
    document.head.appendChild(style);
};

// ===== 3. 初始化入口 =====
window.openApp = function(appName) {
    injectGlobalStyles();
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    const appTitle = document.getElementById('appTitle');

    if (!appWindow || !appContent) return;

    appWindow.style.display = 'flex';
    appTitle.innerText = '聊天';
    appContent.style.padding = '0';
    appContent.style.height = '100%';

    // 构建HTML框架
    appContent.innerHTML = `
        <div class="chat-app-wrapper">
            <div class="chat-app-header">
                <div style="font-size:18px; font-weight:700;" id="chatMainTitle">聊天</div>
                <div style="font-size:24px; cursor:pointer;" onclick="window.showPlusMenu()">+</div>
            </div>
            
            <div class="chat-app-content" id="chatScrollArea"></div>

            <div class="chat-app-tabbar">
                <div class="tab-btn active" onclick="window.switchChatTab('chats', this)">聊天</div>
                <div class="tab-btn" onclick="window.switchChatTab('contacts', this)">联系人</div>
                <div class="tab-btn" onclick="window.switchChatTab('moments', this)">动态</div>
                <div class="tab-btn" onclick="window.switchChatTab('me', this)">我的</div>
            </div>

            <!-- 挂载单聊窗口 -->
            <div id="singleChatWindow"></div>
        </div>
        <input type="file" id="globalAvatarInput" style="display:none" accept="image/*">
    `;
    
    window.switchChatTab('chats');
};

// ===== 4. 标签切换逻辑 =====
window.switchChatTab = function(tabName, el) {
    const area = document.getElementById('chatScrollArea');
    const title = document.getElementById('chatMainTitle');
    if (!area) return;

    // 更新Tab样式
    if (el) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }

    ChatConfig.activeTab = tabName;

    if (tabName === 'chats') {
        title.innerText = '聊天';
        renderChats(area);
    } else if (tabName === 'contacts') {
        title.innerText = '通讯录';
        renderContacts(area);
    } else if (tabName === 'moments') {
        title.innerText = '动态';
        renderMoments(area);
    } else if (tabName === 'me') {
        title.innerText = '我';
        renderMe(area);
    }
};

// ===== 5. 渲染页面逻辑 =====

// 消息列表
function renderChats(container) {
    container.innerHTML = `
        <div style="padding:0;">
            ${ChatConfig.contacts.map(c => `
                <div style="background:#fff; padding:12px 16px; display:flex; align-items:center; gap:12px; border-bottom:0.5px solid #eee;" onclick="window.enterSingleChat('${c.id}')">
                    <div class="avatar-box" style="${c.avatar.length > 2 ? `background-image:url(${c.avatar})` : ''}">${c.avatar.length <= 2 ? c.avatar : ''}</div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600; font-size:16px;">${c.name}</span>
                            <span style="color:#b2b2b2; font-size:12px;">刚刚</span>
                        </div>
                        <div style="color:#8e8e93; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.bio}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// 通讯录
function renderContacts(container) {
    container.innerHTML = `
        <div style="background:#fff;">
            <div style="padding:14px 16px; border-bottom:0.5px solid #eee;">新的朋友 <span style="float:right; color:#ccc;">></span></div>
            <div style="padding:14px 16px; border-bottom:0.5px solid #eee;">群聊 <span style="float:right; color:#ccc;">></span></div>
            <div style="background:#f2f2f7; padding:5px 16px; font-size:12px; color:#8e8e93;">A-Z</div>
            ${ChatConfig.contacts.map(c => `
                <div style="background:#fff; padding:10px 16px; display:flex; align-items:center; gap:12px; border-bottom:0.5px solid #eee;" onclick="window.enterSingleChat('${c.id}')">
                    <div class="avatar-box" style="width:36px; height:36px; border-radius:4px; ${c.avatar.length > 2 ? `background-image:url(${c.avatar})` : ''}">${c.avatar.length <= 2 ? c.avatar : ''}</div>
                    <span style="font-weight:500;">${c.name}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// 我的页面 (包含头像上传)
function renderMe(container) {
    const u = ChatConfig.user;
    container.innerHTML = `
        <div style="background:#fff; padding:30px 16px; display:flex; align-items:center; gap:16px; border-bottom:0.5px solid #eee; margin-bottom:10px;" onclick="window.triggerAvatarUpload()">
            <div id="meAvatar" class="avatar-box" style="width:64px; height:64px; border-radius:12px; background:#f2f2f7; color:#ccc; ${u.avatar ? `background-image:url(${u.avatar})` : ''}">
                ${!u.avatar ? '用户' : ''}
            </div>
            <div style="flex:1;">
                <div style="font-size:20px; font-weight:700; margin-bottom:4px;">${u.name}</div>
                <div style="color:#8e8e93; font-size:14px;">微信号：yujie_668</div>
            </div>
            <div style="color:#ccc;"> > </div>
        </div>
        <div style="background:#fff;">
            <div style="padding:14px 16px; border-bottom:0.5px solid #eee;">服务 <span style="float:right; color:#8e8e93; font-size:14px;">钱包余额: ${u.balance.toFixed(2)} ></span></div>
            <div style="padding:14px 16px; border-bottom:0.5px solid #eee;">收藏 <span style="float:right; color:#ccc;">></span></div>
            <div style="padding:14px 16px;">设置 <span style="float:right; color:#ccc;">></span></div>
        </div>
    `;
}

// ===== 6. 核心交互函数 (挂载到window) =====

// 打开单聊窗口
window.enterSingleChat = function(id) {
    const contact = ChatConfig.contacts.find(c => c.id === id);
    const win = document.getElementById('singleChatWindow');
    if (!win) return;

    win.innerHTML = `
        <div class="chat-app-header" style="background:#f2f2f7;">
            <div onclick="window.closeSingleChat()" style="cursor:pointer; font-size:20px;"> < </div>
            <div style="text-align:center;">
                <div style="font-weight:700;">${contact.name}</div>
                <div id="botStatus" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
            </div>
            <div style="font-size:20px; cursor:pointer;" onclick="window.showChatSetting()"> > </div>
        </div>
        <div id="messageFlow" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; background:#f2f2f7;">
            <div class="chat-bubble bubble-narration">现在可以开始聊天了</div>
        </div>
        <div style="padding:10px 16px 25px; background:#f6f6f6; border-top:0.5px solid #ddd; display:flex; align-items:center; gap:12px;">
            <div style="font-size:24px; color:#8e8e93;">+</div>
            <input type="text" id="chatMsgInput" style="flex:1; border:none; background:#fff; border-radius:8px; padding:10px; outline:none;" placeholder="发送消息…" onkeypress="if(event.key==='Enter') window.sendMessage()">
            <div style="color:#07c160; font-weight:700;" onclick="window.sendMessage()">发送</div>
        </div>
    `;
    win.style.display = 'flex';
};

window.closeSingleChat = function() {
    document.getElementById('singleChatWindow').style.display = 'none';
};

// 发送消息
window.sendMessage = async function() {
    const input = document.getElementById('chatMsgInput');
    const flow = document.getElementById('messageFlow');
    const text = input.value.trim();
    if (!text) return;

    // 用户消息
    appendBubble(flow, 'user', text);
    input.value = '';

    // 模拟AI回复 (调用原有API逻辑)
    document.getElementById('botStatus').style.display = 'block';
    
    // 延迟模拟
    setTimeout(() => {
        document.getElementById('botStatus').style.display = 'none';
        appendBubble(flow, 'assistant', "收到，我是" + ChatConfig.contacts[0].name);
    }, 1500);
};

function appendBubble(container, role, text) {
    const div = document.createElement('div');
    div.className = `chat-bubble bubble-${role}`;
    div.innerText = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// 头像上传逻辑
window.triggerAvatarUpload = function() {
    const input = document.getElementById('globalAvatarInput');
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                ChatConfig.user.avatar = ev.target.result;
                const meAvatar = document.getElementById('meAvatar');
                if (meAvatar) {
                    meAvatar.style.backgroundImage = `url(${ev.target.result})`;
                    meAvatar.innerText = '';
                }
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
};

window.showPlusMenu = function() { alert('1. 加好友\n2. 扫一扫\n3. 收付款'); };
window.showChatSetting = function() { alert('聊天设置：清空记录 / 投诉'); };
window.renderMoments = function(c) {
    c.innerHTML = `<div style="height:200px; background:#888; position:relative;">
        <div style="position:absolute; right:15px; bottom:-20px; display:flex; align-items:flex-end; gap:12px;">
            <span style="color:#fff; font-weight:700; margin-bottom:20px; text-shadow:0 1px 3px rgba(0,0,0,0.5);">用户</span>
            <div class="avatar-box" style="width:70px; height:70px; border-radius:10px; border:2px solid #fff; background:#eee; ${ChatConfig.user.avatar ? `background-image:url(${ChatConfig.user.avatar})` : ''}">${!ChatConfig.user.avatar ? '我' : ''}</div>
        </div>
    </div><div style="padding:60px 20px; text-align:center; color:#8e8e93;">暂无动态</div>`;
};

// 自动执行一次
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { console.log('Chat System Ready'); });
}
