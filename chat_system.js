/**
 * 玉界 - iOS Liquid Glass 顶级交互系统
 * 风格：VisionOS / iMessage / 微信结构
 * 严禁使用 Emoji 符号
 */

// ===== 1. 核心配置与持久化 =====
window.ChatStorage = {
    get: (key, def) => localStorage.getItem('yujie_' + key) || def,
    set: (key, val) => localStorage.setItem('yujie_' + key, val)
};

window.ChatConfig = {
    userName: "用户",
    userAvatar: ChatStorage.get('user_avatar', ''),
    chatBg: ChatStorage.get('chat_bg', ''),
    momentsBg: ChatStorage.get('moments_bg', ''),
    wallet: 5200.00,
    mental: { mood: "静谧", favorability: 85, action: "翻阅书卷", thought: "希望能为你提供完美的交互。" },
    settings: {
        minReply: 1, maxReply: 3, narration: true, pronoun: '我'
    }
};

// ===== 2. 样式注入 (极简、模糊、高级) =====
const injectLiquidStyles = () => {
    const styleId = 'liquid-glass-ui';
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.innerHTML = `
        /* 布局层级：底部导航栏绝对固定 */
        .liquid-root {
            display: flex; flex-direction: column; height: 100%; width: 100%;
            background: #e5e5e7; position: relative; overflow: hidden;
        }
        .liquid-body {
            flex: 1; overflow-y: auto; padding-bottom: 80px; /* 为底部导航预留 */
            -webkit-overflow-scrolling: touch;
        }
        .liquid-tabbar {
            position: fixed; bottom: 0; left: 0; width: 100%; height: 65px;
            background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px); border-top: 0.5px solid rgba(255,255,255,0.5);
            display: flex; justify-content: space-around; align-items: center;
            z-index: 100; padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-item { font-size: 14px; color: #8e8e93; font-weight: 500; cursor: pointer; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* 液态玻璃通用卡片 */
        .glass-card {
            background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.8);
            border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }

        /* 聊天气泡：iMessage Liquid */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 22px; font-size: 15px; margin-bottom: 12px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; backdrop-filter: blur(10px); border-bottom-right-radius: 4px; border: 0.5px solid #fff; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; backdrop-filter: blur(15px); border-bottom-left-radius: 4px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; }

        /* 全屏聊天层 (最高层级) */
        #chatOverlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #f2f2f7; z-index: 200; display: none; flex-direction: column;
        }

        /* iOS 半屏详情面板 */
        .bottom-sheet {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px); border-top: 0.5px solid rgba(255,255,255,0.8);
            border-radius: 30px 30px 0 0; transform: translateY(100%);
            transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); z-index: 300;
        }
        .bottom-sheet.active { transform: translateY(0); }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; }

        /* 状态浮窗 (ᥫ᭡) */
        .peek-float {
            position: absolute; top: 70px; right: 15px; width: 220px;
            background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(30px);
            border-radius: 24px; padding: 18px; z-index: 400; border: 1px solid #fff;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08); display: none;
        }
        .peek-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        /* 按钮风格 */
        .btn-glass-black { background: rgba(0,0,0,0.8); color: #fff; border: none; border-radius: 14px; padding: 12px; cursor: pointer; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 初始化与结构分配 =====
window.openApp = function(appName) {
    injectLiquidStyles();
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    if (!appWindow || !appContent) return;

    appWindow.style.display = 'flex';
    appContent.style.padding = '0';
    appContent.innerHTML = `
        <div class="liquid-root">
            <div id="mainHeader" style="height:55px; display:flex; justify-content:space-between; align-items:center; padding:15px 20px 0;">
                <span style="font-size:20px; font-weight:800;" id="pageTitle">聊天</span>
                <span style="font-size:24px; cursor:pointer;" onclick="alert('加好友/扫码')">+</span>
            </div>
            
            <div class="liquid-body" id="liquidBody"></div>

            <div class="liquid-tabbar">
                <div class="tab-item active" onclick="window.switchTab('chats', this)">聊天</div>
                <div class="tab-item" onclick="window.switchTab('contacts', this)">联系人</div>
                <div class="tab-item" onclick="window.switchTab('moments', this)">动态</div>
                <div class="tab-item" onclick="window.switchTab('me', this)">我的</div>
            </div>

            <div id="chatOverlay"></div>
            <input type="file" id="universalPicker" style="display:none" accept="image/*">
        </div>
    `;
    window.switchTab('chats');
};

// ===== 4. 标签切换逻辑 =====
window.switchTab = function(tab, el) {
    const body = document.getElementById('liquidBody');
    const title = document.getElementById('pageTitle');
    if (el) {
        document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
    }

    if (tab === 'chats') {
        title.innerText = "聊天";
        renderChatList(body);
    } else if (tab === 'contacts') {
        title.innerText = "联系人";
        renderContactList(body);
    } else if (tab === 'moments') {
        title.innerText = "动态";
        renderMoments(body);
    } else if (tab === 'me') {
        title.innerText = "我的";
        renderMe(body);
    }
};

// ===== 5. 聊天窗口实现 (核心) =====
window.enterSingleChat = function(name) {
    const overlay = document.getElementById('chatOverlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div style="height:55px; display:flex; justify-content:space-between; align-items:center; padding:15px 16px 0; background:rgba(255,255,255,0.6); backdrop-filter:blur(20px); border-bottom:0.5px solid rgba(0,0,0,0.05);">
            <span onclick="window.closeChat()" style="cursor:pointer; font-size:22px; font-weight:300;"> < </span>
            <div style="text-align:center;" onclick="window.showChatDetail()">
                <div style="font-weight:800; font-size:17px;">${name}</div>
                <div id="typing" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
            </div>
            <div style="display:flex; gap:18px; align-items:center;">
                <span style="font-size:22px; cursor:pointer;" onclick="window.toggleMental()">ᥫ᭡</span>
                <span style="font-size:20px; font-weight:700; cursor:pointer;" onclick="window.showChatDetail()"> > </span>
            </div>
        </div>

        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column; 
            background-size:cover; background-position:center; background-image:url(${ChatConfig.chatBg});">
            <div class="bubble-narration">iMessage 安全加密对话</div>
        </div>

        <div style="padding:10px 16px 30px; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.1); display:flex; align-items:center; gap:12px;">
            <div style="width:30px; height:30px; border:1px solid #000; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="alert('功能：相册/位置')">+</div>
            <input type="text" id="msgInput" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.handleSend()">
            <div style="font-size:24px; color:#8e8e93;">∧</div>
            <div style="font-size:28px; font-weight:300; cursor:pointer;" onclick="window.handleSend()">+</div>
        </div>

        <!-- 聊天详情面板 (Bottom Sheet) -->
        <div id="chatDetailSheet" class="bottom-sheet">
            <div class="sheet-handle" onclick="window.showChatDetail()"></div>
            <div style="padding:0 25px 50px; overflow-y:auto; height:100%;">
                <div style="font-size:22px; font-weight:800; margin:10px 0 25px;">聊天详情</div>
                
                <div class="glass-card" style="padding:18px; margin-bottom:15px;">
                    <div style="color:#8e8e93; font-size:11px; margin-bottom:12px;">API消耗面板</div>
                    <div style="font-size:14px; line-height:1.8;">
                        <div style="display:flex; justify-content:space-between;"><span>总点数</span> <span>1200</span></div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:10px; color:#3a3a3c;">
                            <span>线上: 100</span> <span>线下: 50</span>
                            <span>生图: 200</span> <span>语音: 20</span>
                        </div>
                    </div>
                </div>

                <input type="text" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; border-radius:14px; padding:14px; margin-bottom:15px;">

                <div class="glass-card" style="padding:18px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:15px;">
                        <span>AI总结 (50轮)</span> <span style="color:#007aff;">手动总结</span>
                    </div>
                    <input type="range" min="10" max="200" value="50" style="width:100%; height:4px; background:#000; appearance:none; border-radius:2px;">
                </div>

                <div class="glass-card" style="padding:18px; margin-bottom:15px;">
                    <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">聊天背景设置</div>
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div style="width:100px; height:60px; border:2px dashed #ccc; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:12px; color:#ccc; background-size:cover; background-image:url(${ChatConfig.chatBg});" onclick="window.pickChatBg()">点击上传</div>
                        <button class="btn-glass-black" style="flex:1;" onclick="window.clearChatBg()">清除背景</button>
                    </div>
                </div>

                <div class="glass-card" style="padding:18px; margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between;">
                        <span>旁白生成</span> <input type="checkbox" checked>
                    </div>
                </div>

                <div class="glass-card" style="padding:18px; margin-bottom:30px;">
                    <div style="color:#ff3b30; font-weight:700;" onclick="window.toggleDangerZone()">危险区 ></div>
                    <div id="dangerZone" style="display:none; margin-top:15px;">
                        <button class="btn-glass-black" style="width:100%; background:#ff3b30; margin-bottom:10px;">清空聊天记录</button>
                        <button class="btn-glass-black" style="width:100%; margin-bottom:10px;">拉黑联系人</button>
                        <button class="btn-glass-black" style="width:100%;">删除联系人</button>
                    </div>
                </div>
            </div>
        </div>

        <div id="peekFloat" class="peek-float" onclick="this.style.display='none'">
            <div style="font-weight:800; font-size:15px; margin-bottom:10px;">窥视ta...</div>
            <div style="font-size:11px; color:#8e8e93;">心情</div><div style="font-size:13px;">${ChatConfig.mental.mood}</div><div class="peek-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">好感值</div><div style="font-size:13px;">${ChatConfig.mental.favorability}</div><div class="peek-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">当前动作</div><div style="font-size:13px;">${ChatConfig.mental.action}</div><div class="peek-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">内心想法</div><div style="font-size:13px;">${ChatConfig.mental.thought}</div>
        </div>
    `;
};

// ===== 6. 发送与逻辑处理 =====
window.handleSend = function() {
    const input = document.getElementById('msgInput');
    const flow = document.getElementById('chatFlow');
    const text = input.value.trim();
    if (!text) return;

    appendBubble(flow, 'user', text);
    input.value = '';
    
    // 模拟回复
    document.getElementById('typing').style.display = 'block';
    setTimeout(() => {
        document.getElementById('typing').style.display = 'none';
        appendBubble(flow, 'assistant', "系统已接收消息。");
    }, 1200);
};

function appendBubble(box, role, text) {
    const div = document.createElement('div');
    const isNar = text.startsWith('(') || text.startsWith('（');
    div.className = isNar ? 'bubble bubble-narration' : `bubble bubble-${role}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

// ===== 7. 各大板块渲染 =====
function renderChatList(c) {
    c.innerHTML = `
        <div style="padding:10px 16px;">
            <div class="glass-card" style="padding:15px; display:flex; align-items:center; gap:12px;" onclick="window.enterSingleChat('枝玉')">
                <div style="width:50px; height:50px; background:#000; color:#fff; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800;">枝</div>
                <div style="flex:1;">
                    <div style="display:flex; justify-content:space-between;"><span style="font-weight:700;">枝玉</span><span style="font-size:12px; color:#c7c7cc;">刚刚</span></div>
                    <div style="color:#8e8e93; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">你好，我是开发者枝玉。</div>
                </div>
            </div>
        </div>
    `;
}

function renderContactList(c) {
    c.innerHTML = `
        <div style="padding:10px 16px;">
            <div style="background:#f2f2f7; padding:5px 10px; font-size:12px; color:#8e8e93;">Z</div>
            <div class="glass-card" style="padding:12px; display:flex; align-items:center; gap:12px; margin-bottom:5px;" onclick="window.enterSingleChat('枝玉')">
                <div style="width:36px; height:36px; background:#000; border-radius:8px;"></div>
                <span style="font-weight:600;">枝玉</span>
            </div>
        </div>
        <div style="position:fixed; right:6px; top:120px; font-size:10px; font-weight:800; display:flex; flex-direction:column; gap:4px;">
            <span>A</span><span>B</span><span>C</span><span>Z</span><span>#</span>
        </div>
    `;
}

function renderMoments(c) {
    c.innerHTML = `
        <div style="height:220px; background-size:cover; background-position:center; background-image:url(${ChatConfig.momentsBg || 'https://via.placeholder.com/400x220'}); position:relative;" onclick="window.pickMomentsBg()">
            <div style="position:absolute; right:15px; bottom:-20px; display:flex; align-items:flex-end; gap:12px;">
                <span style="color:#fff; text-shadow:0 1px 3px rgba(0,0,0,0.5); font-weight:700; margin-bottom:20px;">${ChatConfig.userName}</span>
                <div style="width:70px; height:70px; background:#eee; border-radius:15px; border:2px solid #fff; background-size:cover; background-image:url(${ChatConfig.userAvatar});"></div>
            </div>
        </div>
        <div style="padding:60px 20px; text-align:center; color:#8e8e93;">动态流加载中...</div>
    `;
}

function renderMe(c) {
    c.innerHTML = `
        <div style="padding:40px 20px 30px; display:flex; flex-direction:column; align-items:center;">
            <div style="width:85px; height:85px; background:#fff; border-radius:20px; display:flex; align-items:center; justify-content:center; font-size:40px; color:#ccc; background-size:cover; background-image:url(${ChatConfig.userAvatar}); box-shadow:0 10px 30px rgba(0,0,0,0.05);" onclick="window.pickUserAvatar()">+</div>
            <div style="margin-top:15px; font-size:22px; font-weight:800;">${ChatConfig.userName}</div>
        </div>
        <div style="padding:0 16px;">
            <div class="glass-card" style="padding:15px; display:flex; justify-content:space-between; margin-bottom:10px;"><span>钱包余额</span> <span>¥ ${ChatConfig.wallet.toFixed(2)}</span></div>
            <div class="glass-card" style="padding:15px; margin-bottom:10px;">收藏夹 ></div>
            <div class="glass-card" style="padding:15px;">全局美化设置 ></div>
        </div>
    `;
}

// ===== 8. 功能控制 (持久化) =====
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.showChatDetail = () => document.getElementById('chatDetailSheet').classList.toggle('active');
window.toggleMental = () => {
    const f = document.getElementById('peekFloat');
    f.style.display = f.style.display === 'block' ? 'none' : 'block';
};
window.toggleDangerZone = () => {
    const d = document.getElementById('dangerZone');
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
};

// 通用图片上传处理器
function handlePick(callback) {
    const p = document.getElementById('universalPicker');
    p.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const r = new FileReader();
            r.onload = (ev) => callback(ev.target.result);
            r.readAsDataURL(file);
        }
    };
    p.click();
}

window.pickChatBg = () => handlePick(res => {
    ChatConfig.chatBg = res;
    ChatStorage.set('chat_bg', res);
    const flow = document.getElementById('chatFlow');
    if (flow) flow.style.backgroundImage = `url(${res})`;
    alert('聊天背景已保存');
});

window.clearChatBg = () => {
    ChatConfig.chatBg = '';
    ChatStorage.set('chat_bg', '');
    const flow = document.getElementById('chatFlow');
    if (flow) flow.style.backgroundImage = '';
    alert('已恢复默认背景');
};

window.pickMomentsBg = () => handlePick(res => {
    ChatConfig.momentsBg = res;
    ChatStorage.set('moments_bg', res);
    window.switchTab('moments');
});

window.pickUserAvatar = () => handlePick(res => {
    ChatConfig.userAvatar = res;
    ChatStorage.set('user_avatar', res);
    window.switchTab('me');
});

console.log("玉界：VisionOS 风格液态玻璃系统注入完成。");
