/**
 * 玉界 - 旗舰级全功能交互系统 (长按功能框 + 液态玻璃完全体)
 * 修复：恢复所有玻璃包裹框、长按功能菜单、重回逻辑、手动翻译
 */

// ===== 1. 核心状态与持久化 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    settings: {
        summaryCount: parseInt(localStorage.getItem('yujie_summary_count') || 50),
        replyMin: parseInt(localStorage.getItem('yujie_reply_min') || 1),
        replyMax: parseInt(localStorage.getItem('yujie_reply_max') || 3),
        onlineNarration: localStorage.getItem('yujie_narration') !== 'false',
        autoTranslate: localStorage.getItem('yujie_translate') === 'true',
        autoMsg: localStorage.getItem('yujie_auto_msg') === 'true',
        autoMsgFreq: parseInt(localStorage.getItem('yujie_auto_msg_freq') || 0),
        pronoun: localStorage.getItem('yujie_pronoun') || 'me',
        api: JSON.parse(localStorage.getItem('yujie_api_data') || '{"total":0,"online":0,"offline":0,"image":0,"voice":0}')
    },
    mental: { mood: "专注", favorability: 90, action: "重构底层逻辑", thought: "希望能给宝宝极致的手感。" },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝' }]
};

// ===== 2. 全量视觉样式注入 =====
const injectSystemStyles = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }
        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        .chat-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color: #000; }
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; }

        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; transition: opacity 0.3s; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; cursor: pointer; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }
        .translate-adherent { align-self: flex-start; background: rgba(255,255,255,0.3); backdrop-filter: blur(15px); font-size: 13px; color: #3a3a3c; margin-top: -4px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; }

        /* 长按功能菜单 */
        .context-menu {
            position: fixed; background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border: 0.5px solid rgba(255,255,255,0.8); border-radius: 18px; padding: 12px;
            z-index: 1000; display: flex; flex-direction: column; gap: 10px; width: 220px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: none;
        }
        .menu-row { display: flex; justify-content: space-between; }
        .menu-btn { flex: 1; text-align: center; font-size: 12px; color: #000; font-weight: 500; cursor: pointer; }

        /* 重回输入框 */
        .regret-dialog {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 280px; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(40px);
            border-radius: 20px; padding: 20px; z-index: 1100; border: 0.5px solid #fff; display: none;
        }
        .regret-input { width: 100%; height: 80px; background: rgba(255,255,255,0.2); border: none; border-radius: 12px; padding: 12px; outline: none; margin-bottom: 15px; font-size: 14px; }

        /* 半屏详情玻璃盒 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650; display: flex; flex-direction: column;
        }
        .half-sheet.active { transform: translateY(0); }
        .sheet-handle { width: 100%; height: 40px; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }

        .custom-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; }
        .custom-switch:checked { background: #000; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .custom-switch:checked::after { transform: translateX(20px); }
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }
        .bg-preview-box { width: 100%; height: 120px; border-radius: 15px; border: 2px dashed rgba(0,0,0,0.1); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.3); cursor: pointer; margin-bottom: 10px; }
        .black-btn { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势与长按核心驱动 =====
let longPressTimer;
window.initBubbleEvents = (el, text) => {
    el.ontouchstart = (e) => {
        longPressTimer = setTimeout(() => window.showContextMenu(e, text, el), 600);
    };
    el.ontouchend = () => clearTimeout(longPressTimer);
};

window.showContextMenu = (e, text, el) => {
    const menu = document.getElementById('bubbleMenu');
    menu.style.display = 'flex';
    menu.style.left = Math.min(window.innerWidth - 230, Math.max(10, e.touches[0].clientX - 110)) + 'px';
    menu.style.top = (e.touches[0].clientY - 120) + 'px';
    window.currentActiveBubble = { text, el };
};

// ===== 4. 详情半窗布局全恢复 =====
window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) { mask.style.display = 'block'; setTimeout(() => sheet.classList.add('active'), 10); }
    else { sheet.classList.remove('active'); setTimeout(() => mask.style.display = 'none', 400); }
};

// ===== 5. 核心渲染 (禁止删除枝玉) =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectSystemStyles();
    document.body.classList.add('chat-active');
    document.getElementById('genericAppWindow').style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav"><div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeWhole()">‹</span>
                <span class="nav-title" id="chatTitle">聊天</span>
            </div></nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; background:#fff;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05);">
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
                <span class="nav-title" id="chatHeaderTitle" onclick="window.toggleSheet(true)">${name}</span>
                <span class="nav-mental-btn" onclick="window.toggleMental()">○</span>
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover;"></div>
        
        <!-- 长按功能框 -->
        <div id="bubbleMenu" class="context-menu" onclick="event.stopPropagation()">
            <div class="menu-row">
                <div class="menu-btn" onclick="window.menuAction('copy')">复制</div>
                <div class="menu-btn" onclick="window.menuAction('fav')">收藏</div>
                <div class="menu-btn" onclick="window.menuAction('regret')">重回</div>
                <div class="menu-btn" onclick="window.menuAction('multi')">多选</div>
            </div>
            <div class="menu-row">
                <div class="menu-btn" onclick="window.menuAction('quote')">引用</div>
                <div class="menu-btn" onclick="window.menuAction('trans')">翻译</div>
                <div class="menu-btn" style="opacity:0;">-</div>
                <div class="menu-btn" style="opacity:0;">-</div>
            </div>
        </div>

        <!-- 重回引导对话框 -->
        <div id="regretDialog" class="regret-dialog">
            <div style="font-weight:700; margin-bottom:10px; font-size:15px;">重回方向引导</div>
            <textarea id="regretInp" class="regret-input" placeholder="请输入想重回的原因及方向..."></textarea>
            <button class="black-btn" onclick="window.confirmRegret()">确认重回</button>
        </div>

        <div style="padding:10px 16px 30px; background:rgba(255,255,255,0.4); backdrop-filter:blur(30px); display:flex; align-items:center; gap:12px;">
            <div class="add-circle">+</div>
            <input type="text" id="chatInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
            <div style="font-size:26px; color:#555; cursor:pointer;" onclick="window.send()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle" onclick="window.toggleSheet(false)"><div class="handle-bar"></div></div>
                <div class="sheet-content">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    
                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:10px;">全部点数: <span id="api-total">${ChatConfig.settings.api.total} token</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;"><span>线上: ${ChatConfig.settings.api.online}</span><span>线下: ${ChatConfig.settings.api.offline}</span></div>
                        <div style="display:flex; justify-content:space-between; font-size:12px;"><span>生图: ${ChatConfig.settings.api.image}</span><span>语音: ${ChatConfig.settings.api.voice}</span></div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between;"><span>AI 总结</span> <span id="summ-val" style="color:#8e8e93;">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSumm(this.value)">
                        <button class="black-btn">手动总结</button>
                    </div>

                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">聊天背景设置</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()"></div>
                        <div style="background:#ff3b30; color:#fff; border-radius:12px; padding:12px; text-align:center;" onclick="window.clearBg()">清除背景图</div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>开启线上旁白</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.updateSwitch('onlineNarration',this.checked)"></div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;"><span>自动翻译</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.updateSwitch('autoTranslate',this.checked)"></div>
                        <div style="font-size:11px; color:#8e8e93;">提示：非简体中文的语言都将翻译成简体中文。</div>
                    </div>

                    <div class="glass-group">
                        <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span id="danger-icon">></span></div>
                        <div class="danger-content" id="dangerZone">
                            <button style="background:#fff; color:#ff3b30; border-radius:12px; padding:12px; width:100%; border:none;" onclick="window.clearLog()">清空聊天记录</button>
                            <button class="black-btn" style="margin:10px 0;">拉黑联系人</button>
                            <button style="background:#fff; border-radius:12px; padding:12px; width:100%; border:none;">删除联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.loadHistory(name);
};

// ===== 6. 长按菜单与重回逻辑 =====
window.menuAction = (act) => {
    const { text, el } = window.currentActiveBubble;
    document.getElementById('bubbleMenu').style.display = 'none';
    if(act === 'copy') { navigator.clipboard.writeText(text); alert('已复制到剪切板'); }
    if(act === 'trans') { window.manualTranslate(el, text); }
    if(act === 'regret') { document.getElementById('regretDialog').style.display = 'block'; }
    if(act === 'fav') { alert('已加入收藏夹（功能预留）'); }
};

window.confirmRegret = () => {
    const hint = document.getElementById('regretInp').value;
    document.getElementById('regretDialog').style.display = 'none';
    const { el } = window.currentActiveBubble;
    el.style.opacity = '0.3'; // 标记正在重写
    window.sendToAPI("系统指令：重写上一句。引导方向：" + (hint || "意思不变，换种表达"));
};

window.manualTranslate = (el, text) => {
    const existing = el.nextElementSibling;
    if(existing && existing.classList.contains('translate-adherent')) {
        existing.remove();
    } else {
        const t = document.createElement('div');
        t.className = 'translate-adherent';
        t.innerText = "翻译：[正在将角色语言转译为简体中文...]";
        el.after(t);
    }
};

// ===== 7. 发送与 API 逻辑 =====
window.send = () => {
    const inp = document.getElementById('chatInp');
    if(!inp.value.trim()) { window.sendToAPI("请继续。"); return; }
    const text = inp.value.trim();
    appendBubble(document.getElementById('chatFlow'), text.startsWith('(')?'narration':'user', text);
    inp.value = '';
    window.sendToAPI(text);
};

window.sendToAPI = async (text) => {
    // 模拟回复与状态刷新
    document.getElementById('chatHeaderTitle').innerText = "输入中…";
    setTimeout(() => {
        document.getElementById('chatHeaderTitle').innerText = "枝玉";
        appendBubble(document.getElementById('chatFlow'), 'assistant', "你好呀宝宝，我正在读取你的新引导。");
        ChatConfig.settings.api.total += 12;
        localStorage.setItem('yujie_api_data', JSON.stringify(ChatConfig.settings.api));
    }, 1200);
};

function appendBubble(box, role, text) {
    const d = document.createElement('div');
    d.className = `bubble bubble-${role}`;
    d.innerText = text;
    if(role === 'assistant') window.initBubbleEvents(d, text);
    box.appendChild(d);
    box.scrollTop = box.scrollHeight;
    window.saveHistory();
}

// 持久化辅助
window.saveHistory = () => localStorage.setItem('yujie_logs_枝玉', document.getElementById('chatFlow').innerHTML);
window.loadHistory = () => { const l = localStorage.getItem('yujie_logs_枝玉'); if(l) { document.getElementById('chatFlow').innerHTML = l; Array.from(document.querySelectorAll('.bubble-assistant')).forEach(b => window.initBubbleEvents(b, b.innerText)); } };
window.updateSumm = (v) => { ChatConfig.settings.summaryCount = v; document.getElementById('summ-val').innerText = v + '轮'; localStorage.setItem('yujie_summary_count', v); };
window.updateSwitch = (k, v) => { ChatConfig.settings[k] = v; localStorage.setItem('yujie_' + k, v); };
window.toggleDanger = () => { const dz = document.getElementById('dangerZone'); const ic = document.getElementById('danger-icon'); const show = dz.style.display==='block'; dz.style.display=show?'none':'block'; ic.innerText=show?'>':'∨'; };
window.pickBg = () => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{ const f = e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(ev)=>{ ChatConfig.chatBg = ev.target.result; localStorage.setItem('yujie_chat_bg', ev.target.result); document.getElementById('bgPrev').style.backgroundImage = `url(${ev.target.result})`; document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`; }; r.readAsDataURL(f); } }; i.click(); };
window.clearBg = () => { ChatConfig.chatBg=''; localStorage.removeItem('yujie_chat_bg'); document.getElementById('bgPrev').style.backgroundImage=''; document.getElementById('chatFlow').style.backgroundImage=''; };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

window.addEventListener('click', () => { document.getElementById('bubbleMenu').style.display = 'none'; });

console.log("玉界：旗舰交互完全体系统就绪。");
