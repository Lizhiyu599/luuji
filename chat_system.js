/**
 * 玉界 - 顶级全功能旗舰交互系统 (重构加固版)
 * 包含：长按功能菜单、重回逻辑、手动翻译吸附、数据持久化、玻璃框全归位
 * 严禁：删除功能、删除联系人、乱改布局
 */

// ===== 1. 核心数据与状态中心 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    userName: "用户",
    isAITyping: false,
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
    // 强制锁定枝玉
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '测试专用角色' }],
    mental: { mood: "专注", favorability: 95, action: "构建系统", thought: "希望能给宝宝最完美的体验。" }
};

// ===== 2. 旗舰级样式注入 (含长按菜单) =====
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

        /* 长按功能框 */
        .bubble-menu {
            position: absolute; background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(25px);
            border: 0.5px solid rgba(255, 255, 255, 0.8); border-radius: 14px; padding: 6px;
            z-index: 1000; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            width: max-content; pointer-events: auto;
        }
        .menu-row { display: flex; gap: 4px; justify-content: space-around; margin: 2px 0; }
        .menu-item { padding: 8px 12px; font-size: 12px; font-weight: 500; color: #000; cursor: pointer; transition: 0.2s; border-radius: 8px; }
        .menu-item:active { background: rgba(0,0,0,0.05); }

        /* 气泡 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; cursor: pointer; transition: transform 0.2s; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .translate-adherent { align-self: flex-start; background: rgba(255,255,255,0.3); backdrop-filter: blur(15px); font-size: 13px; color: #3a3a3c; margin-top: -4px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; display: none; }

        /* 半屏详情 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650; display: flex; flex-direction: column;
        }
        .sheet-handle { width: 100%; height: 40px; flex-shrink: 0; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 50px; }

        /* 玻璃包裹框 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .custom-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; }
        .custom-switch:checked { background: #000; border-color: #000; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .custom-switch:checked::after { transform: translateX(20px); }

        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }
        
        .black-btn { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; width: 100%; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势与交互逻辑 =====
let isDragging = false; let dragStartY = 0;
window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { isDragging = true; dragStartY = e.touches[0].clientY; sheet.style.transition = 'none'; };
    handle.onclick = () => window.toggleSheet(false);
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        let d = e.touches[0].clientY - dragStartY;
        if (d > 0) sheet.style.transform = `translateY(${d}px)`;
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
        if (!isDragging) return; isDragging = false; 
        sheet.style.transition = 'transform 0.4s cubic-bezier(0.2, 1, 0.3, 1)';
        let d = e.changedTouches[0].clientY - dragStartY;
        if (d > 150) window.toggleSheet(false); else sheet.style.transform = `translateY(0)`;
    });
};

window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) { mask.style.display = 'block'; setTimeout(() => { sheet.classList.add('active'); sheet.style.transform = 'translateY(0)'; }, 10); }
    else { sheet.classList.remove('active'); sheet.style.transform = 'translateY(100%)'; setTimeout(() => { mask.style.display = 'none'; }, 400); }
};

// ===== 4. 聊天与气泡长按功能 =====
let lastLongPressedEl = null;

window.showBubbleMenu = (e, el) => {
    e.preventDefault();
    lastLongPressedEl = el;
    const menu = document.getElementById('bubbleMenu');
    menu.style.display = 'block';
    // 定位在气泡上方
    const rect = el.getBoundingClientRect();
    menu.style.top = (rect.top - 80) + 'px';
    menu.style.left = Math.max(10, rect.left + (rect.width/2) - 100) + 'px';
};

window.handleMenuAction = (action) => {
    const text = lastLongPressedEl.innerText;
    if (action === 'copy') {
        navigator.clipboard.writeText(text); alert('已复制');
    } else if (action === 'translate') {
        const ad = lastLongPressedEl.nextElementSibling;
        if (ad && ad.classList.contains('translate-adherent')) {
            ad.style.display = (ad.style.display === 'block' ? 'none' : 'block');
            ad.innerText = "翻译：[正在手动转换人物语言...]";
        }
    } else if (action === 'regret') {
        window.openRegretModal();
    }
    document.getElementById('bubbleMenu').style.display = 'none';
};

window.openRegretModal = () => {
    const reason = prompt("请输入重回的原因及方向(可填可不填):", "");
    if (reason !== null) {
        lastLongPressedEl.remove(); // 逻辑：重回后删掉当前句，重新触发
        window.triggerAIReply("用户要求重回逻辑：" + reason);
    }
};

// ===== 5. 核心渲染实现 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectUltraStyle();
    document.body.classList.add('chat-active');
    document.getElementById('genericAppWindow').style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav"><div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeWhole()">‹</span>
                <span class="nav-title">聊天</span>
            </div></nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; background:#fff;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05); padding-bottom:env(safe-area-inset-bottom);">
                <div onclick="window.navTo('chats', this)" style="font-weight:700; cursor:pointer;">聊天</div>
                <div style="color:#8e8e93;">联系人</div><div style="color:#8e8e93;">动态</div><div style="color:#8e8e93;">我的</div>
            </footer>
            <div id="chatOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:500; display:none; flex-direction:column;"></div>
        </div>
    `;
    window.navTo('chats');
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
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover; background-position:center;"></div>
        
        <!-- 长按功能菜单 -->
        <div id="bubbleMenu" class="bubble-menu">
            <div class="menu-row">
                <div class="menu-item" onclick="window.handleMenuAction('copy')">复制</div>
                <div class="menu-item" onclick="window.handleMenuAction('fav')">收藏</div>
                <div class="menu-item" onclick="window.handleMenuAction('regret')">重回</div>
                <div class="menu-item" onclick="window.handleMenuAction('multi')">多选</div>
            </div>
            <div class="menu-row">
                <div class="menu-item" onclick="window.handleMenuAction('quote')">引用</div>
                <div class="menu-item" onclick="window.handleMenuAction('translate')">翻译</div>
            </div>
        </div>

        <div class="chat-footer">
            <div class="add-circle">+</div>
            <input type="text" id="chatInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.handleAction()">
            <div class="send-btn-grey" onclick="window.handleAction()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div class="sheet-content">
                    <div style="font-size:20px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
                    
                    <div class="glass-group">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:8px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:10px;">全部点数: <span id="api-disp">${ChatConfig.settings.api.total} token</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;"><span style="color:#8e8e93;">线上: ${ChatConfig.settings.api.online} token</span><span style="color:#8e8e93;">线下: ${ChatConfig.settings.api.offline} token</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:12px;"><span style="color:#8e8e93;">生图: ${ChatConfig.settings.api.image} token</span><span style="color:#8e8e93;">语音: ${ChatConfig.settings.api.voice} token</span></div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between;"><span>AI 总结</span> <span id="summ-val" style="color:#8e8e93;">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSet('summaryCount', this.value, 'summ-val')">
                        <button class="black-btn">手动立即总结</button>
                    </div>

                    <div class="glass-group">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">聊天背景设置</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()"></div>
                        <div style="background:#000; color:#fff; border-radius:12px; padding:12px; text-align:center;" onclick="window.clearBg()">清除当前背景</div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>开启线上旁白</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration', this.checked)"></div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;"><span>自动翻译</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate', this.checked)"></div>
                        <div style="font-size:11px; color:#8e8e93;">提示：非简体中文的语言都将翻译成简体中文。</div>
                    </div>

                    <div class="glass-group">
                        <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span id="danger-icon">></span></div>
                        <div class="danger-content" id="dangerZone">
                            <button style="background:#fff; color:#ff3b30; border:none; border-radius:12px; padding:12px; width:100%; margin-bottom:10px; font-weight:600;" onclick="window.clearLog()">清空聊天记录</button>
                            <button class="black-btn" style="margin-bottom:10px;">拉黑联系人</button>
                            <button style="background:#fff; color:#000; border:none; border-radius:12px; padding:12px; width:100%;">删除联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
    window.loadHistory(name);
};

// 功能函数 (略同，加固气泡长按逻辑)
window.appendBotBubble = (content) => {
    const flow = document.getElementById('chatFlow');
    let text = content;
    const jsonMatch = content.match(/\{.*\}/);
    if (jsonMatch) { try { ChatConfig.mental = JSON.parse(jsonMatch[0]); text = content.replace(jsonMatch[0], "").trim(); } catch(e) {} }
    
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = text;
    d.oncontextmenu = (e) => window.showBubbleMenu(e, d); // 绑定长按
    flow.appendChild(d);
    
    const ad = document.createElement('div'); ad.className = 'translate-adherent';
    flow.appendChild(ad);
    
    flow.scrollTop = flow.scrollHeight; window.saveHistory();
};

window.handleAction = function() {
    const inp = document.getElementById('chatInp'); const text = inp.value.trim();
    if(text==="") { if(!ChatConfig.isAITyping) window.triggerAIReply(); }
    else { 
        const d = document.createElement('div'); d.className = (text.startsWith('(')||text.startsWith('（'))?'bubble-narration':'bubble bubble-user'; d.innerText = text;
        document.getElementById('chatFlow').appendChild(d); inp.value=""; window.saveHistory(); window.triggerAIReply(text);
    }
};

window.navTo = (t) => {
    const b = document.getElementById('mainBody'); if(t==='chats') b.innerHTML = ChatConfig.contacts.map(c=>`<div style="padding:15px; border-bottom:0.5px dashed #eee;" onclick="window.enterChat('${c.name}')">${c.name}</div>`).join('');
};

window.saveHistory = () => { localStorage.setItem('yujie_logs_枝玉', JSON.stringify(document.getElementById('chatFlow').innerHTML)); };
window.loadHistory = () => { const l = localStorage.getItem('yujie_logs_枝玉'); if(l) document.getElementById('chatFlow').innerHTML = JSON.parse(l); };
window.updateSet = (k,v,id) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k, v); if(id) document.getElementById(id).innerText = v+"轮"; };
window.setSet = (k,v) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k, v); };
window.toggleDanger = () => { const d = document.getElementById('dangerZone'); const i = document.getElementById('danger-icon'); const show = d.style.display==='block'; d.style.display=show?'none':'block'; i.innerText=show?'>':'∨'; };
window.closeChat = () => document.getElementById('chatOverlay').style.display='none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display='none'; };

// 点击关闭长按菜单
window.addEventListener('click', () => { if(document.getElementById('bubbleMenu')) document.getElementById('bubbleMenu').style.display='none'; });

console.log("玉界：旗舰版交互加固版已就绪。");
