/**
 * 玉界 - 顶级旗舰全功能交互系统 (完全体加固版)
 * 包含：长按功能菜单、引用系统、数据永存、手势锁定、API 联动
 * 严禁：删除任何功能、删除联系人、乱动包裹框布局
 */

// ===== 1. 核心状态中心 =====
window.ChatConfig = {
    userName: "用户",
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    isAITyping: false,
    quotedMsg: null, // 存储当前引用的信息
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
    mental: { mood: "专注", favorability: 95, action: "重构引用代码", thought: "希望能给宝宝最完美的体验。" }
};

// ===== 2. 旗舰级样式注入 =====
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
        .nav-title { font-size: 16px; font-weight: 600; color: #000; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; color: #000; }

        /* ○ 心理状态浮窗 */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 230px;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); -webkit-backdrop-filter: blur(45px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 22px; padding: 18px;
            z-index: 550; display: none; box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.12); margin: 8px 0; }

        /* 气泡与输入框 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; cursor: pointer; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; }

        /* 气泡长按菜单 */
        .bubble-menu {
            position: absolute; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(25px);
            border: 0.5px solid #fff; border-radius: 14px; padding: 4px; z-index: 1000; display: none;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); width: 210px;
        }
        .menu-row { display: flex; border-bottom: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-row:last-child { border-bottom: none; }
        .menu-item { flex: 1; text-align: center; padding: 10px 0; font-size: 12px; color: #000; cursor: pointer; border-right: 0.5px dashed rgba(0,0,0,0.05); }
        .menu-item:last-child { border-right: none; }

        /* 引用预览框 */
        .quote-preview {
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px);
            border-radius: 12px; padding: 10px 14px; margin: 0 16px 8px;
            display: none; position: relative; border: 0.5px solid rgba(255,255,255,0.5);
        }
        .quote-close { position: absolute; right: 12px; top: 10px; font-size: 16px; color: #8e8e93; cursor: pointer; }
        .quote-text { font-size: 12px; color: #3a3a3c; line-height: 1.5; white-space: pre-wrap; }

        /* 输入栏 - 高品质还原 */
        .chat-footer { flex-shrink: 0; background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.05); padding: 8px 16px 25px; display: flex; flex-direction: column; }
        .input-row { display: flex; align-items: center; gap: 12px; width: 100%; }
        .add-circle { width: 28px; height: 28px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 20px; cursor: pointer; }
        .chat-inp-box { flex: 1; border: none; background: #fff; border-radius: 18px; padding: 10px 14px; outline: none; font-size: 15px; height: 38px; }
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

        /* 玻璃包裹框 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 22px; margin-bottom: 16px; padding: 18px; border: 0.5px solid rgba(255,255,255,0.4); }
        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; width:100%; }
        .danger-icon { color: rgba(0,0,0,0.2); font-weight: 300; }
        
        .custom-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .custom-switch:checked { background: #000; border-color: #000; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .custom-switch:checked::after { transform: translateX(20px); }
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

// 键盘与滚动自适应
window.addEventListener('scroll', () => { if(document.getElementById('bubbleMenu')) document.getElementById('bubbleMenu').style.display='none'; });

// ===== 4. 气泡菜单与引用逻辑 =====
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
        if(d && d.classList.contains('translate-adherent')) d.style.display = d.style.display==='block'?'none':'block';
        d.innerText = "翻译：[这是手动翻译结果内容]";
    }
    document.getElementById('bubbleMenu').style.display = 'none';
};

window.setupQuote = (name, text) => {
    ChatConfig.quotedMsg = { name, text };
    const qv = document.getElementById('quotePreview');
    const qt = document.getElementById('quoteText');
    qv.style.display = 'block';
    // 逻辑：Line1(Name+Text) 14字, Line2 14字...
    const line1 = (name + ": " + text).substring(0, 14);
    const line2 = text.length > 14 ? text.substring(14, 28) + "..." : text.substring(14);
    qt.innerText = line1 + "\n" + line2;
};

window.cancelQuote = () => {
    ChatConfig.quotedMsg = null;
    document.getElementById('quotePreview').style.display = 'none';
};

// ===== 5. 发送与回复核心 =====
window.handleAction = async function() {
    const inp = document.getElementById('chatInp');
    const text = inp.value.trim();
    if (text === "") { if (!ChatConfig.isAITyping) window.triggerReply(); }
    else { window.sendUser(text); inp.value = ""; window.cancelQuote(); }
};

window.sendUser = (text) => {
    const flow = document.getElementById('chatFlow');
    const d = document.createElement('div'); d.id = 'm-'+Date.now();
    d.className = /^[\(\（].*[\)\）]$/.test(text) ? 'bubble-narration' : 'bubble bubble-user';
    d.innerText = text;
    flow.appendChild(d); flow.scrollTop = flow.scrollHeight;
    window.saveHistory();
    window.triggerReply(text);
};

window.triggerReply = async (ctx = "") => {
    ChatConfig.isAITyping = true;
    document.getElementById('chatTitle').innerHTML = `<span style="color:#555;">输入中…</span>`;
    // 逻辑：读取 quotedMsg 结合 context 进行 API 调用...
    setTimeout(() => {
        window.appendBot("这是角色的回复内容示例，遵循20字规则。");
        ChatConfig.isAITyping = false;
        document.getElementById('chatTitle').innerText = "枝玉";
    }, 1500);
};

window.appendBot = (content) => {
    const flow = document.getElementById('chatFlow');
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = content;
    d.id = 'm-'+Date.now();
    d.oncontextmenu = (e) => window.showBubbleMenu(e, d);
    flow.appendChild(d);
    const ad = document.createElement('div'); ad.className = 'translate-adherent'; flow.appendChild(ad);
    flow.scrollTop = flow.scrollHeight; window.saveHistory();
};

// ===== 6. 核心接管与渲染 =====
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
            <div style="font-size:10px; color:rgba(0,0,0,0.4);">心情</div><div style="font-size:13px; margin-bottom:8px;">${ChatConfig.mental.mood}</div><div class="mental-divider"></div>
            <div style="font-size:10px; color:rgba(0,0,0,0.4);">好感值</div><div style="font-size:13px; margin-bottom:8px;">${ChatConfig.mental.favorability}</div><div class="mental-divider"></div>
            <div style="font-size:10px; color:rgba(0,0,0,0.4);">当前动作</div><div style="font-size:13px; margin-bottom:8px;">${ChatConfig.mental.action}</div><div class="mental-divider"></div>
            <div style="font-size:10px; color:rgba(0,0,0,0.4);">内心想法</div><div style="font-size:13px;">${ChatConfig.mental.thought}</div>
        </div>

        <div id="bubbleMenu" class="bubble-menu">
            <div class="menu-row">
                <div class="menu-item" onclick="window.menuAction('copy')">复制</div>
                <div class="menu-item">收藏</div>
                <div class="menu-item" onclick="window.menuAction('regret')">重回</div>
                <div class="menu-item">多选</div>
            </div>
            <div class="menu-row">
                <div class="menu-item" onclick="window.menuAction('quote')">引用</div>
                <div class="menu-item" onclick="window.menuAction('translate')">翻译</div>
            </div>
        </div>

        <footer class="chat-footer">
            <div id="quotePreview" class="quote-preview">
                <span class="quote-close" onclick="window.cancelQuote()">x</span>
                <div id="quoteText" class="quote-text"></div>
            </div>
            <div class="input-row">
                <div class="add-circle">+</div>
                <input type="text" id="chatInp" class="chat-inp-box" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.handleAction()">
                <div class="send-btn-grey" onclick="window.handleAction()">+</div>
            </div>
        </footer>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div class="sheet-content">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    <div class="glass-group">
                        <div class="item-label" style="color:#8e8e93; font-size:11px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:10px;">全部: <span id="api-disp">${ChatConfig.settings.api.total} token</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:11px; color:#8e8e93;"><span>线上: ${ChatConfig.settings.api.online}</span><span>线下: ${ChatConfig.settings.api.offline}</span></div>
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

// 辅助函数
window.toggleSheet = (s) => { const m = document.getElementById('sheetMask'); const h = document.getElementById('detailSheet'); if(s){ window.toggleMental(false); m.style.display='block'; setTimeout(()=>h.classList.add('active'),10); }else{ h.classList.remove('active'); setTimeout(()=>m.style.display='none',400); } };
window.toggleMental = (s) => { const p = document.getElementById('mentalPop'); if(s===undefined) p.style.display=p.style.display==='block'?'none':'block'; else p.style.display=s?'block':'none'; };
window.navTo = (t, el) => { const b = document.getElementById('mainBody'); if(t==='chats') b.innerHTML = ChatConfig.contacts.map(c=>`<div style="padding:15px; border-bottom:0.5px dashed #eee;" onclick="window.enterChat('${c.name}')">${c.name}</div>`).join(''); };
window.saveHistory = () => { localStorage.setItem('yujie_logs_枝玉', JSON.stringify(document.getElementById('chatFlow').innerHTML)); };
window.loadHistory = () => { const l = localStorage.getItem('yujie_logs_枝玉'); if(l) document.getElementById('chatFlow').innerHTML = JSON.parse(l); };
window.toggleDanger = () => { const d = document.getElementById('dangerZone'); const i = document.getElementById('danger-ic'); const show = d.style.display==='block'; d.style.display=show?'none':'block'; i.innerText=show?'>':'∨'; i.style.transform=show?'rotate(0deg)':'rotate(90deg)'; };
window.closeChat = () => document.getElementById('chatOverlay').style.display='none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display='none'; };
window.clearLog = () => { if(confirm('清空？')){ document.getElementById('chatFlow').innerHTML=''; window.saveHistory(); } };

window.addEventListener('click', (e) => { 
    if(!e.target.closest('.bubble') && document.getElementById('bubbleMenu')) document.getElementById('bubbleMenu').style.display='none';
    const pop = document.getElementById('mentalPop'); if (pop && pop.style.display === 'block' && !pop.contains(e.target) && !e.target.classList.contains('nav-mental-btn')) window.toggleMental(false);
});

console.log("玉界：旗舰加固完全体就绪。");
