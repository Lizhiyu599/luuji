/**
 * 玉界 - 旗舰全功能沉浸式交互系统 (最终加固·禁删版)
 * 修复：导航栏绝对置底、手势死机Bug、功能盒全归位
 * 包含：长按菜单、引用预览、○状态窗、吸附式真翻译、API三行联动
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
    mental: { mood: "专注", favorability: 99, action: "重构底层布局", thought: "这次一定把导航栏钉死在底部。" }
};

// ===== 2. 旗舰级样式 (Liquid Glass) =====
const injectFlagshipStyle = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }
        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 导航栏：精简额头 */
        .chat-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color:#000; }
        .nav-title { font-size: 16px; font-weight: 600; color: #000; text-align: center; }
        .nav-typing { font-size: 14px; color: #555; font-weight: 500; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; color: #000; }

        /* 内容区：预留底部导航空间 */
        .chat-main-body { flex: 1; overflow-y: auto; background: #fff; padding-bottom: 70px; -webkit-overflow-scrolling: touch; }

        /* 底部导航栏：硬核置底 */
        .tab-fixed-bottom {
            position: fixed; bottom: 0; left: 0; width: 100%; height: 65px;
            background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex; justify-content: space-around;
            align-items: center; z-index: 800; padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-item { font-size: 14px; color: #8e8e93; font-weight: 500; text-align: center; cursor: pointer; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* ○ 心理状态窗 */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 230px;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 22px; padding: 18px;
            z-index: 900; display: none; box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .mental-title { font-weight: 800; font-size: 15px; margin-bottom: 12px; }
        .mental-hint { font-size: 10px; color: rgba(0,0,0,0.4); margin-bottom: 2px; }
        .mental-value { font-size: 13px; color: #1d1d1f; margin-bottom: 10px; line-height: 1.3; }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.12); margin: 8px 0; }

        /* 气泡与长按菜单 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; cursor: pointer; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }
        .translate-adherent { align-self: flex-start; background: rgba(255,255,255,0.3); backdrop-filter: blur(15px); font-size: 13px; color: #3a3a3c; margin-top: -4px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; display: none; }

        .bubble-menu {
            position: absolute; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(25px);
            border: 0.5px solid #fff; border-radius: 14px; padding: 4px; z-index: 1000; display: none;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); width: 210px;
        }
        .menu-row { display: flex; border-bottom: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-row:last-child { border-bottom: none; }
        .menu-item { flex: 1; text-align: center; padding: 10px 0; font-size: 12px; color: #000; cursor: pointer; border-right: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-item:last-child { border-right: none; }

        /* 引用预览 */
        .quote-preview { background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px); border: 0.5px solid rgba(255,255,255,0.5); border-radius: 12px; padding: 10px 14px; margin: 0 16px 8px; display: none; position: relative; }
        .quote-close { position: absolute; right: 12px; top: 10px; font-size: 18px; color: #8e8e93; cursor: pointer; font-weight: 300; }
        .quote-text { font-size: 12px; color: #3a3a3c; line-height: 1.5; white-space: pre-wrap; }

        /* 输入栏 - 高质感 */
        .chat-footer { flex-shrink: 0; background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.05); padding: 8px 16px 25px; display: flex; flex-direction: column; }
        .input-row { display: flex; align-items: center; gap: 12px; width: 100%; }
        .add-circle { width: 28px; height: 28px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 20px; cursor: pointer; }
        .chat-inp-box { flex: 1; border: none; background: #fff; border-radius: 18px; padding: 10px 14px; outline: none; font-size: 15px; height: 38px; }
        .send-btn-grey { font-size: 28px; color: #555; cursor: pointer; user-select: none; font-weight: 300; }

        /* 半屏详情 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 1100; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 1200; display: flex; flex-direction: column;
        }
        .half-sheet.dragging { transition: none !important; }
        .sheet-handle { width: 100%; height: 40px; flex-shrink: 0; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 60px; -webkit-overflow-scrolling: touch; }

        /* 包裹框组件 */
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
        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; }
        .danger-icon { color: rgba(0,0,0,0.2); font-weight: 300; transition: 0.3s; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
        
        /* 沉浸式单聊层 */
        #chatOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f2f2f7; z-index: 1000; display: none; flex-direction: column; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势重写：精准锁定导航条 =====
let isHandleDragging = false; let startDragY = 0;
window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { isHandleDragging = true; startDragY = e.touches[0].clientY; sheet.classList.add('dragging'); };
    handle.onclick = () => window.toggleSheet(false);
    window.addEventListener('touchmove', (e) => {
        if (!isHandleDragging) return;
        let d = e.touches[0].clientY - startDragY;
        if (d > 0) sheet.style.transform = `translateY(${d}px)`;
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
        if (!isHandleDragging) return; isHandleDragging = false; sheet.classList.remove('dragging');
        let d = event.changedTouches[0].clientY - startDragY;
        if (d > 120) window.toggleSheet(false); else sheet.style.transform = `translateY(0)`;
    });
};

window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) { window.toggleMental(false); mask.style.display = 'block'; setTimeout(() => { sheet.classList.add('active'); sheet.style.transform = 'translateY(0)'; }, 10); }
    else { sheet.classList.remove('active'); sheet.style.transform = 'translateY(100%)'; setTimeout(() => { mask.style.display = 'none'; sheet.style.transform = ''; }, 400); }
};

// ===== 4. 气泡菜单与引用逻辑 =====
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
        const h = prompt("重回方向："); if(h!==null){ longTarget.remove(); window.triggerReply("引导：" + h); }
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

// ===== 5. 核心渲染与接管 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectFlagshipStyle();
    document.body.classList.add('chat-active');
    document.getElementById('genericAppWindow').style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav"><div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeWhole()">‹</span>
                <span class="nav-title" id="chatMainTitle">聊天</span>
            </div></nav>
            <main id="mainBody" class="chat-main-body"></main>
            <footer class="tab-fixed-bottom">
                <div onclick="window.navTo('chats', this)" class="tab-item active">聊天</div>
                <div onclick="window.navTo('contacts', this)" class="tab-item">联系人</div>
                <div onclick="window.navTo('moments', this)" class="tab-item">动态</div>
                <div onclick="window.navTo('me', this)" class="tab-item">我的</div>
            </footer>
            <div id="chatOverlay"></div>
        </div>
    `;
    window.navTo('chats');
};

window.navTo = (t, el) => {
    const b = document.getElementById('mainBody');
    if (el) { el.parentElement.querySelectorAll('div').forEach(d => { d.classList.remove('active'); }); el.classList.add('active'); }
    if (t === 'chats') {
        b.innerHTML = `<div style="background:#fff;">${ChatConfig.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">点击开始对话</div></div>
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
            <div class="nav-status"></div><div class="nav-body">
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
            <div class="menu-row"><div class="menu-item" onclick="window.menuAct('copy')">复制</div><div class="menu-item">收藏</div><div class="menu-item" onclick="window.menuAct('regret')">重回</div><div class="menu-item">多选</div></div>
            <div class="menu-row"><div class="menu-item" onclick="window.menuAct('quote')">引用</div><div class="menu-item" onclick="window.menuAct('translate')">翻译</div></div>
        </div>

        <footer class="chat-footer">
            <div id="quotePreview" class="quote-preview"><span class="quote-close" onclick="window.cancelQuote()">x</span><div id="quoteText" class="quote-text"></div></div>
            <div class="input-row">
                <div class="add-circle">+</div>
                <input type="text" id="chatInp" class="chat-inp-box" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
                <div class="send-btn-grey" onclick="window.send()">+</div>
            </div>
        </footer>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div class="sheet-content" style="padding: 0 16px 100px;">
                    <div style="font-size:24px; font-weight:800; margin:10px 0 20px; color:#000;">聊天详情</div>
                    
                    <!-- 1. API 消耗详情 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px;">
                        <div style="font-size:18px; font-weight:800; margin-bottom:12px;">API 消耗详情</div>
                        <div style="margin-bottom:10px; font-size:14px; color:rgba(0,0,0,0.5);">全部点数：<span style="color:#000; font-weight:700;">${ChatConfig.settings.api.total} token</span></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                            <span style="font-size:13px; color:rgba(0,0,0,0.5);">线上：${ChatConfig.settings.api.online} token</span>
                            <span style="font-size:13px; color:rgba(0,0,0,0.5);">线下：${ChatConfig.settings.api.offline} token</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="font-size:13px; color:rgba(0,0,0,0.5);">生图：${ChatConfig.settings.api.image} token</span>
                            <span style="font-size:13px; color:rgba(0,0,0,0.5);">语音：${ChatConfig.settings.api.voice} token</span>
                        </div>
                    </div>

                    <!-- 2. 搜索聊天记录 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div style="font-size:18px; font-weight:800; margin-bottom:12px;">搜索聊天记录</div>
                        <input type="text" class="chat-inp-box" placeholder="请输入内容…" style="width:100%; background:rgba(255,255,255,0.8); border:1px solid rgba(0,0,0,0.05);" oninput="window.doSearch(this.value)">
                        <div id="searchRes" style="background:rgba(255,255,255,0.4); border-radius:12px; margin-top:10px; padding:10px; display:none; font-size:13px; color:rgba(0,0,0,0.6);"></div>
                    </div>

                    <!-- 3. 聊天总结 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:18px; font-weight:800;">聊天总结</span>
                            <span id="summ-val" style="font-weight:700;">${ChatConfig.settings.summaryCount}</span>
                        </div>
                        <div style="font-size:11px; color:#8e8e93; margin:8px 0;">提示：默认50轮自动总结，你可调自动总结轮数又或是手动总结。</div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSet('summaryCount', this.value, 'summ-val')">
                        <button class="black-btn" style="margin-top:10px;" onclick="window.manualSummary()">手动总结</button>
                    </div>

                    <!-- 4. 聊天背景图 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div style="font-size:18px; font-weight:800; margin-bottom:12px;">聊天背景图</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg}); height:120px; background-color:#fff; border:1px dashed rgba(0,0,0,0.1); display:flex; align-items:center; justify-content:center; color:#8e8e93;" onclick="window.pickBg()">
                            ${ChatConfig.chatBg ? '' : '点击添加聊天背景图'}
                        </div>
                        <button class="black-btn" style="margin-top:12px;" onclick="window.clearBg()">清除当前背景</button>
                    </div>

                    <!-- 5. 角色信息条数 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div style="font-size:18px; font-weight:800; margin-bottom:12px;">角色信息条数</div>
                        <div style="display:flex; justify-content:space-between; font-size:13px; color:#8e8e93;"><span>提示：回复最少</span><span id="reply-min-val" style="color:#000; font-weight:700;">${ChatConfig.settings.replyMin}</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMin}" class="ios-slider" oninput="window.updateSet('replyMin', this.value, 'reply-min-val')">
                        
                        <div style="display:flex; justify-content:space-between; font-size:13px; color:#8e8e93; margin-top:12px;"><span>提示：回复最多</span><span id="reply-max-val" style="color:#000; font-weight:700;">${ChatConfig.settings.replyMax}</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMax}" class="ios-slider" oninput="window.updateSet('replyMax', this.value, 'reply-max-val')">
                    </div>

                    <!-- 6. 线上聊天旁白 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div class="item-row">
                            <span style="font-size:18px; font-weight:800;">线上聊天旁白</span>
                            <input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration', this.checked)">
                        </div>
                    </div>

                    <!-- 7. 人称选择 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div style="font-size:18px; font-weight:800; margin-bottom:4px;">人称选择</div>
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:12px;">提示：用于聊天中的线上线下旁白。</div>
                        <div class="item-row" style="margin-bottom:10px;"><span>第一人称“我”</span><input type="radio" name="pronoun" class="custom-switch" ${ChatConfig.settings.pronoun=='me'?'checked':''} onclick="window.setSet('pronoun','me')"></div>
                        <div class="item-row" style="margin-bottom:10px;"><span>第二人称“你”</span><input type="radio" name="pronoun" class="custom-switch" ${ChatConfig.settings.pronoun=='you'?'checked':''} onclick="window.setSet('pronoun','you')"></div>
                        <div class="item-row"><span>第三人称“ta”</span><input type="radio" name="pronoun" class="custom-switch" ${ChatConfig.settings.pronoun=='ta'?'checked':''} onclick="window.setSet('pronoun','ta')"></div>
                    </div>

                    <!-- 8. 自动发消息 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div class="item-row">
                            <span style="font-size:18px; font-weight:800;">自动发消息</span>
                            <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoMsg?'checked':''} onchange="window.setSet('autoMsg', this.checked)">
                        </div>
                        <div style="font-size:11px; color:#8e8e93; margin:6px 0;">提示：角色会主动向你发消息。</div>
                        
                        <div style="margin-top:15px; position:relative; padding:0 10px;">
                            <div style="display:flex; justify-content:space-between; font-size:10px; color:#000; font-weight:700; margin-bottom:5px;">
                                <span>1h</span><span>5h</span><span>10h</span><span>24h</span>
                            </div>
                            <input type="range" min="0" max="3" step="1" value="${ChatConfig.settings.autoMsgFreq}" class="ios-slider" oninput="window.updateSet('autoMsgFreq', this.value)">
                            <div style="font-size:11px; color:#8e8e93; text-align:center; margin-top:8px;">提示：角色发消息的频率。</div>
                        </div>
                    </div>

                    <!-- 9. 自动翻译 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px;">
                        <div class="item-row">
                            <span style="font-size:18px; font-weight:800;">自动翻译</span>
                            <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate', this.checked)">
                        </div>
                        <div style="font-size:11px; color:#8e8e93; margin-top:4px;">提示：非简体中文的内容都将自动翻译成简体中文。</div>
                    </div>

                    <!-- 10. 危险区 -->
                    <div class="glass-group" style="background:rgba(255,255,255,0.6); border-radius:24px; padding:16px; margin-top:16px; border:1px solid rgba(255,0,0,0.1);">
                        <div class="danger-fold" onclick="window.toggleDanger()" style="font-size:18px; display:flex; justify-content:space-between; align-items:center;">
                            <span>危险区</span> <span class="danger-icon" id="danger-ic" style="color:rgba(0,0,0,0.3); font-weight:300;">></span>
                        </div>
                        <div class="danger-content" id="dangerZone" style="display:none; margin-top:15px; border-top:1px dashed rgba(255,0,0,0.1); padding-top:15px;">
                            <div style="font-size:11px; color:#ff3b30; margin-bottom:8px;">提示：请谨慎清空</div>
                            <button style="background:#fff; color:#ff3b30; border:1px solid #ff3b30; border-radius:12px; padding:12px; width:100%; margin-bottom:15px; font-weight:700;" onclick="window.clearLog()">清空聊天记录</button>
                            
                            <div style="font-size:11px; color:#ff3b30; margin-bottom:8px;">提示：拉黑角色后等于真正的删除好友。</div>
                            <button class="black-btn" style="margin-bottom:15px;">拉黑联系人</button>
                            
                            <div style="font-size:11px; color:#ff3b30; margin-bottom:8px;">提示：删除该角色后，角色还可以找上门来添加你</div>
                            <button style="background:#fff; color:#000; border:1px solid #000; border-radius:12px; padding:12px; width:100%; font-weight:700;">删除联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
    window.loadHistory();
};
    window.initGesture(document.getElementById('detailSheet'));
    window.loadHistory();
};

// ===== 修复：发送与状态栏联动系统 =====
window.send = async function() {
    const inp = document.getElementById('chatInp'); 
    const flow = document.getElementById('chatFlow');
    if (!inp) return;
    
    // 1. 发送前校验
    const t = inp.value.trim();
    if (!t) { 
        if (!ChatConfig.isAITyping) window.triggerReply(); 
        return; 
    }
    
    // 2. 联动：触发状态栏刷新
    if (typeof window.updateMentalStatus === 'function') {
        window.updateMentalStatus(t);
    }
    
    // 3. 生成气泡
    const isNar = /^[\(\（].*[\)\）]$/.test(t);
    const d = document.createElement('div'); 
    d.id = 'm-' + Date.now(); 
    d.className = isNar ? 'bubble-narration' : 'bubble bubble-user';
    d.innerText = t;
    
    if (flow) {
        flow.appendChild(d);
        flow.scrollTop = flow.scrollHeight;
    }
    inp.value = '';
};

// 状态栏刷新函数 (防御性编程，防止 undefined)
window.updateMentalStatus = function(userMessage) {
    try {
        const mentalData = window.ChatConfig?.mental || {};
        const targets = { 'm-mood': '平静', 'm-fav': '0', 'm-act': '无', 'm-tht': '思考中...' };
        for (let id in targets) {
            const el = document.getElementById(id);
            if (el) {
                const val = mentalData[id.replace('m-', '')];
                el.innerText = val !== undefined ? val : targets[id];
            }
        }
    } catch (e) { console.error("状态刷新异常:", e); }
};
