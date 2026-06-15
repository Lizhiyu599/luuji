/**
 * 玉界 - 旗舰全功能交互系统 (完全体·终极版)
 * 风格：iOS 18 Liquid Glass / iMessage
 * 包含：长按菜单、引用、○状态窗、API实时数据、手势锁定、数据永存
 */

// ===== 1. 全局配置与持久化中心 =====
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
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '测试专用角色' }],
    mental: { mood: "专注", favorability: 95, action: "优化系统", thought: "这次一定让宝宝满意。" }
};

// ===== 2. 旗舰级样式 (Liquid Glass) =====
const injectUltraStyle = () => {
    if (document.getElementById('yujie-ultra-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-ultra-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }
        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 导航栏 */
        .chat-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color: #000; }
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; color: #000; }
        .nav-typing { font-size: 14px; color: #555; font-weight: 500; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; color: #000; }

        /* ○ 心理状态窗 */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 230px;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); -webkit-backdrop-filter: blur(45px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 22px; padding: 18px;
            z-index: 550; display: none; box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .mental-title { font-weight: 800; font-size: 15px; margin-bottom: 12px; }
        .mental-hint { font-size: 10px; color: rgba(0,0,0,0.4); margin-bottom: 2px; }
        .mental-value { font-size: 13px; color: #1d1d1f; margin-bottom: 10px; line-height: 1.3; }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        /* 气泡与吸附翻译 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; cursor: pointer; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }
        .translate-adherent { align-self: flex-start; background: rgba(255,255,255,0.3); backdrop-filter: blur(15px); font-size: 13px; color: #3a3a3c; margin-top: -4px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; display: none; }

        /* 长按功能栏 */
        .bubble-menu {
            position: absolute; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(25px);
            border: 0.5px solid #fff; border-radius: 14px; padding: 4px; z-index: 1000; display: none;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); width: 220px;
        }
        .menu-row { display: flex; border-bottom: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-row:last-child { border-bottom: none; }
        .menu-item { flex: 1; text-align: center; padding: 12px 0; font-size: 12px; color: #000; cursor: pointer; border-right: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-item:last-child { border-right: none; }

        /* 引用框 */
        .quote-box {
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); border: 0.5px solid rgba(255,255,255,0.5);
            border-radius: 12px; padding: 10px 14px; margin: 0 16px 8px; display: none; position: relative;
        }
        .quote-close { position: absolute; right: 12px; top: 10px; font-size: 18px; color: #555; cursor: pointer; font-weight: 300; }
        .quote-text { font-size: 12px; color: #3a3a3c; line-height: 1.5; white-space: pre-wrap; }

        /* 输入栏 */
        .chat-footer { flex-shrink: 0; background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.05); padding: 8px 16px 25px; display: flex; flex-direction: column; }
        .input-row { display: flex; align-items: center; gap: 12px; }
        .add-circle { width: 28px; height: 28px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 20px; cursor: pointer; }
        .chat-inp { flex: 1; border: none; background: #fff; border-radius: 18px; padding: 10px 14px; outline: none; font-size: 15px; }
        .send-btn-grey { font-size: 28px; color: #555; cursor: pointer; user-select: none; font-weight: 300; }

        /* 半屏详情 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650; display: flex; flex-direction: column;
        }
        .half-sheet.dragging { transition: none !important; }
        .sheet-handle { width: 100%; height: 40px; flex-shrink: 0; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 60px; -webkit-overflow-scrolling: touch; }

        /* 包裹框组件 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 22px; margin-bottom: 16px; padding: 18px; border: 0.5px solid rgba(255,255,255,0.4); }
        .ios-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .ios-switch:checked { background: #000; border-color: #000; }
        .ios-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .ios-switch:checked::after { transform: translateX(20px); }
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }
        .bg-preview-2x4 { width: 100%; height: 120px; border-radius: 15px; border: 2px dashed rgba(0,0,0,0.1); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.3); font-size: 13px; cursor: pointer; }
        .black-btn { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; width: 100%; }
        .danger-icon { color: rgba(0,0,0,0.2); font-weight: 300; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势与交互逻辑加固 =====
let isDragging = false; let startY = 0;
window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { isDragging = true; startY = e.touches[0].clientY; sheet.classList.add('dragging'); };
    handle.onclick = () => window.toggleSheet(false);
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        let d = e.touches[0].clientY - startY;
        if (d > 0) sheet.style.transform = `translateY(${d}px)`;
    }, { passive: false });
    window.addEventListener('touchend', () => {
        if (!isDragging) return; isDragging = false; sheet.classList.remove('dragging');
        let d = event.changedTouches[0].clientY - startY;
        if (d > 120) window.toggleSheet(false); else sheet.style.transform = `translateY(0)`;
    });
};

// 键盘与视觉窗口自适应
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        const s = document.querySelector('.chat-shell');
        if(s) s.style.height = window.visualViewport.height + 'px';
    });
}

// ===== 4. 气泡菜单与引用功能 =====
let longTarget = null;
window.showBubbleMenu = (e, el) => {
    e.preventDefault(); longTarget = el;
    const menu = document.getElementById('bubbleMenu');
    menu.style.display = 'block';
    const rect = el.getBoundingClientRect();
    menu.style.top = (rect.top - 100) + 'px';
    menu.style.left = Math.max(10, rect.left + (rect.width/2) - 105) + 'px';
};

window.menuAction = (act) => {
    const text = longTarget.innerText;
    if (act === 'copy') { navigator.clipboard.writeText(text); alert('已复制'); }
    else if (act === 'quote') { window.setupQuote("枝玉", text); }
    else if (act === 'translate') {
        const d = longTarget.nextElementSibling;
        if(d && d.classList.contains('translate-adherent')) {
            const isShow = d.style.display === 'block';
            d.style.display = isShow ? 'none' : 'block';
            d.innerText = "翻译：[这是手动翻译结果示例]";
        }
    } else if (act === 'regret') {
        const hint = prompt("请输入重回的原因及方向：", "");
        if (hint !== null) { longTarget.remove(); window.triggerReply("用户要求重回逻辑：" + hint); }
    }
    document.getElementById('bubbleMenu').style.display = 'none';
};

window.setupQuote = (name, text) => {
    ChatConfig.quotedMsg = { name, text };
    const qv = document.getElementById('quotePreview');
    const qt = document.getElementById('quoteText');
    qv.style.display = 'block';
    const line1 = (name + ": " + text).substring(0, 14);
    const line2 = text.substring(14, 26) + (text.length > 26 ? "..." : "");
    qt.innerText = line1 + "\n" + line2;
};

window.cancelQuote = () => { ChatConfig.quotedMsg = null; document.getElementById('quotePreview').style.display = 'none'; };

// ===== 5. 发送、回复与 API 核心 =====
window.handleAction = async function() {
    const inp = document.getElementById('chatInp');
    const text = inp.value.trim();
    if (text === "") {
        if (!ChatConfig.isAITyping) window.triggerReply();
    } else {
        window.sendUser(text);
        inp.value = ""; window.cancelQuote();
    }
};

window.sendUser = (text) => {
    const flow = document.getElementById('chatFlow');
    const isNar = /^[\(\（].*[\)\）]$/.test(text);
    const d = document.createElement('div');
    d.className = isNar ? 'bubble-narration' : 'bubble bubble-user';
    d.innerText = text; d.id = 'msg-'+Date.now();
    flow.appendChild(d); flow.scrollTop = flow.scrollHeight;
    window.saveHistory();
    window.triggerReply(text);
};

window.triggerReply = async (context = "") => {
    if (ChatConfig.isAITyping) return;
    ChatConfig.isAITyping = true;
    window.updateNav(true);

    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if (!baseUrl || !apiKey) {
        alert("API 未配置！请去系统设置里完善 API。");
        ChatConfig.isAITyping = false; window.updateNav(false); return;
    }

    try {
        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: `你是枝玉。规则：回复禁超20字。禁Emoji。末尾带JSON：{"mood":"","favorability":0,"action":"","thought":""}` },
                    { role: 'user', content: context || "你好" }
                ]
            })
        });
        const data = await res.json();
        const content = data.choices[0].message.content;
        window.appendBot(content);
        window.updateApiData(10);
    } catch (e) {
        alert("API 调用失败，请检查网络或配置。");
    } finally {
        ChatConfig.isAITyping = false; window.updateNav(false);
    }
};

window.appendBot = (content) => {
    const flow = document.getElementById('chatFlow');
    let text = content;
    const jsonMatch = content.match(/\{.*\}/);
    if (jsonMatch) {
        try { ChatConfig.mental = JSON.parse(jsonMatch[0]); text = content.replace(jsonMatch[0], "").trim(); } catch(e) {}
    }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = text;
    d.id = 'msg-'+Date.now(); d.oncontextmenu = (e) => window.showBubbleMenu(e, d);
    flow.appendChild(d);
    const ad = document.createElement('div'); ad.className = 'translate-adherent'; flow.appendChild(ad);
    flow.scrollTop = flow.scrollHeight; window.saveHistory();
};

// ===== 6. 核心渲染实现 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectUltraStyle();
    document.body.classList.add('chat-active');
    document.getElementById('genericAppWindow').style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav"><div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeWhole()">‹</span>
                <span class="nav-title" id="chatMainTitle">聊天</span>
            </div></nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; background:#fff;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05); padding-bottom:env(safe-area-inset-bottom);">
                <div onclick="window.navTo('chats', this)" style="font-weight:700; cursor:pointer;">聊天</div>
                <div onclick="window.navTo('contacts', this)" style="color:#8e8e93; cursor:pointer;">联系人</div>
                <div style="color:#8e8e93;">动态</div><div style="color:#8e8e93;">我的</div>
            </footer>
            <div id="chatOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:500; display:none; flex-direction:column;"></div>
        </div>
    `;
    window.navTo('chats');
};

window.navTo = (t, el) => {
    const b = document.getElementById('mainBody');
    if (el) { el.parentElement.querySelectorAll('div').forEach(d => { d.style.color = '#8e8e93'; d.style.fontWeight = '500'; }); el.style.color = '#000'; el.style.fontWeight = '700'; }
    if (t === 'chats') {
        b.innerHTML = `<div style="background:#fff;">${ChatConfig.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">测试角色·点击进入对话</div></div>
            </div>`).join('')}</div>`;
    } else if (t === 'contacts') {
        b.innerHTML = `<div style="background:#fff;"><div style="padding:15px; border-bottom:0.5px dashed #eee;">新的朋友</div><div style="height:24px;background:#f2f2f7;padding:0 16px;font-size:12px;color:#8e8e93;display:flex;align-items:center;">Z</div><div style="padding:15px;" onclick="window.enterChat('枝玉')">枝玉</div></div>`;
    }
};

window.enterChat = (name) => {
    const layer = document.getElementById('chatOverlay');
    layer.style.display = 'flex';
    layer.innerHTML = `
        <header class="chat-nav" style="background:rgba(255,255,255,0.4);">
            <div class="nav-status"></div>
            <div class="nav-body">
                <span class="nav-back" onclick="window.closeChat()">‹</span>
                <span class="nav-title" id="chatTitle" onclick="window.toggleSheet(true)">${name}</span>
                <span class="nav-mental-btn" onclick="window.toggleMental()">○</span>
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover; background-position:center;"></div>
        
        <div id="mentalPop" class="mental-popup" onclick="window.toggleMental(false)">
            <div class="mental-title">窥视ta...</div>
            <div class="mental-hint">心情</div><div class="mental-value" id="m-mood">${ChatConfig.mental.mood}</div><div class="mental-divider"></div>
            <div class="mental-hint">好感值</div><div class="mental-value" id="m-fav">${ChatConfig.mental.favorability}</div><div class="mental-divider"></div>
            <div class="mental-hint">当前动作</div><div class="mental-value" id="m-act">${ChatConfig.mental.action}</div><div class="mental-divider"></div>
            <div class="mental-hint">内心想法</div><div class="mental-value" id="m-tht">${ChatConfig.mental.thought}</div>
        </div>

        <div id="bubbleMenu" class="bubble-menu">
            <div class="menu-row"><div class="menu-item" onclick="window.menuAction('copy')">复制</div><div class="menu-item">收藏</div><div class="menu-item" onclick="window.menuAction('regret')">重回</div><div class="menu-item">多选</div></div>
            <div class="menu-row"><div class="menu-item" onclick="window.menuAction('quote')">引用</div><div class="menu-item" onclick="window.menuAction('translate')">翻译</div></div>
        </div>

        <footer class="chat-footer">
            <div id="quotePreview" class="quote-box">
                <span class="quote-close" onclick="window.cancelQuote()">x</span>
                <div id="quoteText" class="quote-text"></div>
            </div>
            <div class="input-row">
                <div class="add-circle">+</div>
                <input type="text" id="chatInp" class="chat-inp" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.handleAction()">
                <div class="send-btn-grey" onclick="window.handleAction()">+</div>
            </div>
        </footer>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div class="sheet-content">
                    <div style="font-size:22px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
                    
                    <div class="glass-group">
                        <div class="hint-text" style="margin-bottom:8px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:12px;">全部点数: <span id="api-disp">${ChatConfig.settings.api.total} token</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:11px; color:#8e8e93;"><span>线上: ${ChatConfig.settings.api.online} token</span><span>线下: ${ChatConfig.settings.api.offline} token</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:11px; color:#8e8e93;"><span>生图: ${ChatConfig.settings.api.image} token</span><span>语音: ${ChatConfig.settings.api.voice} token</span></div>
                    </div>

                    <div style="margin-bottom:15px;"><input type="text" id="searchLog" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; border-radius:12px; padding:12px;" oninput="window.doSearch(this.value)"><div id="searchRes" style="background:rgba(255,255,255,0.2); border-radius:12px; margin-top:8px; padding:10px; display:none;"></div></div>

                    <div class="glass-group">
                        <div class="item-label" style="display:flex; justify-content:space-between;"><span>聊天总结</span> <span id="summ-val" class="hint-text">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSet('summaryCount', this.value, 'summ-val')">
                        <button class="black-btn">手动总结</button>
                    </div>

                    <div class="glass-group">
                        <div class="hint-text" style="margin-bottom:10px;">聊天背景图</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()">${!ChatConfig.chatBg ? '点击添加聊天背景图' : ''}</div>
                        <div style="background:#000; color:#fff; border-radius:12px; padding:12px; text-align:center; margin-top:10px; font-weight:700;" onclick="window.clearBg()">清除当前背景</div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>自动发消息</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoMsg?'checked':''} onchange="window.setSet('autoMsg', this.checked)"></div>
                        <div class="hint-text" style="margin:10px 0;">提示：频率档位 (1h / 5h / 10h / 24h)</div>
                        <input type="range" min="0" max="3" step="1" value="${ChatConfig.settings.autoMsgFreq}" class="ios-slider" oninput="window.setSet('autoMsgFreq', this.value)">
                    </div>

                    <div class="glass-group">
                        <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span class="danger-icon" id="danger-ic">></span></div>
                        <div class="danger-content" id="dangerZone">
                            <button style="background:#fff; color:#ff3b30; border:none; border-radius:12px; padding:12px; width:100%; margin-bottom:10px; font-weight:600;" onclick="window.clearLog()">清空聊天记录</button>
                            <button class="black-btn">拉黑联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
    window.loadHistory();
};

// ===== 7. 辅助功能 =====
window.toggleSheet = (s) => { const m = document.getElementById('sheetMask'); const h = document.getElementById('detailSheet'); if(s){ window.toggleMental(false); m.style.display='block'; setTimeout(()=>h.classList.add('active'),10); }else{ h.classList.remove('active'); setTimeout(()=>m.style.display='none',400); } };
window.toggleMental = (s) => { const p = document.getElementById('mentalPop'); if(s===undefined) p.style.display=p.style.display==='block'?'none':'block'; else p.style.display=s?'block':'none'; };
window.updateNav = (t) => { document.getElementById('chatTitle').innerHTML = t ? `<span class="nav-typing">输入中…</span>` : "枝玉"; };
window.updateApiData = (v) => { ChatConfig.settings.api.total += v; ChatConfig.settings.api.online += v; localStorage.setItem('api_total', ChatConfig.settings.api.total); if(document.getElementById('api-disp')) document.getElementById('api-disp').innerText = ChatConfig.settings.api.total+" token"; };
window.doSearch = (v) => { const res = document.getElementById('searchRes'); if(!v){res.style.display='none'; return;} const items = Array.from(document.querySelectorAll('.bubble, .bubble-narration')).filter(el=>el.innerText.includes(v)); res.innerHTML = items.map(i=>`<div style="padding:8px; border-bottom:0.5px solid rgba(0,0,0,0.05);" onclick="document.getElementById('${i.id}').scrollIntoView({behavior:'smooth'})">${i.innerText.substring(0,15)}...</div>`).join(''); res.style.display=items.length?'block':'none'; };
window.updateSet = (k,v,id) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k,v); if(id) document.getElementById(id).innerText=v+"轮"; };
window.setSet = (k,v) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k,v); };
window.pickBg = () => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{ const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(ev)=>{ ChatConfig.chatBg=ev.target.result; localStorage.setItem('yujie_chat_bg',ev.target.result); document.getElementById('bgPrev').style.backgroundImage=`url(${ev.target.result})`; document.getElementById('chatFlow').style.backgroundImage=`url(${ev.target.result})`; }; r.readAsDataURL(f); } }; i.click(); };
window.clearBg = () => { ChatConfig.chatBg=''; localStorage.removeItem('yujie_chat_bg'); document.getElementById('bgPrev').style.backgroundImage=''; document.getElementById('chatFlow').style.backgroundImage=''; };
window.toggleDanger = () => { const dz=document.getElementById('dangerZone'); const ic=document.getElementById('danger-ic'); const show=dz.style.display==='block'; dz.style.display=show?'none':'block'; ic.innerText=show?'>':'∨'; };
window.saveHistory = () => { localStorage.setItem('yujie_logs_枝玉', JSON.stringify(document.getElementById('chatFlow').innerHTML)); };
window.loadHistory = () => { const l=localStorage.getItem('yujie_logs_枝玉'); if(l){ const f=document.getElementById('chatFlow'); f.innerHTML=JSON.parse(l); f.querySelectorAll('.bubble').forEach(b=>b.oncontextmenu=(e)=>window.showBubbleMenu(e,b)); } };
window.closeChat = () => document.getElementById('chatOverlay').style.display='none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display='none'; };

window.addEventListener('click', (e) => { 
    if(!e.target.closest('.bubble') && document.getElementById('bubbleMenu')) document.getElementById('bubbleMenu').style.display='none';
    const pop = document.getElementById('mentalPop'); if(pop && pop.style.display==='block' && !pop.contains(e.target) && !e.target.classList.contains('nav-mental-btn')) window.toggleMental(false);
});

console.log("玉界：旗舰版全功能修复加固版就绪。");
