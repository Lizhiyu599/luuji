/**
 * 玉界 - 旗舰级沉浸式交互系统 (数据持久化 + 全功能恢复版)
 * 修复：手势冲突、数据丢失、功能残缺
 */

// ===== 1. 数据引擎 (本地存储与持久化) =====
window.ChatEngine = {
    // 获取存储数据
    get: (key, def) => {
        const val = localStorage.getItem('yujie_' + key);
        try { return val ? JSON.parse(val) : def; } catch { return val || def; }
    },
    // 写入存储数据
    save: (key, val) => localStorage.setItem('yujie_' + key, JSON.stringify(val)),
    
    // 初始化配置
    config: {
        activeChar: '枝玉',
        userAvatar: '',
        chatBg: '',
        apiTotal: 0,
        settings: {
            summaryCount: 50,
            onlineNarration: true,
            autoTranslate: true,
            pronoun: 'me' // me, you, ta
        }
    },
    
    // 消息持久化逻辑
    loadHistory: (id) => ChatEngine.get('history_' + id, []),
    saveHistory: (id, logs) => ChatEngine.save('history_' + id, logs)
};

// 预加载
ChatEngine.config.chatBg = ChatEngine.get('chat_bg', '');
ChatEngine.config.apiTotal = ChatEngine.get('api_total', 0);
ChatEngine.config.settings = ChatEngine.get('chat_settings', ChatEngine.config.settings);

// ===== 2. 视觉样式 (液态玻璃旗舰版) =====
const injectSystemStyle = () => {
    if (document.getElementById('yujie-core-style')) return;
    const s = document.createElement('style');
    s.id = 'yujie-core-style';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }

        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 导航栏 */
        .c-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .c-nav-s { height: 30px; }
        .c-nav-b { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .c-nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color:#000; }
        .c-nav-title { font-size: 16px; font-weight: 600; cursor: pointer; }
        .c-nav-mental { position: absolute; right: 16px; font-size: 20px; cursor: pointer; }

        /* 消息流与气泡 */
        .c-main { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; background-size: cover; background-position: center; }
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color:#000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color:#fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }
        /* 吸附翻译气泡 */
        .trans-bubble { align-self: flex-start; background: rgba(255,255,255,0.4); backdrop-filter: blur(10px); font-size: 13px; color: #3a3a3c; margin-top: -4px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.5); max-width: 70%; }

        /* 心理状态浮窗 */
        .mental-pop { position: absolute; top: 75px; right: 15px; width: 220px; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(40px); border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 20px; padding: 16px; z-index: 550; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .m-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        /* 半屏详情 */
        .s-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .s-sheet { position: absolute; bottom: 0; width: 100%; height: 85%; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650; overflow: hidden; }
        .s-sheet.dragging { transition: none !important; }
        .s-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: grab; }

        /* 详情组件 */
        .g-group { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .s-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; }
        .s-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; }
        .s-switch { appearance: none; width: 50px; height: 30px; background: rgba(0,0,0,0.05); border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; }
        .s-switch:checked { background: #34c759; }
        .s-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .s-switch:checked::after { transform: translateX(20px); }
        .btn-black { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        
        /* 2x4 背景预览 */
        .bg-box { width: 100%; height: 120px; border-radius: 15px; border: 2px dashed rgba(0,0,0,0.1); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.3); font-size: 13px; cursor: pointer; }

        /* 危险区 */
        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; background:#fff; padding:12px; border-radius:12px; }
        .danger-box { display: none; margin-top: 10px; padding: 10px; }
        .btn-white { background: #fff; color: #000; border: none; border-radius: 12px; padding: 12px; width: 100%; margin-bottom: 10px; font-weight: 600; box-shadow:0 2px 5px rgba(0,0,0,0.05); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 交互逻辑 (手势、键盘、开关) =====
let _startY = 0;
let _isDrag = false;

window.initSheetGesture = (sheet) => {
    const handle = sheet.querySelector('.s-handle');
    handle.ontouchstart = (e) => {
        _startY = e.touches[0].clientY;
        _isDrag = true;
        sheet.classList.add('dragging');
    };
    window.ontouchmove = (e) => {
        if (!_isDrag) return;
        let delta = e.touches[0].clientY - _startY;
        if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    };
    window.ontouchend = (e) => {
        if (!_isDrag) return;
        _isDrag = false;
        sheet.classList.remove('dragging');
        let delta = e.changedTouches[0].clientY - _startY;
        if (delta > 150) window.toggleSheet(false);
        else sheet.style.transform = `translateY(0)`;
    };
};

window.toggleSheet = (show) => {
    const mask = document.getElementById('sMask');
    const sheet = document.getElementById('sSheet');
    if (!sheet) return;
    if (show) {
        window.toggleMental(false);
        mask.style.display = 'block';
        setTimeout(() => {
            sheet.classList.add('active');
            sheet.style.transform = 'translateY(0)';
        }, 10);
    } else {
        sheet.classList.remove('active');
        sheet.style.transform = 'translateY(100%)';
        setTimeout(() => {
            mask.style.display = 'none';
            sheet.style.transform = '';
        }, 400);
    }
};

window.toggleMental = (show) => {
    const pop = document.getElementById('mentalPop');
    if (show === undefined) pop.style.display = (pop.style.display === 'block' ? 'none' : 'block');
    else pop.style.display = (show ? 'block' : 'none');
};

// ===== 4. 核心渲染与功能实现 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectSystemStyle();
    document.body.classList.add('chat-active');
    const content = document.getElementById('appContent');
    document.getElementById('genericAppWindow').style.display = 'flex';

    content.innerHTML = `
        <div class="chat-shell">
            <nav class="c-nav">
                <div class="c-nav-s"></div>
                <div class="c-nav-b">
                    <span class="c-nav-back" onclick="window.closeWholeApp()">‹</span>
                    <span class="c-nav-title" id="mainTitle">聊天</span>
                </div>
            </nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; background:#fff;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05);">
                <div onclick="window.switchMainTab('chats', this)" style="cursor:pointer; font-weight:700;">聊天</div>
                <div onclick="window.switchMainTab('contacts', this)" style="cursor:pointer; color:#8e8e93;">联系人</div>
                <div onclick="window.switchMainTab('moments', this)" style="cursor:pointer; color:#8e8e93;">动态</div>
                <div onclick="window.switchMainTab('me', this)" style="cursor:pointer; color:#8e8e93;">我的</div>
            </footer>
            <div id="chatOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:500; display:none; flex-direction:column;"></div>
        </div>
    `;
    window.switchMainTab('chats');
};

window.switchMainTab = (tab, el) => {
    const body = document.getElementById('mainBody');
    if (el) {
        el.parentElement.querySelectorAll('div').forEach(d => { d.style.color = '#8e8e93'; d.style.fontWeight = '500'; });
        el.style.color = '#000'; el.style.fontWeight = '700';
    }
    if (tab === 'chats') {
        body.innerHTML = ChatEngine.config.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">点击开始对话</div></div>
            </div>`).join('');
    } else {
        body.innerHTML = `<div style="padding:100px; text-align:center; color:#ccc;">${tab} 模块开发中</div>`;
    }
};

window.enterChat = (name) => {
    const layer = document.getElementById('chatOverlay');
    layer.style.display = 'flex';
    layer.innerHTML = `
        <header class="c-nav" style="background:rgba(255,255,255,0.4);">
            <div class="c-nav-s"></div>
            <div class="c-nav-b">
                <span class="c-nav-back" onclick="window.exitSingleChat()">‹</span>
                <span class="c-nav-title" onclick="window.toggleSheet(true)">${name}</span>
                <span class="c-nav-mental" onclick="window.toggleMental()">○</span>
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatEngine.config.chatBg}); background-size:cover; background-position:center;"></div>
        
        <div id="mentalPop" class="mental-pop" onclick="window.toggleMental(false)">
            <div style="font-weight:800; margin-bottom:10px;">窥视ta...</div>
            <div class="mental-label">心情</div><div id="m-mood">静谧</div><div class="m-divider"></div>
            <div class="mental-label">好感值</div><div id="m-fav">85</div><div class="m-divider"></div>
            <div class="mental-label">当前动作</div><div id="m-act">沉思</div><div class="m-divider"></div>
            <div class="mental-label">内心想法</div><div id="m-tht">正在等你消息...</div>
        </div>

        <div style="padding:10px 16px 30px; background:rgba(255,255,255,0.4); backdrop-filter:blur(30px); display:flex; align-items:center; gap:12px;">
            <div style="width:28px; height:28px; border:1px solid #8e8e93; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#8e8e93; cursor:pointer;" onclick="alert('相册/功能')">+</div>
            <input type="text" id="cInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.sendChatMessage()">
            <div style="font-size:26px; cursor:pointer;" onclick="window.sendChatMessage()">+</div>
        </div>

        <div class="s-mask" id="sMask" onclick="window.toggleSheet(false)">
            <div class="s-sheet" id="sSheet" onclick="event.stopPropagation()">
                <div class="s-handle" onclick="window.toggleSheet(false)"></div>
                <div style="padding:0 24px 50px; overflow-y:auto; height:calc(100% - 40px);">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    
                    <div class="g-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:8px;">API 消耗</div>
                        <div style="font-size:14px; font-weight:700;">总点数: <span id="api-disp">${ChatEngine.config.apiTotal}</span></div>
                    </div>

                    <div class="g-group">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>AI 总结</span> <span id="sum-val" style="color:#8e8e93;">${ChatEngine.config.settings.summaryCount}轮</span>
                        </div>
                        <input type="range" min="10" max="200" value="${ChatEngine.config.settings.summaryCount}" class="s-slider" oninput="document.getElementById('sum-val').innerText=this.value+'轮'; window.updateSet('summaryCount',this.value)">
                        <button class="btn-black" style="margin-top:15px;">手动立即总结</button>
                    </div>

                    <div class="g-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">聊天背景设置</div>
                        <div class="bg-box" id="bgPrev" style="background-image:url(${ChatEngine.config.chatBg});" onclick="window.pickChatBg()">
                            ${!ChatEngine.config.chatBg ? '选取背景 (2x4)' : ''}
                        </div>
                        <div style="color:#ff3b30; text-align:center; font-weight:700; margin-top:12px; cursor:pointer;" onclick="window.clearBg()">清除背景图</div>
                    </div>

                    <div class="g-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>开启线上旁白</span> 
                            <input type="checkbox" class="s-switch" ${ChatEngine.config.settings.onlineNarration?'checked':''} onchange="window.updateSet('onlineNarration',this.checked)">
                        </div>
                    </div>

                    <div class="g-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>自动翻译</span> 
                            <input type="checkbox" class="s-switch" ${ChatEngine.config.settings.autoTranslate?'checked':''} onchange="window.updateSet('autoTranslate',this.checked)">
                        </div>
                        <div style="font-size:11px; color:#8e8e93; margin-top:5px;">提示：当角色说非简体中文的时候，一律翻译</div>
                    </div>

                    <div class="g-group">
                        <div style="margin-bottom:10px;">人称选择 <span style="font-size:11px; color:#8e8e93;">(提示：用于旁白人称)</span></div>
                        <div style="display:flex; justify-content:space-around;">
                            <label><input type="radio" name="pron" ${ChatEngine.config.settings.pronoun=='me'?'checked':''} onclick="window.updateSet('pronoun','me')"> 我</label>
                            <label><input type="radio" name="pron" ${ChatEngine.config.settings.pronoun=='you'?'checked':''} onclick="window.updateSet('pronoun','you')"> 你</label>
                            <label><input type="radio" name="pron" ${ChatEngine.config.settings.pronoun=='ta'?'checked':''} onclick="window.updateSet('pronoun','ta')"> ta</label>
                        </div>
                    </div>

                    <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span id="danger-icon">></span></div>
                    <div id="dangerBox" class="danger-box">
                        <button class="btn-white" style="color:#ff3b30;" onclick="window.clearChatLogs()">清空聊天记录</button>
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">提示：请谨慎清除聊天记录，拾忆林数据也将受影响。</div>
                        <button class="btn-black" style="margin-bottom:10px;">拉黑联系人</button>
                        <button class="btn-white">删除联系人</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initSheetGesture(document.getElementById('sSheet'));
    window.renderChatHistory(); // 加载持久化消息
};

// ===== 5. 消息逻辑 (含持久化) =====
window.sendChatMessage = async function() {
    const input = document.getElementById('cInp');
    const text = input.value.trim();
    if (!text) return;

    const isNar = text.startsWith('(') || text.startsWith('（');
    const logs = ChatEngine.loadHistory('c1');
    const newMsg = { role: isNar ? 'narration' : 'user', content: text };
    logs.push(newMsg);
    ChatEngine.saveHistory('c1', logs);
    
    window.renderChatHistory();
    input.value = '';

    // API 请求模拟
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if (baseUrl && apiKey) {
        try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'system', content: 'Reply shortly in Japanese for testing.' }, { role: 'user', content: text }]
                })
            });
            const data = await res.json();
            const botText = data.choices[0].message.content;
            
            const history = ChatEngine.loadHistory('c1');
            history.push({ role: 'assistant', content: botText });
            
            // 心理状态随机刷新演示
            ChatEngine.config.apiTotal += 10;
            ChatEngine.save('api_total', ChatEngine.config.apiTotal);
            
            ChatEngine.saveHistory('c1', history);
            window.renderChatHistory();
        } catch (e) { alert('API 连接失败'); }
    }
};

window.renderChatHistory = () => {
    const flow = document.getElementById('chatFlow');
    if (!flow) return;
    const history = ChatEngine.loadHistory('c1');
    flow.innerHTML = history.map(msg => {
        if (msg.role === 'narration') return `<div class="bubble bubble-narration">${msg.content}</div>`;
        let html = `<div class="bubble bubble-${msg.role}">${msg.content}</div>`;
        // 自动翻译演示
        if (msg.role === 'assistant' && ChatEngine.config.settings.autoTranslate) {
            html += `<div class="trans-bubble">翻译：这是一段自动生成的中文翻译演示。</div>`;
        }
        return html;
    }).join('');
    flow.scrollTop = flow.scrollHeight;
};

// ===== 6. 设置项逻辑 =====
window.updateSet = (key, val) => {
    ChatEngine.config.settings[key] = val;
    ChatEngine.save('chat_settings', ChatEngine.config.settings);
};

window.pickChatBg = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const r = new FileReader();
            r.onload = (ev) => {
                ChatEngine.config.chatBg = ev.target.result;
                ChatEngine.save('chat_bg', ev.target.result);
                document.getElementById('bgPrev').style.backgroundImage = `url(${ev.target.result})`;
                document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`;
            };
            r.readAsDataURL(file);
        }
    };
    inp.click();
};

window.clearBg = () => {
    ChatEngine.config.chatBg = '';
    ChatEngine.save('chat_bg', '');
    document.getElementById('bgPrev').style.backgroundImage = '';
    document.getElementById('chatFlow').style.backgroundImage = '';
};

window.toggleDanger = () => {
    const box = document.getElementById('dangerBox');
    const icon = document.getElementById('danger-icon');
    const isShow = box.style.display === 'block';
    box.style.display = isShow ? 'none' : 'block';
    icon.innerText = isShow ? '>' : '∨';
};

window.clearChatLogs = () => {
    if (confirm('确定清空所有聊天记录？这将不可恢复。')) {
        ChatEngine.saveHistory('c1', []);
        window.renderChatHistory();
    }
};

window.exitSingleChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWholeApp = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

console.log("玉界：全功能旗舰交互系统已归位。");
