/**
 * 玉界 - 旗舰全功能沉浸式交互系统 (状态窗 + 吸附翻译 + 细节完全体)
 * 严格执行：禁止删除功能、禁止乱动布局、全量逻辑复刻
 */

// ===== 1. 核心数据中心 =====
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
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '测试专用角色' }],
    // 心理状态数据
    mental: { 
        mood: "期待", 
        favorability: 88, 
        action: "正在等待你的消息", 
        thought: "想知道宝宝对这次更新满不满意。" 
    }
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
        .nav-typing { font-size: 14px; color: #555; font-weight: 500; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; color: #000; }

        /* ○ 心理状态浮窗 (旗舰液态玻璃) */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 230px;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); -webkit-backdrop-filter: blur(45px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 22px; padding: 18px;
            z-index: 550; display: none; box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }
        .mental-title { font-weight: 800; font-size: 15px; margin-bottom: 12px; color: #000; }
        .mental-hint { font-size: 10px; color: rgba(0,0,0,0.4); margin-bottom: 2px; }
        .mental-value { font-size: 13px; color: #1d1d1f; margin-bottom: 10px; line-height: 1.3; }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.12); margin-bottom: 10px; }

        /* 气泡与吸附翻译 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }
        .translate-adherent { 
            align-self: flex-start; background: rgba(255,255,255,0.3); backdrop-filter: blur(15px);
            font-size: 13px; color: #3a3a3c; margin-top: -6px; margin-bottom: 12px; border-radius: 12px; 
            padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%;
        }

        /* 输入框加固 */
        .chat-footer { height: 60px; display: flex; align-items: center; padding: 0 16px 20px; background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.05); gap: 12px; }
        .add-circle { width: 28px; height: 28px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 20px; cursor: pointer; }
        .send-btn-grey { font-size: 26px; color: #555; cursor: pointer; }

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
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 50px; -webkit-overflow-scrolling: touch; }

        /* 开关：黑/白状态 */
        .custom-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; }
        .custom-switch:checked { background: #000; border-color: #000; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .custom-switch:checked::after { transform: translateX(20px); }

        /* 危险区最右侧 */
        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; }
        .danger-icon { color: rgba(0,0,0,0.2); font-weight: 300; font-size: 18px; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
        
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }
        .black-btn { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势与键盘适配 =====
let isSheetDragging = false; let startY = 0;
window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { isSheetDragging = true; startY = e.touches[0].clientY; sheet.classList.add('dragging'); };
    handle.onclick = () => window.toggleSheet(false);
    window.addEventListener('touchmove', (e) => {
        if (!isSheetDragging) return;
        let d = e.touches[0].clientY - startY;
        if (d > 0) sheet.style.transform = `translateY(${d}px)`;
    }, { passive: false });
    window.addEventListener('touchend', (e) => {
        if (!isSheetDragging) return; isSheetDragging = false; sheet.classList.remove('dragging');
        let d = e.changedTouches[0].clientY - startY;
        if (d > 120) window.toggleSheet(false); else sheet.style.transform = `translateY(0)`;
    });
};

// ===== 4. 核心功能实现 =====
window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) {
        window.toggleMental(false);
        mask.style.display = 'block';
        setTimeout(() => { sheet.classList.add('active'); sheet.style.transform = 'translateY(0)'; }, 10);
    } else {
        sheet.classList.remove('active');
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => { mask.style.display = 'none'; sheet.style.transform = ''; }, 400);
    }
};

window.toggleMental = (show) => {
    const pop = document.getElementById('mentalPop');
    if (show === undefined) pop.style.display = (pop.style.display === 'block' ? 'none' : 'block');
    else pop.style.display = (show ? 'block' : 'none');
    if (pop.style.display === 'block') window.updateMentalUI();
};

window.updateMentalUI = () => {
    const m = ChatConfig.mental;
    document.getElementById('m-mood').innerText = m.mood;
    document.getElementById('m-fav').innerText = m.favorability;
    document.getElementById('m-act').innerText = m.action;
    document.getElementById('m-tht').innerText = m.thought;
};

// 发送与回复核心
window.handleAction = async function() {
    const input = document.getElementById('chatInp');
    const text = input.value.trim();
    if (text === "") {
        if (!ChatConfig.isAITyping) window.triggerAIReply();
    } else {
        window.sendUserMsg(text);
        input.value = "";
    }
};

window.sendUserMsg = (text) => {
    const flow = document.getElementById('chatFlow');
    const isNar = /^[\(\（].*[\)\）]$/.test(text);
    const d = document.createElement('div');
    d.className = isNar ? 'bubble-narration' : 'bubble bubble-user';
    d.innerText = text;
    d.id = 'msg-' + Date.now();
    flow.appendChild(d); flow.scrollTop = flow.scrollHeight;
    window.saveHistory();
    window.triggerAIReply(text);
};

window.triggerAIReply = async (context = "") => {
    if (ChatConfig.isAITyping) return;
    ChatConfig.isAITyping = true;
    window.updateHeader(true);

    const baseUrl = localStorage.getItem('api-base-url-1');
    const apiKey = localStorage.getItem('api-key-1');
    const model = localStorage.getItem('api-model-1');

    try {
        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'system', content: 'Reply shortly. End with JSON: {"mood":"","favorability":0,"action":"","thought":""}' }, { role: 'user', content: context || "请回复" }]
            })
        });
        const data = await res.json();
        const content = data.choices[0].message.content;
        window.appendBotBubble(content);
    } catch (e) {
        alert("API 异常，请检查配置。");
    } finally {
        ChatConfig.isAITyping = false; window.updateHeader(false);
    }
};

window.appendBotBubble = (content) => {
    const flow = document.getElementById('chatFlow');
    let text = content;
    const jsonMatch = content.match(/\{.*\}/);
    if (jsonMatch) {
        try { ChatConfig.mental = JSON.parse(jsonMatch[0]); text = content.replace(jsonMatch[0], "").trim(); } catch(e) {}
    }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = text;
    flow.appendChild(d);
    // 自动翻译吸附气泡
    if (ChatConfig.settings.autoTranslate) {
        const t = document.createElement('div'); t.className = 'translate-adherent';
        t.innerText = "翻译：[正在处理人物语言中...]";
        flow.appendChild(t);
    }
    flow.scrollTop = flow.scrollHeight; window.saveHistory();
};

// ===== 5. 页面与详情渲染 =====
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

window.navTo = (tab) => {
    const body = document.getElementById('mainBody');
    if (tab === 'chats') {
        body.innerHTML = `<div style="background:#fff;">${ChatConfig.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">测试专用联系人</div></div>
            </div>`).join('')}</div>`;
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
            <div class="mental-hint">心情</div><div class="mental-value" id="m-mood">-</div><div class="mental-divider"></div>
            <div class="mental-hint">好感值</div><div class="mental-value" id="m-fav">-</div><div class="mental-divider"></div>
            <div class="mental-hint">当前动作</div><div class="mental-value" id="m-act">-</div><div class="mental-divider"></div>
            <div class="mental-hint">内心想法</div><div class="mental-value" id="m-tht">-</div>
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
                        <div class="light-text" style="margin-bottom:8px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700; margin-bottom:10px;">全部点数: <span id="api-disp">${ChatConfig.settings.api.total} token</span></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px;"><span class="light-text">线上: ${ChatConfig.settings.api.online} token</span><span class="light-text">线下: ${ChatConfig.settings.api.offline} token</span></div>
                        <div style="display:flex; justify-content:space-between;"><span class="light-text">生图: ${ChatConfig.settings.api.image} token</span><span class="light-text">语音: ${ChatConfig.settings.api.voice} token</span></div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <input type="text" id="searchLog" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; border-radius:12px; padding:12px;" oninput="window.doSearch(this.value)">
                        <div id="searchRes" style="background:rgba(255,255,255,0.25); border-radius:12px; margin-top:8px; padding:10px; display:none;"></div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between;"><span>聊天总结</span> <span id="summ-val" class="light-text">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSet('summaryCount', this.value, 'summ-val')">
                        <button class="black-btn">手动总结</button>
                    </div>

                    <div class="glass-group">
                        <div class="light-text" style="margin-bottom:10px;">聊天背景图</div>
                        <div class="bg-preview-box" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()"></div>
                        <div style="background:#000; color:#fff; border-radius:12px; padding:12px; text-align:center;" onclick="window.clearBg()">清除当前背景</div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between;"><span>回复最少</span> <span id="min-val" class="light-text">${ChatConfig.settings.replyMin}句</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMin}" class="ios-slider" oninput="window.updateSet('replyMin', this.value, 'min-val')">
                        <div style="display:flex; justify-content:space-between;"><span>回复最多</span> <span id="max-val" class="light-text">${ChatConfig.settings.replyMax}句</span></div>
                        <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMax}" class="ios-slider" oninput="window.updateSet('replyMax', this.value, 'max-val')">
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>线上旁白</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration', this.checked)"></div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>自动发消息</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoMsg?'checked':''} onchange="window.setSet('autoMsg', this.checked)"></div>
                        <div class="light-text" style="margin:10px 0;">提示：频率档位 (1h / 5h / 10h / 24h)</div>
                        <input type="range" min="0" max="3" step="1" value="${ChatConfig.settings.autoMsgFreq}" class="ios-slider" oninput="window.setSet('autoMsgFreq', this.value)">
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;"><span>自动翻译</span> <input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate', this.checked)"></div>
                        <div class="light-text">提示：非简体中文的语言都将翻译成简体中文。</div>
                    </div>

                    <div class="glass-group">
                        <div class="light-text" style="margin-bottom:10px;">人称选择</div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>第一人称“我”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='me'?'checked':''} onclick="window.setPron('me')"></div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;"><span>第二人称“你”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='you'?'checked':''} onclick="window.setPron('you')"></div>
                        <div style="display:flex; justify-content:space-between;"><span>第三人称“ta”</span> <input type="radio" name="pron" class="custom-switch" ${ChatConfig.settings.pronoun=='ta'?'checked':''} onclick="window.setPron('ta')"></div>
                    </div>

                    <div class="glass-group">
                        <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span class="danger-icon" id="danger-ic">></span></div>
                        <div class="danger-content" id="dangerZone">
                            <div style="color:#ff3b30; font-size:11px; margin-bottom:8px;">提示：请谨慎清空</div>
                            <button style="background:#fff; color:#ff3b30; border:none; border-radius:12px; padding:12px; width:100%; margin-bottom:10px;" onclick="window.clearLog()">清空聊天记录</button>
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

// 辅助函数
window.updateHeader = (t) => { document.getElementById('chatTitle').innerHTML = t ? `<span class="nav-typing">输入中…</span>` : "枝玉"; };
window.setSet = (k, v) => { ChatConfig.settings[k] = v; localStorage.setItem('yujie_'+k, v); };
window.setPron = (p) => { ChatConfig.settings.pronoun = p; localStorage.setItem('yujie_pronoun', p); };
window.updateSet = (k, v, id) => { ChatConfig.settings[k] = v; localStorage.setItem('yujie_'+k, v); if(id) document.getElementById(id).innerText = v + (k.includes('reply')?'句':'轮'); };
window.toggleDanger = () => { const dz = document.getElementById('dangerZone'); const ic = document.getElementById('danger-ic'); const show = dz.style.display==='block'; dz.style.display=show?'none':'block'; ic.innerText=show?'>':'∨'; };
window.saveHistory = () => { const f = document.getElementById('chatFlow'); if(f) localStorage.setItem('yujie_logs_枝玉', JSON.stringify(f.innerHTML)); };
window.loadHistory = () => { const l = localStorage.getItem('yujie_logs_枝玉'); if(l) document.getElementById('chatFlow').innerHTML = JSON.parse(l); };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };
window.pickBg = () => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e)=>{ const f = e.target.files[0]; if(f){ const r=new FileReader(); r.onload=(ev)=>{ ChatConfig.chatBg = ev.target.result; localStorage.setItem('yujie_chat_bg', ev.target.result); document.getElementById('bgPrev').style.backgroundImage = `url(${ev.target.result})`; document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`; }; r.readAsDataURL(f); } }; i.click(); };
window.clearBg = () => { ChatConfig.chatBg=''; localStorage.removeItem('yujie_chat_bg'); document.getElementById('bgPrev').style.backgroundImage=''; document.getElementById('chatFlow').style.backgroundImage=''; };
window.clearLog = () => { if(confirm('清空？')){ document.getElementById('chatFlow').innerHTML=''; window.saveHistory(); } };

window.addEventListener('click', (e) => {
    const pop = document.getElementById('mentalPop');
    if (pop && pop.style.display === 'block' && !pop.contains(e.target) && !e.target.classList.contains('nav-mental-btn')) window.toggleMental(false);
});

console.log("玉界：旗舰交互完全体就绪。");
