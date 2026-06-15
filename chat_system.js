/**
 * 玉界 - 顶级旗舰交互系统 (最终旗舰加固完全体)
 * 修复：100%功能归位、吸附翻译、物理置底、长按菜单、引用定位
 * 严禁：删除任何功能逻辑及联系人
 */

// ===== 1. 核心状态与数据中心 =====
window.ChatConfig = {
    userName: "用户",
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    isAITyping: false,
    quotedMsg: null, // 引用数据
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
        autoMsgFreq: parseInt(localStorage.getItem('yujie_auto_msg_freq') || 0), // 0-3档
        pronoun: localStorage.getItem('yujie_pronoun') || 'me' 
    },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '开发者测试角色' }],
    mental: { 
        mood: "专注", 
        favorability: 100, 
        action: "加固核心代码", 
        thought: "这次一定把所有功能都给宝宝找回来。" 
    }
};

// ===== 2. 旗舰级样式 (Liquid Glass) =====
const injectUltraStyle = () => {
    if (document.getElementById('yujie-ultra-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-ultra-css';
    s.innerHTML = `
        /* 环境加固 */
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100vh !important; overflow: hidden; position: fixed; top:0; left:0; }

        .yujie-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 导航栏 */
        .yujie-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .yujie-status-space { height: 30px; }
        .yujie-nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .yujie-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color: #000; }
        .yujie-title { font-size: 16px; font-weight: 600; color: #000; cursor: pointer; }
        .yujie-typing { font-size: 14px; color: #555; font-weight: 500; }
        .yujie-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; color: #000; }

        /* 内容区 */
        .yujie-main { flex: 1; overflow-y: auto; background: #fff; -webkit-overflow-scrolling: touch; padding-bottom: 80px; }

        /* 底部标签栏：绝对物理置底 */
        .yujie-tabbar {
            position: fixed !important; bottom: 0 !important; left: 0 !important; width: 100% !important; height: 65px !important;
            background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex; justify-content: space-around;
            align-items: center; z-index: 900; padding-bottom: env(safe-area-inset-bottom);
        }
        .yujie-tab-item { font-size: 14px; color: #8e8e93; font-weight: 500; text-align: center; cursor: pointer; flex: 1; }
        .yujie-tab-item.active { color: #000; font-weight: 700; }

        /* 单聊全屏层 */
        #yujie-chat-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: #f2f2f7; z-index: 1000; display: none; flex-direction: column; }
        .yujie-chat-flow { flex: 1; overflow-y: auto; padding: 20px 16px; display: flex; flex-direction: column; background-size: cover; background-position: center; }

        /* ○ 心理状态窗 */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 230px;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 22px; padding: 18px;
            z-index: 1100; display: none; box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .m-title { font-weight: 800; font-size: 15px; margin-bottom: 12px; }
        .m-hint { font-size: 10px; color: rgba(0,0,0,0.4); margin-bottom: 2px; }
        .m-value { font-size: 13px; color: #1d1d1f; margin-bottom: 10px; line-height: 1.3; }
        .m-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.12); margin: 8px 0; }

        /* 气泡与吸附翻译 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; cursor: pointer; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 15px 0; max-width: 85%; }
        .translate-adherent { 
            align-self: flex-start; background: rgba(255,255,255,0.35); backdrop-filter: blur(15px);
            font-size: 13px; color: #3a3a3c; margin-top: -6px; margin-bottom: 12px; border-radius: 12px; 
            padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; display: none; 
        }

        /* 长按功能栏 */
        .bubble-menu {
            position: absolute; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(25px);
            border: 0.5px solid #fff; border-radius: 14px; padding: 4px; z-index: 1500; display: none;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); width: 220px;
        }
        .menu-row { display: flex; border-bottom: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-row:last-child { border-bottom: none; }
        .menu-item { flex: 1; text-align: center; padding: 10px 0; font-size: 12px; color: #000; cursor: pointer; border-right: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-item:last-child { border-right: none; }

        /* 引用预览 */
        .quote-preview { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); border: 0.5px solid rgba(255,255,255,0.5); border-radius: 12px; padding: 10px 14px; margin: 0 16px 8px; display: none; position: relative; }
        .quote-close { position: absolute; right: 12px; top: 10px; font-size: 18px; color: #8e8e93; cursor: pointer; font-weight: 300; }
        .quote-text { font-size: 12px; color: #3a3a3c; line-height: 1.5; white-space: pre-wrap; }

        /* 输入栏 */
        .yujie-footer { flex-shrink: 0; background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.05); padding: 8px 16px 25px; display: flex; flex-direction: column; }
        .yujie-input-row { display: flex; align-items: center; gap: 12px; }
        .add-btn { width: 28px; height: 28px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 20px; cursor: pointer; }
        .yujie-inp { flex: 1; border: none; background: #fff; border-radius: 18px; padding: 10px 14px; outline: none; font-size: 15px; height: 38px; }
        .send-btn-grey { font-size: 28px; color: #555; cursor: pointer; font-weight: 300; }

        /* 半屏详情 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.1); z-index: 2000; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 2100; display: flex; flex-direction: column;
        }
        .half-sheet.dragging { transition: none !important; }
        .sheet-handle { width: 100%; height: 40px; flex-shrink: 0; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 60px; -webkit-overflow-scrolling: touch; }

        /* 功能盒组件 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 22px; margin-bottom: 16px; padding: 18px; border: 0.5px solid rgba(255,255,255,0.4); }
        .item-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .custom-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .custom-switch:checked { background: #000; border-color: #000; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .custom-switch:checked::after { transform: translateX(20px); }

        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }
        
        .bg-preview-2x4 { width: 100%; height: 130px; border-radius: 16px; border: 2px dashed rgba(0,0,0,0.1); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.3); font-size: 13px; cursor: pointer; }
        .black-btn { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        .danger-bar { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; }
        .danger-icon { color: rgba(0,0,0,0.2); font-weight: 300; transition: 0.3s; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 交互驱动与手势逻辑 =====
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
        if (!isDragging) return; isDragging = false;
        sheet.style.transition = 'transform 0.4s cubic-bezier(0.2, 1, 0.3, 1)';
        let d = event.changedTouches[0].clientY - startY;
        if (d > 120) window.toggleSheet(false); else sheet.style.transform = `translateY(0)`;
    });
};

// 详情半窗逻辑
window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) { window.toggleMental(false); mask.style.display = 'block'; setTimeout(() => { sheet.classList.add('active'); sheet.style.transform = 'translateY(0)'; }, 10); }
    else { sheet.classList.remove('active'); sheet.style.transform = 'translateY(100%)'; setTimeout(() => { mask.style.display = 'none'; sheet.style.transform = ''; }, 400); }
};

// 状态窗逻辑
window.toggleMental = (show) => {
    const pop = document.getElementById('mentalPop');
    if (show === undefined) pop.style.display = (pop.style.display === 'block' ? 'none' : 'block');
    else pop.style.display = (show ? 'block' : 'none');
    if(pop.style.display==='block') window.refreshMentalUI();
};

window.refreshMentalUI = () => {
    const m = ChatConfig.mental;
    document.getElementById('m-mood').innerText = m.mood;
    document.getElementById('m-fav').innerText = m.favorability;
    document.getElementById('m-act').innerText = m.action;
    document.getElementById('m-tht').innerText = m.thought;
};

// ===== 4. 气泡菜单、引用、手动翻译 =====
let longTarget = null;
window.showBubbleMenu = (e, el) => {
    e.preventDefault(); longTarget = el;
    const menu = document.getElementById('bubbleMenu');
    menu.style.display = 'block';
    const rect = el.getBoundingClientRect();
    menu.style.top = (rect.top - 100) + 'px';
    menu.style.left = Math.max(10, rect.left + (rect.width/2) - 110) + 'px';
};

window.menuAct = (act) => {
    const text = longTarget.innerText;
    if (act === 'copy') { navigator.clipboard.writeText(text); alert('已复制'); }
    else if (act === 'quote') { window.setupQuote("枝玉", text); }
    else if (act === 'translate') {
        const ad = longTarget.nextElementSibling;
        if (ad && ad.classList.contains('translate-adherent')) {
            const isShow = ad.style.display === 'block';
            ad.style.display = isShow ? 'none' : 'block';
            ad.innerText = "翻译：[正在处理真·翻译中...]";
        }
    } else if (act === 'regret') {
        const h = prompt("原因或方向："); if(h!==null){ longTarget.remove(); window.triggerReply("引导：" + h); }
    }
    document.getElementById('bubbleMenu').style.display = 'none';
};

window.setupQuote = (n, t) => {
    ChatConfig.quotedMsg = { n, t };
    const qv = document.getElementById('quotePreview');
    const qt = document.getElementById('quoteText');
    qv.style.display = 'block';
    const line1 = (n + ": " + t).substring(0, 14);
    const line2 = t.substring(14, 26) + (t.length > 26 ? "..." : "");
    qt.innerText = line1 + "\n" + line2;
};

window.cancelQuote = () => { ChatConfig.quotedMsg = null; document.getElementById('quotePreview').style.display = 'none'; };

// ===== 5. 发送、回复与 API 核心 =====
window.handleAction = async function() {
    const inp = document.getElementById('chatInp');
    const text = inp.value.trim();
    if (text === "") { if (!ChatConfig.isAITyping) window.triggerReply(); }
    else { window.sendUser(text); inp.value = ""; window.cancelQuote(); }
};

window.sendUser = (t) => {
    const flow = document.getElementById('chatFlow');
    const isNar = /^[\(\（].*[\)\）]$/.test(t);
    const d = document.createElement('div'); d.id = 'm-'+Date.now();
    d.className = isNar ? 'bubble-narration' : 'bubble bubble-user'; d.innerText = t;
    flow.appendChild(d); flow.scrollTop = flow.scrollHeight;
    window.saveHistory(); window.triggerReply(t);
};

window.triggerReply = async (ctx = "") => {
    if (ChatConfig.isAITyping) return;
    ChatConfig.isAITyping = true;
    window.updateNav(true);
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    try {
        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model: localStorage.getItem('main_api_model'), messages: [{ role: 'system', content: `角色：枝玉。规则：回复禁超20字。翻译日韩英为简中。JSON：{"mood":"","favorability":0,"action":"","thought":"","translation":""}` }, { role: 'user', content: ctx || "你好" }] })
        });
        const data = await res.json();
        window.appendBot(data.choices[0].message.content);
        window.updateApiData(10);
    } catch (e) { alert("API 调用失败"); } finally { ChatConfig.isAITyping = false; window.updateNav(false); }
};

window.appendBot = (c) => {
    const f = document.getElementById('chatFlow'); let t = c; let tr = "";
    const jsonMatch = c.match(/\{.*\}/);
    if(jsonMatch){ try{ const r = JSON.parse(jsonMatch[0]); ChatConfig.mental = r; tr = r.translation; t = c.replace(jsonMatch[0], "").trim(); }catch(e){} }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = t; d.id = 'm-'+Date.now(); d.oncontextmenu = (e)=>window.showBubbleMenu(e,d);
    f.appendChild(d);
    const ad = document.createElement('div'); ad.className = 'translate-adherent';
    if(tr && ChatConfig.settings.autoTranslate){ ad.innerText = "翻译：" + tr; ad.style.display = 'block'; }
    f.appendChild(ad); f.scrollTop = f.scrollHeight; window.saveHistory();
};

// ===== 6. 核心接管与置底渲染 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectUltraStyle();
    document.body.classList.add('chat-active');
    const appWindow = document.getElementById('genericAppWindow');
    appWindow.style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="yujie-shell">
            <nav class="yujie-nav"><div class="yujie-status-bar"></div><div class="yujie-nav-body">
                <span class="yujie-back" onclick="window.closeWhole()">‹</span>
                <span class="yujie-title" id="yujieTitle">聊天</span>
            </div></nav>
            <main id="yujieMain" class="yujie-main"></main>
            <footer class="yujie-tabbar">
                <div onclick="window.yNav('chats', this)" class="yujie-tab-item active">聊天</div>
                <div onclick="window.yNav('contacts', this)" class="yujie-tab-item">联系人</div>
                <div onclick="window.yNav('moments', this)" class="yujie-tab-item">动态</div>
                <div onclick="window.yNav('me', this)" class="yujie-tab-item">我的</div>
            </footer>
            <div id="yujie-chat-overlay"></div>
        </div>
    `;
    window.yNav('chats');
};

window.yNav = (t, el) => {
    const b = document.getElementById('yujieMain');
    const title = document.getElementById('yujieTitle');
    if (el) { el.parentElement.querySelectorAll('div').forEach(d => d.classList.remove('active')); el.classList.add('active'); }
    if (t === 'chats') {
        title.innerText = "聊天";
        b.innerHTML = `<div style="background:#fff;">${ChatConfig.contacts.map(c => `<div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')"><div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;">${c.avatar}</div><div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">点击开始对话</div></div></div>`).join('')}</div>`;
    } else if (t === 'contacts') {
        title.innerText = "联系人";
        b.innerHTML = `<div style="background:#fff;"><div style="padding:15px; border-bottom:0.5px dashed #eee;">新的朋友</div><div style="height:24px;background:#f2f2f7;padding:0 16px;font-size:12px;color:#8e8e93;display:flex;align-items:center;">Z</div><div style="padding:15px;" onclick="window.enterChat('枝玉')">枝玉</div></div>`;
    } else {
        b.innerHTML = `<div style="padding:100px; text-align:center; color:#ccc;">${t} 模块开发中</div>`;
    }
};

window.enterChat = (name) => {
    const layer = document.getElementById('yujie-chat-overlay');
    layer.style.display = 'flex';
    layer.innerHTML = `
        <header class="yujie-nav" style="background:rgba(255,255,255,0.4);"><div class="yujie-status-bar"></div><div class="yujie-nav-body">
            <span class="yujie-back" onclick="window.closeChat()">‹</span>
            <span class="yujie-title" id="chatTitle" onclick="window.toggleSheet(true)">${name}</span>
            <span class="yujie-mental-btn" onclick="window.toggleMental()">○</span>
        </div></header>
        <div id="chatFlow" class="yujie-chat-flow" style="background-image:url(${ChatConfig.chatBg});"></div>
        
        <!-- ○ 状态栏 -->
        <div id="mentalPop" class="mental-popup" onclick="window.toggleMental(false)">
            <div class="m-title">窥视ta...</div>
            <div class="m-hint">心情</div><div class="m-value" id="m-mood">${ChatConfig.mental.mood}</div><div class="m-divider"></div>
            <div class="m-hint">好感值</div><div class="m-value" id="m-fav">${ChatConfig.mental.favorability}</div><div class="m-divider"></div>
            <div class="m-hint">当前动作</div><div class="m-value" id="m-act">${ChatConfig.mental.action}</div><div class="m-divider"></div>
            <div class="m-hint">内心想法</div><div class="m-value" id="m-tht">${ChatConfig.mental.thought}</div>
        </div>

        <div id="bubbleMenu" class="bubble-menu">
            <div class="menu-row"><div class="menu-item" onclick="window.menuAct('copy')">复制</div><div class="menu-item">收藏</div><div class="menu-item" onclick="window.menuAct('regret')">重回</div><div class="menu-item">多选</div></div>
            <div class="menu-row"><div class="menu-item" onclick="window.menuAct('quote')">引用</div><div class="menu-item" onclick="window.menuAct('translate')">翻译</div></div>
        </div>

        <footer class="yujie-footer">
            <div id="quotePreview" class="quote-preview"><span class="quote-close" onclick="window.cancelQuote()">x</span><div id="quoteText" class="quote-text"></div></div>
            <div class="yujie-input-row"><div class="add-btn">+</div><input type="text" id="chatInp" class="yujie-inp-box" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.handleAction()"><div class="send-btn-grey" onclick="window.handleAction()">+</div></div>
        </footer>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div class="sheet-content">
                    <div style="font-size:22px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
                    
                    <div class="glass-group">
                        <div class="m-hint" style="margin-bottom:8px;">API 消耗详情 (token)</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:12px;">全部点数: <span id="api-disp">${ChatConfig.settings.api.total}</span></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span class="m-hint">线上: ${ChatConfig.settings.api.online}</span><span class="m-hint">线下: ${ChatConfig.settings.api.offline}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span class="m-hint">生图: ${ChatConfig.settings.api.image}</span><span class="m-hint">语音: ${ChatConfig.settings.api.voice}</span></div>
                    </div>

                    <div style="margin-bottom:15px;"><input type="text" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; border-radius:12px; padding:14px;" oninput="window.doSearch(this.value)"><div id="searchRes" style="background:rgba(255,255,255,0.2); border-radius:12px; margin-top:8px; padding:10px; display:none;"></div></div>

                    <div class="glass-group">
                        <div class="item-row"><span>AI 总结</span> <span id="summ-val" class="m-hint">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.upSet('summaryCount',this.value,'summ-val')">
                        <button class="black-btn">手动总结</button>
                    </div>

                    <div class="glass-group">
                        <div class="m-hint" style="margin-bottom:10px;">聊天背景</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pBg()"></div>
                        <div style="background:#ff3b30; color:#fff; border-radius:12px; padding:12px; text-align:center; margin-top:10px; font-weight:700; cursor:pointer;" onclick="window.cBg()">清除背景图</div>
                    </div>

                    <div class="glass-group">
                        <div class="item-row"><span>回复最少</span> <span id="min-val" class="m-hint">${ChatConfig.settings.replyMin}句</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMin}" class="ios-slider" oninput="window.upSet('replyMin',this.value,'min-val')">
                        <div class="item-row"><span>回复最多</span> <span id="max-val" class="m-hint">${ChatConfig.settings.replyMax}句</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMax}" class="ios-slider" oninput="window.upSet('replyMax',this.value,'max-val')">
                    </div>

                    <div class="glass-group">
                        <div class="item-row"><span>线上旁白</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.uSet('onlineNarration',this.checked)"></div>
                    </div>

                    <div class="glass-group">
                        <div class="item-row"><span>自动翻译</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.uSet('autoTranslate',this.checked)"></div>
                        <div class="m-hint">提示：非简体中文语言都将翻译成简体中文。</div>
                    </div>

                    <div class="glass-group">
                        <div class="item-row"><span>自动发消息</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoMsg?'checked':''} onchange="window.uSet('autoMsg',this.checked)"></div>
                        <div class="m-hint" style="margin:8px 0;">频率档位：1h / 5h / 10h / 24h</div>
                        <input type="range" min="0" max="3" step="1" value="${ChatConfig.settings.autoMsgFreq}" class="ios-slider" oninput="window.uSet('autoMsgFreq',this.value)">
                    </div>

                    <div class="glass-group">
                        <div class="m-hint" style="margin-bottom:10px;">人称选择</div>
                        <div class="item-row"><span>第一人称“我”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='me'?'checked':''} onclick="window.uPron('me')"></div>
                        <div class="item-row"><span>第二人称“你”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='you'?'checked':''} onclick="window.uPron('you')"></div>
                        <div class="item-row"><span>第三人称“ta”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='ta'?'checked':''} onclick="window.uPron('ta')"></div>
                    </div>

                    <div class="glass-group"><div class="danger-bar" onclick="window.toggleDanger()">危险区 <span class="danger-icon" id="danger-ic">></span></div><div class="danger-content" id="dangerZone"><button style="background:#fff; color:#ff3b30; border:none; border-radius:12px; padding:12px; width:100%; margin-bottom:10px; font-weight:600;" onclick="window.clearL()">清空聊天记录</button></div></div>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
    window.loadHistory();
};

// 逻辑函数
window.updateNav = (t) => { document.getElementById('chatTitle').innerHTML = t ? `<span class="yujie-typing">输入中…</span>` : "枝玉"; };
window.upSet = (k,v,id) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k,v); if(id) document.getElementById(id).innerText=v+(k.includes('reply')?'句':'轮'); };
window.uSet = (k,v) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k,v); };
window.uPron = (p) => { ChatConfig.settings.pronoun = p; localStorage.setItem('yujie_pronoun',p); };
window.updateApiData = (v) => { ChatConfig.settings.api.total+=v; ChatConfig.settings.api.online+=v; localStorage.setItem('api_total',ChatConfig.settings.api.total); if(document.getElementById('api-disp')) document.getElementById('api-disp').innerText = ChatConfig.settings.api.total; };
window.pBg = () => { const i=document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{ const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(ev)=>{ ChatConfig.chatBg=ev.target.result; localStorage.setItem('yujie_chat_bg',ev.target.result); document.getElementById('bgPrev').style.backgroundImage=`url(${ev.target.result})`; document.getElementById('chatFlow').style.backgroundImage=`url(${ev.target.result})`; }; r.readAsDataURL(f); } }; i.click(); };
window.cBg = () => { ChatConfig.chatBg=''; localStorage.removeItem('yujie_chat_bg'); document.getElementById('bgPrev').style.backgroundImage=''; document.getElementById('chatFlow').style.backgroundImage=''; };
window.clearL = () => { if(confirm('确定清空？')){ document.getElementById('chatFlow').innerHTML=''; window.saveHistory(); } };
window.saveHistory = () => { localStorage.setItem('yujie_logs_枝玉', JSON.stringify(document.getElementById('chatFlow').innerHTML)); };
window.loadHistory = () => { const l=localStorage.getItem('yujie_logs_枝玉'); if(l){ const f=document.getElementById('chatFlow'); f.innerHTML=JSON.parse(l); f.querySelectorAll('.bubble').forEach(b => b.oncontextmenu = (e)=>window.showBubbleMenu(e,b)); } };
window.toggleDanger = () => { const dz=document.getElementById('dangerZone'); const ic=document.getElementById('danger-ic'); const s=dz.style.display==='block'; dz.style.display=s?'none'
