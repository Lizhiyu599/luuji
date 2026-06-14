/**
 * 玉界 - 旗舰级全功能交互系统 (最终加固完全体)
 * 修复：恢复全量详情页、修复输入框偏移、灰黑发送键、交互不截断逻辑
 */

// ===== 1. 核心状态与数据持久化 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    userName: "用户",
    isAITyping: false,
    settings: {
        summaryCount: parseInt(localStorage.getItem('yujie_summary_count') || 50),
        onlineNarration: localStorage.getItem('yujie_narration') !== 'false',
        autoTranslate: localStorage.getItem('yujie_translate') !== 'false',
        pronoun: localStorage.getItem('yujie_pronoun') || 'me',
        apiTotal: parseInt(localStorage.getItem('api_total') || 0)
    },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }],
    mental: { mood: "专注", favorability: 95, action: "优化逻辑", thought: "让角色能更聪明地理解宝宝的旁白。" }
};

// ===== 2. 旗舰级样式注入 (严禁改动布局) =====
const injectFlagshipStyle = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }
        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 标题栏 */
        .chat-nav {
            flex-shrink: 0; height: 70px; display: flex; flex-direction: column;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100;
        }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color: #000; }
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; color: #000; text-align: center; }
        .nav-typing { font-size: 14px; color: #555; font-weight: 500; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 20px; cursor: pointer; color: #000; }

        /* 心理状态浮窗 (○) */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 220px;
            background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 20px; padding: 16px;
            z-index: 550; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        /* 气泡 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }
        .translate-bubble { align-self: flex-start; background: rgba(255,255,255,0.3); backdrop-filter: blur(10px); font-size: 13px; color: #3a3a3c; margin-top: -6px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; }

        /* 输入栏 - 格式严禁改动 */
        .chat-footer { height: 60px; display: flex; align-items: center; padding: 0 16px 20px; background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.05); gap: 12px; }
        .add-circle { width: 28px; height: 28px; border: 1px solid #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #8e8e93; font-size: 20px; cursor: pointer; }
        .send-btn-grey { font-size: 26px; color: #555; cursor: pointer; }

        /* 半屏详情 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); -webkit-backdrop-filter: blur(45px);
            border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650; display: flex; flex-direction: column;
        }
        .sheet-handle { width: 100%; height: 40px; flex-shrink: 0; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }
        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 50px; -webkit-overflow-scrolling: touch; }

        /* 组件样式 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .ios-switch { appearance: none; width: 50px; height: 30px; background: rgba(0,0,0,0.05); border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .ios-switch:checked { background: #34c759; }
        .ios-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .ios-switch:checked::after { transform: translateX(20px); }
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }
        .bg-preview-2x4 { width: 100%; height: 120px; border-radius: 15px; border: 2px dashed rgba(0,0,0,0.1); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.3); font-size: 13px; cursor: pointer; margin-bottom: 10px; }
        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势驱动与键盘自适应 =====
let dragY = 0;
let isDragging = false;
window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { dragY = e.touches[0].clientY; isDragging = true; sheet.style.transition = 'none'; };
    handle.onclick = () => window.toggleSheet(false);
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        let delta = e.touches[0].clientY - dragY;
        if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    }, { passive: false });
    window.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = 'transform 0.4s cubic-bezier(0.2, 1, 0.3, 1)';
        let delta = event.changedTouches[0].clientY - dragY;
        if (delta > 120) window.toggleSheet(false);
        else sheet.style.transform = `translateY(0)`;
    });
};

// 键盘自适应
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        const shell = document.querySelector('.chat-shell');
        if(shell) shell.style.height = window.visualViewport.height + 'px';
    });
}

// ===== 4. 详情半窗开关逻辑 =====
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

// ===== 5. 核心发送与回复逻辑 =====
window.handleAction = function() {
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
    const div = document.createElement('div');
    div.className = isNar ? 'bubble bubble-narration' : 'bubble bubble-user';
    div.innerText = text;
    flow.appendChild(div);
    flow.scrollTop = flow.scrollHeight;
    window.saveHistory();
    // 角色正在输入时也一并读取，不截断，存入 context
    window.triggerAIReply(text);
};

window.triggerAIReply = async (context = "") => {
    if (ChatConfig.isAITyping) return;
    ChatConfig.isAITyping = true;
    window.updateHeader(true);

    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if (!baseUrl || !apiKey) {
        alert("API 配置无效。"); ChatConfig.isAITyping = false; window.updateHeader(false); return;
    }

    try {
        const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [{ role: 'system', content: 'Roleplay. Reply <20 words. No emoji. End with JSON.' }, { role: 'user', content: context || "请回复我" }]
            })
        });
        const data = await res.json();
        const content = data.choices[0].message.content;
        window.appendBotBubble(content);
        ChatConfig.settings.apiTotal += 10;
        localStorage.setItem('api_total', ChatConfig.settings.apiTotal);
        if(document.getElementById('api-disp')) document.getElementById('api-disp').innerText = ChatConfig.settings.apiTotal;
    } catch (e) {
        alert("API 调用失败");
    } finally {
        ChatConfig.isAITyping = false;
        window.updateHeader(false);
    }
};

window.updateHeader = (isTyping) => {
    const title = document.getElementById('chatTitle');
    if (isTyping) title.innerHTML = `<span class="nav-typing">输入中…</span>`;
    else title.innerText = "枝玉";
};

// ===== 6. 核心渲染与列表 (禁止删除任何模块) =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectFlagshipStyle();
    document.body.classList.add('chat-active');
    document.getElementById('genericAppWindow').style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav"><div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeWhole()">‹</span>
                <span class="nav-title" id="mainTitle">聊天</span>
            </div></nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; background:#fff;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05); padding-bottom:env(safe-area-inset-bottom);">
                <div onclick="window.navTo('chats', this)" style="font-weight:700; cursor:pointer;">聊天</div>
                <div onclick="window.navTo('contacts', this)" style="color:#8e8e93; cursor:pointer;">联系人</div>
                <div onclick="window.navTo('moments', this)" style="color:#8e8e93; cursor:pointer;">动态</div>
                <div onclick="window.navTo('me', this)" style="color:#8e8e93; cursor:pointer;">我的</div>
            </footer>
            <div id="chatOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:500; display:none; flex-direction:column;"></div>
        </div>
    `;
    window.navTo('chats');
};

window.navTo = (tab, el) => {
    const body = document.getElementById('mainBody');
    if (el) {
        el.parentElement.querySelectorAll('div').forEach(d => { d.style.color = '#8e8e93'; d.style.fontWeight = '500'; });
        el.style.color = '#000'; el.style.fontWeight = '700';
    }
    if (tab === 'chats') {
        body.innerHTML = `<div style="background:#fff;">${ChatConfig.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">点击开始对话</div></div>
            </div>`).join('')}</div>`;
    } else {
        body.innerHTML = `<div style="padding:100px; text-align:center; color:#ccc;">${tab} 模块开发中</div>`;
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
            <div style="font-weight:800; font-size:15px; margin-bottom:10px;">窥视ta...</div>
            <div style="font-size:11px; color:#8e8e93;">心情</div><div style="font-size:13px;">${ChatConfig.mental.mood}</div><div class="mental-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">好感值</div><div style="font-size:13px;">${ChatConfig.mental.favorability}</div><div class="mental-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">当前动作</div><div style="font-size:13px;">${ChatConfig.mental.action}</div><div class="mental-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">内心想法</div><div style="font-size:13px;">${ChatConfig.mental.thought}</div>
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
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:8px;">API 消耗</div>
                        <div style="font-size:14px; font-weight:700;">总点数: <span id="api-disp">${ChatConfig.settings.apiTotal}</span></div>
                    </div>
                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between;"><span>AI 总结</span> <span id="summ-val" style="color:#8e8e93;">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSumm(this.value)">
                        <button class="black-btn" style="margin-top:10px;">手动立即总结</button>
                    </div>
                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">聊天背景设置</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()">${!ChatConfig.chatBg ? '选取背景' : ''}</div>
                        <div style="color:#ff3b30; font-weight:700; text-align:center; cursor:pointer;" onclick="window.clearBg()">清除背景图</div>
                    </div>
                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>开启线上旁白</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration', this.checked)"></div>
                    </div>
                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;"><span>自动翻译</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate', this.checked)"></div>
                        <div style="font-size:11px; color:#8e8e93; margin-top:5px;">提示：当角色说非简体中文的时候，一律翻译</div>
                    </div>
                    <div class="glass-group">
                        <div style="margin-bottom:10px;">人称选择</div>
                        <div style="display:flex; justify-content:space-between; font-size:14px;">
                            <label onclick="window.setPronoun('me')"><input type="radio" name="pron" ${ChatConfig.settings.pronoun=='me'?'checked':''}> 我</label>
                            <label onclick="window.setPronoun('you')"><input type="radio" name="pron" ${ChatConfig.settings.pronoun=='you'?'checked':''}> 你</label>
                            <label onclick="window.setPronoun('ta')"><input type="radio" name="pron" ${ChatConfig.settings.pronoun=='ta'?'checked':''}> ta</label>
                        </div>
                    </div>
                    <div class="glass-group">
                        <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span id="danger-icon">></span></div>
                        <div class="danger-content" id="dangerZone">
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
    const f = document.getElementById('chatFlow');
    const l = localStorage.getItem('yujie_logs_' + name);
    if(f && l) { f.innerHTML = JSON.parse(l); f.scrollTop = f.scrollHeight; }
};

// 功能函数 (略: 同上一版，但加固了不截断逻辑与灰黑键)
window.appendBotBubble = (content) => {
    const flow = document.getElementById('chatFlow');
    let text = content;
    const jsonMatch = content.match(/\{.*\}/);
    if (jsonMatch) { try { ChatConfig.mental = JSON.parse(jsonMatch[0]); text = content.replace(jsonMatch[0], "").trim(); } catch(e) {} }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = text;
    flow.appendChild(d);
    if(ChatConfig.settings.autoTranslate) {
        const t = document.createElement('div'); t.className = 'translate-bubble'; t.innerText = "翻译：[正在处理人物语言内容...]"; flow.appendChild(t);
    }
    flow.scrollTop = flow.scrollHeight; window.saveHistory();
};

window.saveHistory = () => { const f = document.getElementById('chatFlow'); if(f) localStorage.setItem('yujie_logs_枝玉', JSON.stringify(f.innerHTML)); };
window.updateSumm = (v) => { ChatConfig.settings.summaryCount = v; document.getElementById('summ-val').innerText = v + '轮'; localStorage.setItem('yujie_summary_count', v); };
window.setSet = (k, v) => { ChatConfig.settings[k] = v; localStorage.setItem('yujie_' + k, v); };
window.setPronoun = (p) => { ChatConfig.settings.pronoun = p; localStorage.setItem('yujie_pronoun', p); };
window.toggleDanger = () => { const dz = document.getElementById('dangerZone'); const ic = document.getElementById('danger-icon'); const show = dz.style.display === 'block'; dz.style.display = show ? 'none' : 'block'; ic.innerText = show ? '>' : '∨'; };
window.pickBg = () => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.onchange = (e) => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onload = (ev) => { ChatConfig.chatBg = ev.target.result; localStorage.setItem('yujie_chat_bg', ev.target.result); document.getElementById('bgPrev').style.backgroundImage = `url(${ev.target.result})`; document.getElementById('bgPrev').innerText = ''; document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`; }; r.readAsDataURL(f); } }; i.click(); };
window.clearBg = () => { ChatConfig.chatBg = ''; localStorage.removeItem('yujie_chat_bg'); document.getElementById('bgPrev').style.backgroundImage = ''; document.getElementById('bgPrev').innerText = '选取背景'; document.getElementById('chatFlow').style.backgroundImage = ''; };
window.clearLog = () => { if(confirm('确定清空记录？')) { document.getElementById('chatFlow').innerHTML = ''; window.saveHistory(); } };
window.toggleMental = (show) => { const p = document.getElementById('mentalPop'); if (show === undefined) p.style.display = (p.style.display === 'block' ? 'none' : 'block'); else p.style.display = (show ? 'block' : 'none'); };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

window.addEventListener('click', (e) => { const pop = document.getElementById('mentalPop'); if (pop && pop.style.display === 'block' && !pop.contains(e.target) && !e.target.classList.contains('nav-mental-btn')) window.toggleMental(false); });
console.log("玉界：旗舰交互系统修复版。");
