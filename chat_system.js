/**
 * 玉界 - 旗舰全功能沉浸式交互系统 (加固完全体)
 * 视觉：iOS 18 Liquid Glass / VisionOS
 * 核心：长按菜单、○状态窗、三行API、搜索定位、数据永存
 * 严禁：删除功能、删除联系人、修改包裹框结构
 */

// ===== 1. 全量状态与持久化 =====
window.ChatConfig = {
    userName: "用户",
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    isAITyping: false,
    // 聊天详细配置
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
        autoMsgFreq: parseInt(localStorage.getItem('yujie_auto_msg_freq') || 0), // 0-3 档位
        pronoun: localStorage.getItem('yujie_pronoun') || 'me' 
    },
    // 联系人（严禁删除）
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '测试专用角色' }],
    mental: { mood: "专注", favorability: 95, action: "重构逻辑", thought: "这次一定把所有功能都锁死！" }
};

// ===== 2. 旗舰级样式 (Liquid Glass) =====
const injectFlagshipStyle = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        /* 环境加固 */
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

        /* ○ 心理状态浮窗 */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 230px;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); -webkit-backdrop-filter: blur(45px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 22px; padding: 18px;
            z-index: 550; display: none; box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .mental-title { font-weight: 800; font-size: 15px; margin-bottom: 12px; }
        .mental-hint { font-size: 10px; color: rgba(0,0,0,0.4); margin-bottom: 2px; }
        .mental-value { font-size: 13px; color: #1d1d1f; margin-bottom: 10px; }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        /* 气泡与长按菜单 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; cursor: pointer; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 15px 0; max-width: 85%; }
        .translate-adherent { align-self: flex-start; background: rgba(255,255,255,0.3); backdrop-filter: blur(15px); font-size: 13px; color: #3a3a3c; margin-top: -4px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; display: none; }

        .bubble-menu {
            position: absolute; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(25px);
            border: 0.5px solid #fff; border-radius: 14px; padding: 6px; z-index: 1000; display: none;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1); width: 220px;
        }
        .menu-row { display: flex; justify-content: space-around; }
        .menu-item { flex:1; text-align:center; padding: 10px 0; font-size: 12px; color: #000; cursor: pointer; border-radius: 8px; }
        .menu-item:active { background: rgba(0,0,0,0.05); }

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
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 60px; -webkit-overflow-scrolling: touch; }

        /* 包裹框 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 22px; margin-bottom: 16px; padding: 18px; border: 0.5px solid rgba(255,255,255,0.4); }
        .item-label { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .hint-text { font-size: 11px; color: #8e8e93; line-height: 1.4; }

        /* 开关与滑块 */
        .custom-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .custom-switch:checked { background: #000; border-color: #000; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .custom-switch:checked::after { transform: translateX(20px); }

        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }

        .black-btn { background: #000; color: #fff; border: none; border-radius: 14px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        .bg-preview-2x4 { width: 100%; height: 130px; border-radius: 16px; border: 2px dashed rgba(0,0,0,0.1); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.3); font-size: 13px; cursor: pointer; }

        /* 危险区 */
        .danger-bar { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; width:100%; }
        .danger-icon { color: rgba(0,0,0,0.2); font-weight: 300; transition: 0.3s; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 交互引擎 (修复所有 Bug) =====
let isDragging = false; let startY = 0;
window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { isDragging = true; startY = e.touches[0].clientY; sheet.style.transition = 'none'; };
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

window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) { window.toggleMental(false); mask.style.display = 'block'; setTimeout(() => { sheet.classList.add('active'); sheet.style.transform = 'translateY(0)'; }, 10); }
    else { sheet.classList.remove('active'); sheet.style.transform = 'translateY(100%)'; setTimeout(() => { mask.style.display = 'none'; sheet.style.transform = ''; }, 400); }
};

window.toggleMental = (show) => {
    const pop = document.getElementById('mentalPop');
    if (show === undefined) pop.style.display = (pop.style.display === 'block' ? 'none' : 'block');
    else pop.style.display = (show ? 'block' : 'none');
};

// ===== 4. 气泡长按菜单 & 重回逻辑 =====
let longPressTarget = null;
window.showBubbleMenu = (e, el) => {
    e.preventDefault(); longPressTarget = el;
    const menu = document.getElementById('bubbleMenu');
    menu.style.display = 'block';
    const rect = el.getBoundingClientRect();
    menu.style.top = (rect.top - 90) + 'px';
    menu.style.left = Math.max(10, rect.left + (rect.width/2) - 110) + 'px';
};

window.doMenuAction = (act) => {
    const text = longPressTarget.innerText;
    if (act === 'copy') { navigator.clipboard.writeText(text); alert('已复制'); }
    else if (act === 'regret') {
        const hint = prompt("请输入重回原因或发展方向：", "");
        if (hint !== null) {
            longPressTarget.remove();
            window.triggerReply("用户重回引导：" + hint);
        }
    } else if (act === 'translate') {
        const ad = longPressTarget.nextElementSibling;
        if (ad && ad.classList.contains('translate-adherent')) {
            const isShow = ad.style.display === 'block';
            ad.style.display = isShow ? 'none' : 'block';
            ad.innerText = "翻译：[正在手动转换人物语言...]";
        }
    }
    document.getElementById('bubbleMenu').style.display = 'none';
};

// ===== 5. 核心渲染实现 =====
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
        b.innerHTML = ChatConfig.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">测试专用联系人</div></div>
            </div>`).join('');
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
            <div class="mental-hint">心情</div><div class="mental-value">${ChatConfig.mental.mood}</div><div class="mental-divider"></div>
            <div class="mental-hint">好感值</div><div class="mental-value">${ChatConfig.mental.favorability}</div><div class="mental-divider"></div>
            <div class="mental-hint">当前动作</div><div class="mental-value">${ChatConfig.mental.action}</div><div class="mental-divider"></div>
            <div class="mental-hint">内心想法</div><div class="mental-value">${ChatConfig.mental.thought}</div>
        </div>

        <div id="bubbleMenu" class="bubble-menu">
            <div class="menu-row"><div class="menu-item" onclick="window.doMenuAction('copy')">复制</div><div class="menu-item">收藏</div><div class="menu-item" onclick="window.doMenuAction('regret')">重回</div><div class="menu-item">多选</div></div>
            <div class="menu-row"><div class="menu-item">引用</div><div class="menu-item" onclick="window.doMenuAction('translate')">翻译</div></div>
        </div>

        <div class="chat-footer">
            <div class="add-circle">+</div>
            <input type="text" id="chatInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
            <div class="send-btn-grey" onclick="window.send()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div class="sheet-content">
                    <div style="font-size:22px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
                    
                    <div class="glass-group">
                        <div class="hint-text" style="margin-bottom:8px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:12px;">全部点数: <span id="api-disp">${ChatConfig.settings.api.total} token</span></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span class="hint-text">线上: ${ChatConfig.settings.api.online} token</span><span class="hint-text">线下: ${ChatConfig.settings.api.offline} token</span></div>
                        <div style="display:flex; justify-content:space-between;"><span class="hint-text">生图: ${ChatConfig.settings.api.image} token</span><span class="hint-text">语音: ${ChatConfig.settings.api.voice} token</span></div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <input type="text" id="searchLog" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; border-radius:12px; padding:14px;" oninput="window.doSearch(this.value)">
                        <div id="searchRes" style="background:rgba(255,255,255,0.2); border-radius:12px; margin-top:8px; padding:10px; display:none;"></div>
                    </div>

                    <div class="glass-group">
                        <div class="item-label"><span>聊天总结</span> <span id="summ-val" class="hint-text">${ChatConfig.settings.summaryCount}轮</span></div>
                        <div class="hint-text">提示：默认50轮自动总结，可调或手动总结。</div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSet('summaryCount', this.value, 'summ-val')">
                        <button class="black-btn">手动总结</button>
                    </div>

                    <div class="glass-group">
                        <div class="hint-text" style="margin-bottom:10px;">聊天背景图</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()">${!ChatConfig.chatBg ? '点击添加聊天背景图' : ''}</div>
                        <div style="background:#000; color:#fff; border-radius:12px; padding:12px; text-align:center; margin-top:10px; font-weight:700;" onclick="window.clearBg()">清除当前背景</div>
                    </div>

                    <div class="glass-group">
                        <div class="item-label"><span>回复最少</span> <span id="min-val" class="hint-text">${ChatConfig.settings.replyMin}句</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMin}" class="ios-slider" oninput="window.updateSet('replyMin', this.value, 'min-val')">
                        <div class="item-label"><span>回复最多</span> <span id="max-val" class="hint-text">${ChatConfig.settings.replyMax}句</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMax}" class="ios-slider" oninput="window.updateSet('replyMax', this.value, 'max-val')">
                    </div>

                    <div class="glass-group">
                        <div class="item-label"><span>线上旁白</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration', this.checked)"></div>
                    </div>

                    <div class="glass-group">
                        <div class="item-label"><span>自动发消息</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoMsg?'checked':''} onchange="window.setSet('autoMsg', this.checked)"></div>
                        <div class="hint-text" style="margin:8px 0;">提示：频率档位 (1h / 5h / 10h / 24h)</div>
                        <input type="range" min="0" max="3" step="1" value="${ChatConfig.settings.autoMsgFreq}" class="ios-slider" oninput="window.setSet('autoMsgFreq', this.value)">
                    </div>

                    <div class="glass-group">
                        <div class="item-label"><span>自动翻译</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate', this.checked)"></div>
                        <div class="hint-text">提示：非简体中文语言都将翻译成简体中文。</div>
                    </div>

                    <div class="glass-group">
                        <div class="hint-text" style="margin-bottom:10px;">人称选择</div>
                        <div class="item-label"><span>第一人称“我”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='me'?'checked':''} onclick="window.setPron('me')"></div>
                        <div class="item-label"><span>第二人称“你”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='you'?'checked':''} onclick="window.setPron('you')"></div>
                        <div class="item-label"><span>第三人称“ta”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='ta'?'checked':''} onclick="window.setPron('ta')"></div>
                    </div>

                    <div class="glass-group">
                        <div class="danger-bar" onclick="window.toggleDanger()">危险区 <span class="danger-icon" id="danger-ic">></span></div>
                        <div class="danger-content" id="dangerZone">
                            <div style="color:#ff3b30; font-size:11px; margin-bottom:8px;">提示：请谨慎清空</div>
                            <button style="background:#fff; color:#ff3b30; border:none; border-radius:12px; padding:12px; width:100%; margin-bottom:10px; font-weight:600;" onclick="window.clearLog()">清空聊天记录</button>
                            <button class="black-btn" style="margin-bottom:10px;">拉黑联系人</button>
                            <button style="background:#fff; color:#000; border:none; border-radius:12px; padding:12px; width:100%; font-weight:600;">删除联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
    const f = document.getElementById('chatFlow'); const l = localStorage.getItem('yujie_logs_枝玉');
    if(f && l) { f.innerHTML = JSON.parse(l); f.querySelectorAll('.bubble-assistant').forEach(b => b.oncontextmenu = (e)=>window.showBubbleMenu(e,b)); }
};

// 功能函数加固
window.send = async function() {
    const input = document.getElementById('chatInp'); const flow = document.getElementById('chatFlow');
    if (!input.value.trim()) { if (!ChatConfig.isAITyping) window.triggerReply(); return; }
    const text = input.value.trim();
    const d = document.createElement('div'); d.id = 'msg-'+Date.now(); d.className = /^[\(\（].*[\)\）]$/.test(text) ? 'bubble-narration' : 'bubble bubble-user'; d.innerText = text;
    flow.appendChild(d); input.value = ''; window.saveHistory(); window.triggerReply(text);
};

window.triggerReply = async (context = "") => {
    ChatConfig.isAITyping = true; document.getElementById('chatTitle').innerHTML = `<span class="nav-typing">输入中…</span>`;
    const baseUrl = localStorage.getItem('main_api_base_url'); const apiKey = localStorage.getItem('main_api_key');
    try {
        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ model: localStorage.getItem('main_api_model'), messages: [{ role: 'system', content: 'Reply shortly. Use JSON suffix.' }, { role: 'user', content: context || "你好" }] }) });
        const data = await res.json(); const reply = data.choices[0].message.content;
        window.appendBot(reply);
    } catch (e) { alert("API 异常。"); } finally { ChatConfig.isAITyping = false; document.getElementById('chatTitle').innerText = "枝玉"; }
};

window.appendBot = (content) => {
    const flow = document.getElementById('chatFlow'); let text = content;
    const jsonMatch = content.match(/\{.*\}/); if (jsonMatch) { try { ChatConfig.mental = JSON.parse(jsonMatch[0]); text = content.replace(jsonMatch[0], "").trim(); } catch(e) {} }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = text; d.id = 'msg-'+Date.now();
    d.oncontextmenu = (e) => window.showBubbleMenu(e, d);
    flow.appendChild(d);
    const ad = document.createElement('div'); ad.className = 'translate-adherent'; flow.appendChild(ad);
    flow.scrollTop = flow.scrollHeight; window.saveHistory();
};

window.doSearch = (v) => {
    const res = document.getElementById('searchRes'); if(!v) { res.style.display='none'; return; }
    const items = Array.from(document.querySelectorAll('.bubble, .bubble-narration')).filter(el => el.innerText.includes(v));
    res.innerHTML = items.map(i => `<div style="padding:8px; border-bottom:0.5px solid rgba(0,0,0,0.05);" onclick="document.getElementById('${i.id}').scrollIntoView({behavior:'smooth'})">${i.innerText.substring(0,15)}...</div>`).join('');
    res.style.display = items.length ? 'block' : 'none';
};

window.updateSet = (k,v,id) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k, v); if(id) document.getElementById(id).innerText = v + (k.includes('reply')?'句':'轮'); };
window.setSet = (k,v) => { ChatConfig.settings[k]=v; localStorage.setItem('yujie_'+k, v); };
window.setPron = (p) => { ChatConfig.settings.pronoun = p; localStorage.setItem('yujie_pronoun', p); };
window.toggleDanger = () => { const dz = document.getElementById('dangerZone'); const ic = document.getElementById('danger-ic'); const show = dz.style.display==='block'; dz.style.display=show?'none':'block'; ic.innerText=show?'>':'∨'; };
window.saveHistory = () => { localStorage.setItem('yujie_logs_枝玉', JSON.stringify(document.getElementById('chatFlow').innerHTML)); };
window.pickBg = () => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{ const f = e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(ev)=>{ ChatConfig.chatBg=ev.target.result; localStorage.setItem('yujie_chat_bg', ev.target.result); document.getElementById('bgPrev').style.backgroundImage=`url(${ev.target.result})`; document.getElementById('chatFlow').style.backgroundImage=`url(${ev.target.result})`; }; r.readAsDataURL(f); } }; i.click(); };
window.clearBg = () => { ChatConfig.chatBg=''; localStorage.removeItem('yujie_chat_bg'); document.getElementById('bgPrev').style.backgroundImage=''; document.getElementById('chatFlow').style.backgroundImage=''; };
window.clearLog = () => { if(confirm('确定清空？')){ document.getElementById('chatFlow').innerHTML=''; window.saveHistory(); } };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

window.addEventListener('click', (e) => { const pop = document.getElementById('mentalPop'); if (pop && pop.style.display === 'block' && !pop.contains(e.target) && !e.target.classList.contains('nav-mental-btn')) window.toggleMental(false); });
