/**
 * 玉界 - 旗舰级全功能交互系统 (AI 交互增强版)
 * 包含：智能回复逻辑、旁白引导识别、输入状态反馈、数据永存
 */

// ===== 1. 核心状态与持久化 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    userName: "用户",
    isAITyping: false, // 角色是否正在输入
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

window.ChatLogs = {
    save: (name, logs) => localStorage.setItem('yujie_logs_' + name, JSON.stringify(logs)),
    load: (name) => JSON.parse(localStorage.getItem('yujie_logs_' + name) || '[]')
};

// ===== 2. 旗舰级样式注入 =====
const injectFlagshipStyle = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }
        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        .chat-nav {
            flex-shrink: 0; height: 70px; display: flex; flex-direction: column;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100;
        }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color: #000; }
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; color: #000; text-align: center; }
        .nav-typing { font-size: 13px; color: #555; font-weight: 400; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 20px; cursor: pointer; color: #000; }

        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 220px;
            background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 20px; padding: 16px;
            z-index: 550; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 13px; text-align: center; margin: 12px 0; max-width: 85%; }

        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px);
            border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650; display: flex; flex-direction: column;
        }
        .half-sheet.dragging { transition: none !important; }
        .sheet-handle { width: 100%; height: 40px; flex-shrink: 0; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }

        .glass-group { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .ios-switch { appearance: none; width: 50px; height: 30px; background: rgba(0,0,0,0.05); border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; }
        .ios-switch:checked { background: #34c759; }
        .ios-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .ios-switch:checked::after { transform: translateX(20px); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 接管与手势逻辑 =====
let dragY = 0;
let isDragging = false;
window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { dragY = e.touches[0].clientY; isDragging = true; sheet.classList.add('dragging'); };
    handle.onclick = () => window.toggleSheet(false);
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        let delta = e.touches[0].clientY - dragY;
        if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    }, { passive: false });
    window.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;
        sheet.classList.remove('dragging');
        let delta = event.changedTouches[0].clientY - dragY;
        if (delta > 120) window.toggleSheet(false);
        else sheet.style.transform = `translateY(0)`;
    });
};

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
};

// ===== 4. 核心功能实现 =====
window.handleAction = function() {
    const input = document.getElementById('chatInp');
    const text = input.value.trim();

    if (text === "") {
        // 输入框无内容：强制角色回复
        if (!ChatConfig.isAITyping) window.triggerAIReply();
    } else {
        // 输入框有内容：发送消息
        window.sendUserMsg(text);
        input.value = "";
    }
};

window.sendUserMsg = (text) => {
    const flow = document.getElementById('chatFlow');
    // 旁白识别逻辑 (中英文括号)
    const isNarration = /^[\(\（].*[\)\）]$/.test(text);
    
    const div = document.createElement('div');
    div.className = isNarration ? 'bubble bubble-narration' : 'bubble bubble-user';
    div.innerText = text;
    flow.appendChild(div);
    flow.scrollTop = flow.scrollHeight;
    
    window.saveHistory();
    // 发送后自动尝试回复
    window.triggerAIReply(text);
};

window.triggerAIReply = async (userContext = "") => {
    if (ChatConfig.isAITyping) return;
    
    ChatConfig.isAITyping = true;
    window.updateHeaderStatus(true);

    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if (!baseUrl || !apiKey) {
        alert("API 未配置或余额不足。请在系统设置中检查 API Key。");
        ChatConfig.isAITyping = false;
        window.updateHeaderStatus(false);
        return;
    }

    try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: `你是角色。严禁超过20字。严禁Emoji。结尾附带JSON状态。` },
                    { role: 'user', content: userContext || "请回复我。" }
                ]
            })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);

        const reply = data.choices[0].message.content;
        window.appendBotBubble(reply);
        
        // 成功回复后增加点数
        ChatConfig.settings.apiTotal += 10;
        localStorage.setItem('api_total', ChatConfig.settings.apiTotal);
        if(document.getElementById('api-disp')) document.getElementById('api-disp').innerText = ChatConfig.settings.apiTotal;

    } catch (e) {
        alert("API 调用失败: " + e.message);
    } finally {
        ChatConfig.isAITyping = false;
        window.updateHeaderStatus(false);
    }
};

window.appendBotBubble = (content) => {
    const flow = document.getElementById('chatFlow');
    let text = content;
    
    // 解析 JSON 状态并更新心理窗口
    const jsonMatch = content.match(/\{.*\}/);
    if (jsonMatch) {
        try {
            const status = JSON.parse(jsonMatch[0]);
            ChatConfig.mental = status;
            text = content.replace(jsonMatch[0], "").trim();
        } catch(e) {}
    }

    const div = document.createElement('div');
    div.className = 'bubble bubble-assistant';
    div.innerText = text;
    flow.appendChild(div);
    flow.scrollTop = flow.scrollHeight;
    window.saveHistory();
};

window.updateHeaderStatus = (isTyping) => {
    const title = document.getElementById('chatTitle');
    const name = "枝玉"; // 默认测试联系人
    if (isTyping) {
        title.innerHTML = `<div class="nav-typing">输入中…</div>`;
    } else {
        title.innerHTML = name;
    }
};

// ===== 5. 页面渲染与联系人 (禁止删除枝玉) =====
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
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05);">
                <div onclick="window.navTo('chats')" style="font-weight:700; cursor:pointer;">聊天</div>
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
        body.innerHTML = ChatConfig.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">测试专用联系人</div></div>
            </div>`).join('');
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

        <div style="height:60px; display:flex; align-items:center; padding:0 16px 20px; background:rgba(255,255,255,0.4); backdrop-filter:blur(30px); border-top:0.5px solid rgba(0,0,0,0.05); gap:12px;">
            <div style="width:28px; height:28px; border:1px solid #8e8e93; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#8e8e93; cursor:pointer;">+</div>
            <input type="text" id="chatInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.handleAction()">
            <div style="font-size:26px; cursor:pointer;" onclick="window.handleAction()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div style="flex:1; overflow-y:auto; padding:0 24px 50px;">
                    <div style="font-size:20px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:8px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700;">总点数: <span id="api-disp">${ChatConfig.settings.apiTotal}</span></div>
                    </div>
                    <button class="black-btn" onclick="window.toggleSheet(false)">返回聊天</button>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
    const f = document.getElementById('chatFlow');
    const l = localStorage.getItem('yujie_logs_' + name);
    if(f && l) { f.innerHTML = JSON.parse(l); f.scrollTop = f.scrollHeight; }
};

window.saveHistory = () => {
    const f = document.getElementById('chatFlow');
    if(f) localStorage.setItem('yujie_logs_枝玉', JSON.stringify(f.innerHTML));
};

window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

console.log("玉界：旗舰交互系统已就绪。");p
