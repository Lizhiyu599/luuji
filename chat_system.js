/**
 * 玉界 - 微信风格移动端聊天系统 (重构修复版)
 * 严格执行十步重构计划
 */

// ===== 1. 基础配置与数据持久化 (第四、五步) =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    userName: "用户",
    activeTab: 'chats',
    // 默认联系人 (第二、八步)
    contacts: [
        { id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。', letter: 'Z' }
    ],
    // 心理状态 (第七步)
    mental: { mood: "期待", favorability: 85, action: "正在查看消息", thought: "希望能帮到你。" }
};

// ===== 2. 样式重构 (第一、三、六、七步) =====
const injectStyles = () => {
    const styleId = 'chat-rebuild-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
        /* 布局修复：标准三段式 */
        .wx-wrapper {
            display: flex; flex-direction: column; height: 100%; width: 100%;
            background: #f2f2f7; position: relative; overflow: hidden; font-family: sans-serif;
        }
        .wx-header {
            flex-shrink: 0; height: 50px; display: flex; justify-content: space-between;
            align-items: center; padding: 0 16px; background: #f2f2f7; border-bottom: 0.5px solid rgba(0,0,0,0.1);
        }
        .wx-content {
            flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
        }
        .wx-tabbar {
            flex-shrink: 0; height: 60px; display: flex; justify-content: space-around;
            align-items: center; background: #f7f7f7; border-top: 0.5px solid rgba(0,0,0,0.1);
            padding-bottom: env(safe-area-inset-bottom);
        }

        /* Tab栏视觉修复 (第六步) */
        .tab-item { font-size: 14px; color: #8e8e93; font-weight: 500; cursor: pointer; text-align: center; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* 聊天窗口层级 (第三步) */
        #singleChatOverlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #f2f2f7; z-index: 2000; display: none; flex-direction: column;
        }

        /* 气泡样式 */
        .bubble { max-width: 75%; padding: 10px 14px; border-radius: 12px; font-size: 15px; margin-bottom: 12px; position: relative; line-height: 1.4; }
        .bubble-user { align-self: flex-end; background: #000; color: #fff; border-bottom-right-radius: 2px; }
        .bubble-assistant { align-self: flex-start; background: #fff; color: #000; border: 0.5px solid #ddd; border-bottom-left-radius: 2px; }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; }

        /* 头像组件 */
        .u-avatar {
            width: 48px; height: 48px; border-radius: 8px; background: #000; color: #fff;
            display: flex; align-items: center; justify-content: center; font-weight: 700;
            background-size: cover; background-position: center; flex-shrink: 0;
        }

        /* 状态浮窗：液态玻璃 (第七步) */
        .liquid-glass-modal {
            position: absolute; top: 60px; right: 10px; width: 220px;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.6);
            border-radius: 20px; padding: 16px; z-index: 2500; display: none;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .status-line { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        /* 通讯录索引 (第八步) */
        .letter-index { position: fixed; right: 4px; top: 100px; display: flex; flex-direction: column; gap: 4px; font-size: 10px; font-weight: 700; color: #555; }
    `;
    document.head.appendChild(style);
};

// ===== 3. 初始化入口：接管系统 (第一步) =====
window.openApp = function(appName) {
    injectStyles();
    const appContent = document.getElementById('appContent');
    const appWindow = document.getElementById('genericAppWindow');
    if (!appContent) return;

    appWindow.style.display = 'flex';
    appContent.style.padding = '0'; // 消除外层间距

    if (appName === 'chat') {
        appContent.innerHTML = `
            <div class="wx-wrapper">
                <div class="wx-header" id="wxMainHeader">
                    <div style="font-size:18px; font-weight:700;" id="wxTitle">聊天</div>
                    <div style="font-size:22px; cursor:pointer;" onclick="alert('功能：加好友/扫码')">+</div>
                </div>
                
                <div class="wx-content" id="wxBody"></div>

                <div class="wx-tabbar">
                    <div class="tab-item active" onclick="window.switchChatTab('chats', this)">聊天</div>
                    <div class="tab-item" onclick="window.switchChatTab('contacts', this)">通讯录</div>
                    <div class="tab-item" onclick="window.switchChatTab('moments', this)">动态</div>
                    <div class="tab-item" onclick="window.switchChatTab('me', this)">我</div>
                </div>

                <!-- 单聊全屏层 (第三步) -->
                <div id="singleChatOverlay"></div>
            </div>
            <input type="file" id="avatarPicker" style="display:none" accept="image/*">
            <input type="file" id="bgPicker" style="display:none" accept="image/*">
        `;
        window.switchChatTab('chats');
    }
};

// ===== 4. Tab 切换系统 (第二、六、八步) =====
window.switchChatTab = function(tab, el) {
    const body = document.getElementById('wxBody');
    const title = document.getElementById('wxTitle');
    if (!body) return;

    // UI 状态切换
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }

    if (tab === 'chats') {
        title.innerText = "聊天";
        renderChatList(body);
    } else if (tab === 'contacts') {
        title.innerText = "通讯录";
        renderContactList(body);
    } else if (tab === 'moments') {
        title.innerText = "动态";
        renderMoments(body);
    } else if (tab === 'me') {
        title.innerText = "我";
        renderMePage(body);
    }
};

// ===== 5. 聊天记录与单聊修复 (第二、三步) =====
function renderChatList(container) {
    container.innerHTML = `
        <div style="background:#fff;">
            ${ChatConfig.contacts.map(c => `
                <div style="padding:12px 16px; display:flex; gap:12px; border-bottom:0.5px solid #f0f0f0;" onclick="window.enterSingleChat('${c.id}')">
                    <div class="u-avatar">${c.avatar}</div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:700; font-size:16px;">${c.name}</span>
                            <span style="color:#b2b2b2; font-size:12px;">刚刚</span>
                        </div>
                        <div style="color:#8e8e93; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${c.bio}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.enterSingleChat = function(id) {
    const contact = ChatConfig.contacts.find(c => c.id === id);
    const overlay = document.getElementById('singleChatOverlay');
    overlay.style.display = 'flex';
    
    overlay.innerHTML = `
        <div class="wx-header">
            <div onclick="window.closeSingleChat()" style="cursor:pointer; font-size:20px;"> < </div>
            <div style="text-align:center;">
                <div style="font-weight:700;">${contact.name}</div>
                <div id="wxBotStatus" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
            </div>
            <div style="font-size:20px; cursor:pointer;" onclick="window.toggleMentalStatus()">ᥫ᭡</div>
        </div>
        <div id="wxChatBox" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column; 
            background-size:cover; background-position:center; 
            background-image:url(${ChatConfig.chatBg});">
            <div class="bubble bubble-narration">与 ${contact.name} 聊天中</div>
        </div>
        <div style="padding:10px 16px 25px; background:#f7f7f7; border-top:0.5px solid #ddd; display:flex; align-items:center; gap:12px;">
            <div style="font-size:24px; color:#8e8e93; cursor:pointer;" onclick="window.triggerBgPicker()">+</div>
            <input type="text" id="wxInput" style="flex:1; border:none; background:#fff; border-radius:8px; padding:10px; outline:none;" placeholder="发送消息…" onkeypress="if(event.key==='Enter') window.wxSend()">
            <div style="font-weight:700; color:#000;" onclick="window.wxSend()">发送</div>
        </div>

        <!-- 状态浮窗 (第七步) -->
        <div id="mentalStatus" class="liquid-glass-modal" onclick="this.style.display='none'">
            <div style="font-weight:800; font-size:15px; margin-bottom:10px;">窥视ta...</div>
            <div style="font-size:11px; color:#8e8e93;">心情</div><div style="font-size:13px;">${ChatConfig.mental.mood}</div><div class="status-line"></div>
            <div style="font-size:11px; color:#8e8e93;">好感值</div><div style="font-size:13px;">${ChatConfig.mental.favorability}</div><div class="status-line"></div>
            <div style="font-size:11px; color:#8e8e93;">当前动作</div><div style="font-size:13px;">${ChatConfig.mental.action}</div><div class="status-line"></div>
            <div style="font-size:11px; color:#8e8e93;">内心想法</div><div style="font-size:13px;">${ChatConfig.mental.thought}</div>
        </div>
    `;
};

window.closeSingleChat = () => { document.getElementById('singleChatOverlay').style.display = 'none'; };

// ===== 6. 消息发送与背景图 (第五步) =====
window.wxSend = function() {
    const input = document.getElementById('wxInput');
    const box = document.getElementById('wxChatBox');
    const text = input.value.trim();
    if (!text) return;

    appendBubble(box, 'user', text);
    input.value = '';

    // 简单回复模拟
    document.getElementById('wxBotStatus').style.display = 'block';
    setTimeout(() => {
        document.getElementById('wxBotStatus').style.display = 'none';
        appendBubble(box, 'assistant', "消息已送达。");
    }, 1000);
};

function appendBubble(box, role, text) {
    const div = document.createElement('div');
    const isNar = text.startsWith('(') || text.startsWith('（');
    div.className = isNar ? 'bubble bubble-narration' : `bubble bubble-${role}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// ===== 7. 通讯录与索引系统 (第八步) =====
function renderContactList(container) {
    container.innerHTML = `
        <div style="background:#fff;">
            <div style="padding:14px 16px; border-bottom:0.5px solid #f0f0f0;">新的朋友 <span style="float:right; color:#ccc;">></span></div>
            <div style="background:#f2f2f7; padding:4px 16px; font-size:12px; color:#8e8e93;">Z</div>
            <div style="padding:10px 16px; display:flex; align-items:center; gap:12px;" onclick="window.enterSingleChat('c1')">
                <div class="u-avatar" style="width:36px; height:36px; border-radius:4px;">枝</div>
                <span style="font-weight:500;">枝玉</span>
            </div>
        </div>
        <div class="letter-index">
            <span>↑</span><span>☆</span><span>A</span><span>B</span><span>C</span><span>Z</span><span>#</span>
        </div>
    `;
}

// ===== 8. 我的页面与头像系统 (第四步) =====
function renderMePage(container) {
    const avatarStyle = ChatConfig.userAvatar ? `background-image:url(${ChatConfig.userAvatar}); font-size:0;` : '';
    container.innerHTML = `
        <div style="background:#fff; padding:30px 16px; display:flex; align-items:center; gap:16px; border-bottom:0.5px solid #f0f0f0; margin-bottom:10px;" onclick="window.triggerAvatarPicker()">
            <div id="meAvatar" class="u-avatar" style="width:64px; height:64px; border-radius:12px; ${avatarStyle}">我</div>
            <div style="flex:1;">
                <div style="font-size:20px; font-weight:700;">${ChatConfig.userName}</div>
                <div style="color:#8e8e93; font-size:13px; margin-top:4px;">微信号：yujie_668</div>
            </div>
            <div style="color:#ccc;"> > </div>
        </div>
        <div style="background:#fff;">
            <div style="padding:14px 16px; border-bottom:0.5px solid #f0f0f0;">服务 <span style="float:right; color:#ccc;">></span></div>
            <div style="padding:14px 16px;">设置 <span style="float:right; color:#ccc;">></span></div>
        </div>
    `;
}

// ===== 9. 全局联动：头像与背景修改 (第四、五步) =====
window.triggerAvatarPicker = function() {
    const picker = document.getElementById('avatarPicker');
    picker.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const data = ev.target.result;
                ChatConfig.userAvatar = data;
                localStorage.setItem('yujie_user_avatar', data);
                // 同步更新UI
                const meAv = document.getElementById('meAvatar');
                if (meAv) {
                    meAv.style.backgroundImage = `url(${data})`;
                    meAv.innerText = '';
                }
                alert('头像修改成功');
            };
            reader.readAsDataURL(file);
        }
    };
    picker.click();
};

window.triggerBgPicker = function() {
    const picker = document.getElementById('bgPicker');
    picker.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const data = ev.target.result;
                ChatConfig.chatBg = data;
                localStorage.setItem('yujie_chat_bg', data);
                const box = document.getElementById('wxChatBox');
                if (box) box.style.backgroundImage = `url(${data})`;
                alert('聊天背景已更新');
            };
            reader.readAsDataURL(file);
        }
    };
    picker.click();
};

window.toggleMentalStatus = function() {
    const m = document.getElementById('mentalStatus');
    if (m) m.style.display = (m.style.display === 'block' ? 'none' : 'block');
};

// 朋友圈存根
function renderMoments(c) {
    const av = ChatConfig.userAvatar ? `background-image:url(${ChatConfig.userAvatar}); font-size:0;` : '';
    c.innerHTML = `
        <div style="height:200px; background:#aaa; position:relative; background-size:cover; background-image:url('https://via.placeholder.com/400x200');">
            <div style="position:absolute; right:12px; bottom:-20px; display:flex; align-items:flex-end; gap:12px;">
                <span style="color:#fff; font-weight:700; text-shadow:0 1px 3px rgba(0,0,0,0.5); margin-bottom:25px;">${ChatConfig.userName}</span>
                <div class="u-avatar" style="width:70px; height:70px; border:2px solid #fff; border-radius:12px; ${av}">我</div>
            </div>
        </div>
        <div style="padding:60px 20px; text-align:center; color:#8e8e93;">朋友圈动态加载中...</div>
    `;
}

console.log("玉界：微信风格聊天系统重构修复完毕。");
