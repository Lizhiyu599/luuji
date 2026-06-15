/**
 * 玉界 - 旗舰全功能沉浸式交互系统 (最终整合·修正版)
 * 包含：底部导航锁定、黑色开关样式、14字截断引用、API消耗三行显示
 */

// ===== 1. 核心状态与持久化 =====
window.ChatConfig = {
    userName: "用户",
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    isAITyping: false,
    quotedMsg: null,
    settings: {
        api: {
            total: parseInt(localStorage.getItem('api_total') || 0),
            online: parseInt(localStorage.getItem('api_online') || 0),
            offline: parseInt(localStorage.getItem('api_offline') || 0),
            image: parseInt(localStorage.getItem('api_image') || 0),
            voice: parseInt(localStorage.getItem('api_voice') || 0)
        },
        summaryCount: parseInt(localStorage.getItem('yujie_summary_count') || 50),
        replyMin: parseInt(localStorage.getItem('yujie_reply_min') || 1),
        replyMax: parseInt(localStorage.getItem('yujie_reply_max') || 3),
        onlineNarration: localStorage.getItem('yujie_narration') !== 'false',
        autoTranslate: localStorage.getItem('yujie_translate') === 'true',
        autoMsg: localStorage.getItem('yujie_auto_msg') === 'true',
        autoMsgFreq: parseInt(localStorage.getItem('yujie_auto_msg_freq') || 0),
        pronoun: localStorage.getItem('yujie_pronoun') || 'me'
    },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '开发者测试角色' }],
    mental: { mood: "专注", favorability: 99, action: "重构逻辑", thought: "这次一定把布局修好。" }
};

// ===== 2. 旗舰级样式 (修正置底布局) =====
const injectFlagshipStyle = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; position: relative; }
        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 导航栏 */
        .chat-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; cursor: pointer; color:#000; }
        .nav-title { font-size: 16px; font-weight: 600; color: #000; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; }

        /* 内容区：确保不被底部遮挡 */
        .chat-main-body { flex: 1; overflow-y: auto; background: #fff; padding-bottom: 80px; }

        /* 底部导航栏：硬核锁定置底 */
        .tab-fixed-bottom {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 65px;
            background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex; justify-content: space-around;
            align-items: center; z-index: 999; padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-item { font-size: 12px; color: #8e8e93; text-align: center; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* 开关与滑块：黑色风格 */
        .custom-switch { appearance: none; width: 50px; height: 30px; background: #e9e9ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .custom-switch:checked { background: #000 !important; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .custom-switch:checked::after { transform: translateX(20px); }
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; border: 2px solid #fff; }

        /* 气泡与菜单 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; position: relative; }
        .bubble-user { align-self: flex-end; background: #fff; color: #000; border-bottom-right-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .bubble-assistant { align-self: flex-start; background: #000; color: #fff; border-bottom-left-radius: 4px; }
        .bubble-menu { position: fixed; background: rgba(255,255,255,0.8); backdrop-filter: blur(20px); border-radius: 14px; width: 210px; z-index: 2000; display: none; box-shadow: 0 8px 24px rgba(0,0,0,0.15); border: 0.5px solid #fff; overflow: hidden; }
        .menu-row { display: flex; border-bottom: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-item { flex: 1; text-align: center; padding: 12px 0; font-size: 12px; border-right: 0.5px dashed rgba(0,0,0,0.05); cursor: pointer; }
        .menu-item:last-child { border-right: none; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 功能逻辑 =====

// -- 引用设置 --
window.setupQuote = (name, text) => {
    ChatConfig.quotedMsg = { name, text };
    const qv = document.getElementById('quotePreview');
    const qt = document.getElementById('quoteText');
    qv.style.display = 'block';
    let combined = name + "：" + text;
    let line1 = combined.substring(0, 14);
    let line2 = combined.length > 14 ? "\n" + combined.substring(14, 26) + (combined.length > 26 ? "..." : "") : "";
    qt.innerText = line1 + line2;
};
window.cancelQuote = () => { ChatConfig.quotedMsg = null; document.getElementById('quotePreview').style.display = 'none'; };

// -- 长按菜单 --
let longTarget = null;
window.showBubbleMenu = (e, el) => {
    e.preventDefault(); longTarget = el;
    const menu = document.getElementById('bubbleMenu');
    menu.style.display = 'block';
    const rect = el.getBoundingClientRect();
    menu.style.top = (rect.top - 90) + 'px';
    menu.style.left = Math.max(10, rect.left + (rect.width/2) - 105) + 'px';

    const hide = () => { menu.style.display = 'none'; document.removeEventListener('scroll', hide, true); };
    document.addEventListener('scroll', hide, true);
};

window.menuAct = (act) => {
    if (act === 'copy') navigator.clipboard.writeText(longTarget.innerText);
    else if (act === 'quote') { window.setupQuote(document.getElementById('chatTitle').innerText, longTarget.innerText); document.getElementById('chatInp').focus(); }
    document.getElementById('bubbleMenu').style.display = 'none';
};

// -- 发送与回复 --
window.send = async () => {
    const inp = document.getElementById('chatInp'); if(!inp.value.trim()) return;
    const t = inp.value.trim();
    const f = document.getElementById('chatFlow');
    const d = document.createElement('div'); d.className = 'bubble bubble-user'; d.innerText = t;
    d.oncontextmenu = (e) => window.showBubbleMenu(e, d);
    f.appendChild(d); inp.value = ""; window.cancelQuote();
    f.scrollTop = f.scrollHeight;
    window.triggerReply(t);
};

window.triggerReply = async (ctx) => {
    ChatConfig.isAITyping = true;
    document.getElementById('chatTitle').innerHTML = `<span style="font-size:12px;color:#8e8e93;">输入中...</span>`;
    
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if(!baseUrl || !apiKey) { window.appendBot("请先配置API"); return; }

    const sysPrompt = window.getSystemPrompt ? window.getSystemPrompt("枝玉是一个开发者。") : "你是一个人类。";
    
    try {
        const res = await fetch(baseUrl.replace(/\/+$/, '') + '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [{role:'system', content:sysPrompt}, {role:'user', content:ctx}] })
        });
        const data = await res.json();
        window.appendBot(data.choices[0].message.content);
    } catch(e) { window.appendBot("连接失败: " + e.message); }
    finally { ChatConfig.isAITyping = false; document.getElementById('chatTitle').innerText = "枝玉"; }
};

window.appendBot = (c) => {
    const f = document.getElementById('chatFlow');
    let t = c; const j = c.match(/\{.*\}/);
    if(j) { try { ChatConfig.mental = JSON.parse(j[0]); t = c.replace(j[0], "").trim(); } catch(e){} }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = t;
    d.oncontextmenu = (e) => window.showBubbleMenu(e, d);
    f.appendChild(d); f.scrollTop = f.scrollHeight;
};

// ===== 4. 界面渲染 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectFlagshipStyle();
    document.body.classList.add('chat-active');
    document.getElementById('genericAppWindow').style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav"><div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeWhole()">‹</span>
                <span class="nav-title">聊天</span>
            </div></nav>
            <main id="mainBody" class="chat-main-body"></main>
            <footer class="tab-fixed-bottom">
                <div onclick="window.navTo('chats', this)" class="tab-item active"><div>聊</div>聊天</div>
                <div onclick="window.navTo('contacts', this)" class="tab-item"><div>联</div>联系人</div>
                <div onclick="window.navTo('moments', this)" class="tab-item"><div>动</div>动态</div>
                <div onclick="window.navTo('me', this)" class="tab-item"><div>我</div>我的</div>
            </footer>
            <div id="chatOverlay"></div>
        </div>
    `;
    window.navTo('chats');
};

window.navTo = (t, el) => {
    if (el) { el.parentElement.querySelectorAll('.tab-item').forEach(d => d.classList.remove('active')); el.classList.add('active'); }
    document.getElementById('mainBody').innerHTML = `<div style="padding:15px;" onclick="window.enterChat('枝玉')">枝玉 (点击进入对话)</div>`;
};

window.enterChat = (name) => {
    const layer = document.getElementById('chatOverlay');
    layer.style.display = 'flex';
    layer.innerHTML = `
        <header class="chat-nav">
            <div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeChat()">‹</span>
                <span class="nav-title" id="chatTitle" onclick="window.toggleSheet(true)">${name}</span>
                <span class="nav-mental-btn" onclick="window.toggleMental()">○</span>
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column;"></div>
        
        <div id="mentalPop" class="mental-popup" onclick="window.toggleMental(false)">
            <div class="mental-title">心理状态</div>
            <div class="mental-value">心情: ${ChatConfig.mental.mood}</div>
            <div class="mental-value">好感: ${ChatConfig.mental.favorability}</div>
        </div>

        <div id="bubbleMenu" class="bubble-menu">
            <div class="menu-row"><div class="menu-item" onclick="window.menuAct('copy')">复制</div><div class="menu-item" onclick="window.menuAct('quote')">引用</div></div>
        </div>

        <footer class="chat-footer">
            <div id="quotePreview" class="quote-preview" style="background:#fff;padding:10px;display:none;position:relative;">
                <span onclick="window.cancelQuote()" style="position:absolute;right:10px;color:#666;">x</span>
                <div id="quoteText" style="font-size:12px;color:#333;"></div>
            </div>
            <div class="input-row" style="padding:10px;display:flex;gap:10px;background:#f2f2f7;">
                <input type="text" id="chatInp" class="chat-inp-box" style="flex:1;height:36px;border-radius:18px;border:none;padding:0 15px;" placeholder="输入消息...">
                <button onclick="window.send()" style="background:#000;color:#fff;border:none;border-radius:18px;padding:0 20px;">发送</button>
            </div>
        </footer>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()" style="background:#fff;position:absolute;bottom:0;width:100%;height:80%;border-radius:20px 20px 0 0;padding:20px;overflow-y:auto;">
                <div style="font-size:20px;font-weight:800;margin-bottom:20px;">聊天详情</div>
                
                <div class="glass-group" style="background:#f9f9f9;padding:15px;border-radius:15px;margin-bottom:15px;">
                    <div style="font-weight:700;margin-bottom:10px;">API 消耗详情</div>
                    <div style="font-size:13px;color:#666;">全部点数: ${ChatConfig.settings.api.total} token</div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:5px;">
                        <span>线上: ${ChatConfig.settings.api.online}</span><span>线下: ${ChatConfig.settings.api.offline}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;">
                        <span>生图: ${ChatConfig.settings.api.image}</span><span>语音: ${ChatConfig.settings.api.voice}</span>
                    </div>
                </div>

                <div class="glass-group" style="background:#f9f9f9;padding:15px;border-radius:15px;margin-bottom:15px;">
                    <div style="display:flex;justify-content:space-between;"><span>自动翻译</span><input type="checkbox" class="custom-switch" onchange="window.setSet('autoTranslate', this.checked)"></div>
                </div>

                <div class="glass-group" style="background:#f9f9f9;padding:15px;border-radius:15px;margin-bottom:15px;">
                    <div style="color:red;font-weight:700;" onclick="window.clearLog()">清空聊天记录</div>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
};

// -- 通用控制 --
window.toggleSheet = (s) => { document.getElementById('sheetMask').style.display = s ? 'block' : 'none'; };
window.toggleMental = (s) => { document.getElementById('mentalPop').style.display = s===undefined?(document.getElementById('mentalPop').style.display==='block'?'none':'block'):(s?'block':'none'); };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };
window.setSet = (k, v) => { ChatConfig.settings[k] = v; localStorage.setItem('yujie_'+k, v); };
window.clearLog = () => { if(confirm("确定清空记录？")) { document.getElementById('chatFlow').innerHTML=""; alert("已清空"); } };
window.initGesture = (el) => { /* 简单版手势 */ };
window.loadHistory = () => { /* 载入历史记录 */ };
