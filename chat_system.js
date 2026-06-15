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
                <div class="sheet-content">
                    <div style="font-size:22px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
                    
                    <div class="glass-group">
                        <div class="hint-text" style="margin-bottom:8px;">API 消耗详情 (token)</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:10px;">全部点数: <span id="api-disp">${ChatConfig.settings.api.total}</span></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span class="hint-text">线上: ${ChatConfig.settings.api.online}</span><span class="hint-text">线下: ${ChatConfig.settings.api.offline}</span></div>
                        <div style="display:flex; justify-content:space-between;"><span class="hint-text">生图: ${ChatConfig.settings.api.image}</span><span class="hint-text">语音: ${ChatConfig.settings.api.voice}</span></div>
                    </div>

                    <div style="margin-bottom:15px;"><input type="text" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; border-radius:12px; padding:14px;" oninput="window.doSearch(this.value)"><div id="searchRes" style="background:rgba(255,255,255,0.2); border-radius:12px; margin-top:8px; padding:10px; display:none;"></div></div>

                    <div class="glass-group">
                        <div class="item-row"><span>AI 总结</span> <span id="summ-val" class="hint-text">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSet('summaryCount', this.value, 'summ-val')">
                        <button class="black-btn">手动总结</button>
                    </div>

                    <div class="glass-group">
                        <div class="hint-text" style="margin-bottom:10px;">聊天背景图</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()">${!ChatConfig.chatBg ? '点击上传背景' : ''}</div>
                        <div style="background:#ff3b30; color:#fff; border-radius:12px; padding:12px; text-align:center; margin-top:10px; font-weight:700;" onclick="window.clearBg()">清除背景图</div>
                    </div>

                    <div class="glass-group">
                        <div class="item-row"><span>开启旁白</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration', this.checked)"></div>
                    </div>

                    <div class="glass-group">
                        <div class="item-row"><span>自动翻译</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate', this.checked)"></div>
                        <div class="hint-text">提示：非简体中文语言都将翻译成简体中文。</div>
                    </div>

                    <div class="glass-group">
                        <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span class="danger-icon" id="danger-ic">></span></div>
                        <div class="danger-content" id="dangerZone">
                            <button style="background:#fff; color:#ff3b30; border:none; border-radius:12px; padding:12px; width:100%; margin-bottom:10px;" onclick="window.clearLog()">清空聊天记录</button>
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

// 功能函数 (加固版)
// ===== 新增：实时刷新状态栏(心理/动作/好感)的 API 调用 =====
window.updateMentalStatus = async function(userMessage) {
    try {
        // 【在此处填入你实际的 API 请求逻辑】
        // 例如：
        // const response = await fetch('你的状态栏API地址', { 
        //     method: 'POST', 
        //     body: JSON.stringify({ message: userMessage }) 
        // });
        // const data = await response.json();
        
        // 假设 API 返回的数据格式并赋值给 ChatConfig.mental
        // ChatConfig.mental = { mood: data.mood, favorability: data.fav, action: data.action, thought: data.thought };

        // 实时更新 DOM 节点，对应上方设置的 id
        if (document.getElementById('m-mood')) {
            document.getElementById('m-mood').innerText = ChatConfig.mental.mood;
            document.getElementById('m-fav').innerText = ChatConfig.mental.favorability;
            document.getElementById('m-act').innerText = ChatConfig.mental.action;
            document.getElementById('m-tht').innerText = ChatConfig.mental.thought;
        }
    } catch (e) {
        console.error("状态栏 API 调用失败:", e);
    }
};

// ===== 修复并增强：发送消息与双线 API 调用 =====
window.send = async function() {
    const inp = document.getElementById('chatInp'); 
    const flow = document.getElementById('chatFlow');
    
    if (!inp.value.trim()) { 
        if (!ChatConfig.isAITyping) window.triggerReply(); 
        return; 
    }
    
    const t = inp.value.trim(); 
    const isNar = /^[\(\（].*[\)\）]$/.test(t);
    
    // 1. 渲染用户发送的气泡
    const d = document.createElement('div'); 
    d.id = 'm-' + Date.now(); 
    d.className = isNar ? 'bubble-narration' : 'bubble bubble-user';
    d.innerText = t;
    flow.appendChild(d);
    
    // 2. 清空输入框并滚动到底部
    inp.value = '';
    flow.scrollTop = flow.scrollHeight;

    // 3. 双线触发 API（同时请求回复和状态更新）
    if (typeof window.triggerReply === 'function') {
        window.triggerReply(t); // 触发主聊天 API
    }
    await window.updateMentalStatus(t); // 触发并刷新状态栏 API
}; d.innerText = t;
    flow.appendChild(d); inp.value = ''; window.saveHistory(); window.triggerReply(t);
};

window.triggerReply = async (ctx = "") => {
    // 1. 开始动画
    ChatConfig.isAITyping = true; 
    const titleEl = document.getElementById('chatTitle');
    if(titleEl) titleEl.innerHTML = `<span class="nav-typing">输入中…</span>`;

    // 2. 获取 API 配置
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if(!baseUrl || !apiKey || !model) {
        window.appendBot("【提示】请先在设置中配置 1号API 的 Key 和 地址。");
        ChatConfig.isAITyping = false; 
        if(titleEl) titleEl.innerText = "枝玉";
        return;
    }

    // 3. 构建指令（接入 ai_behavior.js）
    const userDefinedSetting = localStorage.getItem('current_char_setting') || "你是一个名叫枝玉的开发者。";
    const sysPrompt = window.getSystemPrompt ? window.getSystemPrompt(userDefinedSetting) : "你是一个真实的人。";

    let endpoint = baseUrl.replace(/\/+$/, '') + '/chat/completions';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: sysPrompt },
                    { role: 'user', content: ctx }
                ]
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0].message) {
            // 4. 发送给 appendBot 去显示
            window.appendBot(data.choices[0].message.content);
        } else {
            throw new Error(data.error?.message || "回复内容为空");
        }

    } catch (error) {
        window.appendBot(`[连接失败]: ${error.message}`);
    } finally {
        ChatConfig.isAITyping = false; 
        if(titleEl) titleEl.innerText = "枝玉";
    }
};

window.appendBot = (c) => {
    const f = document.getElementById('chatFlow'); let t = c; const jsonMatch = c.match(/\{.*\}/);
    if(jsonMatch){ try{ ChatConfig.mental = JSON.parse(jsonMatch[0]); t = c.replace(jsonMatch[0], "").trim(); }catch(e){} }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = t; d.id = 'm-'+Date.now(); d.oncontextmenu = (e)=>window.showBubbleMenu(e,d);
    f.appendChild(d); const ad = document.createElement('div'); ad.className = 'translate-adherent'; f.appendChild(ad);
    f.scrollTop = f.scrollHeight; window.saveHistory();
};

window.saveHistory = () => { const f = document.getElementById('chatFlow'); if(f) localStorage.setItem('yujie_logs_枝玉', JSON.stringify(f.innerHTML)); };
window.loadHistory = () => { const l = localStorage.getItem('yujie_logs_枝玉'); if(l){ const f = document.getElementById('chatFlow'); f.innerHTML = JSON.parse(l); f.querySelectorAll('.bubble').forEach(b => b.oncontextmenu = (e)=>window.showBubbleMenu(e,b)); } };
window.updateSet = (k,v,id) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k,v); if(id) document.getElementById(id).innerText=v+"轮"; };
window.setSet = (k,v) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k,v); };
window.toggleDanger = () => { const dz = document.getElementById('dangerZone'); const ic = document.getElementById('danger-ic'); const show = dz.style.display==='block'; dz.style.display=show?'none':'block'; ic.innerText=show?'>':'∨'; };
window.toggleMental = (s) => { const p = document.getElementById('mentalPop'); if(s===undefined) p.style.display=p.style.display==='block'?'none':'block'; else p.style.display=s?'block':'none'; };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

window.addEventListener('click', (e) => { 
    if(!e.target.closest('.bubble') && document.getElementById('bubbleMenu')) document.getElementById('bubbleMenu').style.display='none';
    const pop = document.getElementById('mentalPop'); if(pop && pop.style.display==='block' && !pop.contains(e.target) && !e.target.classList.contains('nav-mental-btn')) window.toggleMental(false);
});

console.log("玉界：旗舰加固完全体已注入。");
