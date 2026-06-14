/**
 * 玉界 - 旗舰级全功能交互系统 (手势锁定修复版)
 * 修复：只有拖动导航条才能下滑退出，内容区滑动不误触
 */

// ===== 1. 核心状态与持久化 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    userName: "用户",
    settings: {
        summaryCount: parseInt(localStorage.getItem('yujie_summary_count') || 50),
        onlineNarration: localStorage.getItem('yujie_narration') !== 'false',
        autoTranslate: localStorage.getItem('yujie_translate') !== 'false',
        pronoun: localStorage.getItem('yujie_pronoun') || 'me',
        apiTotal: parseInt(localStorage.getItem('api_total') || 0)
    },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }],
    mental: { mood: "专注", favorability: 92, action: "锁定手势代码", thought: "这次一定让宝宝滑得顺心。" }
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
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; color: #000; }
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
        .translate-bubble { 
            align-self: flex-start; background: rgba(255,255,255,0.4); backdrop-filter: blur(10px);
            font-size: 13px; color: #3a3a3c; margin-top: -6px; margin-bottom: 12px; border-radius: 12px; 
            padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%;
        }

        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); -webkit-backdrop-filter: blur(45px);
            border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650; display: flex; flex-direction: column;
        }
        .half-sheet.dragging { transition: none !important; }
        .sheet-handle { width: 100%; height: 40px; flex-shrink: 0; display: flex; justify-content: center; align-items: flex-start; cursor: pointer; }
        .handle-bar { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin-top: 12px; }

        .sheet-content { flex: 1; overflow-y: auto; padding: 0 24px 50px; -webkit-overflow-scrolling: touch; }
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .ios-switch { appearance: none; width: 50px; height: 30px; background: rgba(0,0,0,0.05); border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .ios-switch:checked { background: #34c759; }
        .ios-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .ios-switch:checked::after { transform: translateX(20px); }

        .black-btn { background: #000; color: #fff; border: none; border-radius: 14px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        .bg-preview-2x4 { width: 100%; height: 120px; border-radius: 15px; border: 2px dashed rgba(0,0,0,0.1); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.3); cursor: pointer; margin-bottom: 10px; }
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; }

        .danger-fold { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
        .white-btn { background: #fff; color: #000; border: none; border-radius: 12px; padding: 12px; width: 100%; margin-bottom: 10px; font-weight: 600; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势重写：精准锁定导航条 =====
let isHandleDragging = false;
let startDragY = 0;

window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    
    // 只有点击或拖动 handle 才有效
    handle.addEventListener('touchstart', (e) => {
        isHandleDragging = true;
        startDragY = e.touches[0].clientY;
        sheet.classList.add('dragging');
    });

    // 处理点击导航条直接关闭
    handle.addEventListener('click', () => {
        window.toggleSheet(false);
    });

    window.addEventListener('touchmove', (e) => {
        if (!isHandleDragging) return;
        let delta = e.touches[0].clientY - startDragY;
        if (delta > 0) {
            sheet.style.transform = `translateY(${delta}px)`;
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (!isHandleDragging) return;
        isHandleDragging = false;
        sheet.classList.remove('dragging');
        let delta = e.changedTouches[0].clientY - startDragY;
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

// ===== 4. 核心功能与渲染 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectFlagshipStyle();
    document.body.classList.add('chat-active');
    const appWindow = document.getElementById('genericAppWindow');
    appWindow.style.display = 'flex';
    document.getElementById('appContent').innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav">
                <div class="nav-status"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="window.closeWhole()">‹</span>
                    <span class="nav-title" id="chatTitle" onclick="window.toggleSheet(true)">聊天</span>
                </div>
            </nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; background:#fff;"></main>
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
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
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
                <span class="nav-title" onclick="window.toggleSheet(true)">${name}</span>
                <span class="nav-mental-btn" onclick="window.toggleMental()">○</span>
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover; background-position:center;"></div>
        
        <div id="mentalPop" class="mental-popup" onclick="window.toggleMental(false)">
            <div style="font-weight:800; font-size:15px; margin-bottom:10px;">窥视ta...</div>
            <div class="mental-label">心情</div><div class="mental-value">${ChatConfig.mental.mood}</div><div class="mental-divider"></div>
            <div class="mental-label">好感值</div><div class="mental-value">${ChatConfig.mental.favorability}</div><div class="mental-divider"></div>
            <div class="mental-label">当前动作</div><div class="mental-value">${ChatConfig.mental.action}</div><div class="mental-divider"></div>
            <div class="mental-label">内心想法</div><div class="mental-value">${ChatConfig.mental.thought}</div>
        </div>

        <div style="padding:10px 16px 30px; background:rgba(255,255,255,0.4); backdrop-filter:blur(30px); display:flex; align-items:center; gap:12px;">
            <div style="width:28px; height:28px; border:1px solid #8e8e93; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#8e8e93; cursor:pointer;" onclick="alert('功能区')">+</div>
            <input type="text" id="chatInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
            <div style="font-size:26px; cursor:pointer;" onclick="window.send()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"><div class="handle-bar"></div></div>
                <div class="sheet-content">
                    <div style="font-size:20px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:8px;">API 消耗</div>
                        <div style="font-size:14px; font-weight:700;">总点数: <span id="api-disp">${ChatConfig.settings.apiTotal}</span></div>
                    </div>
                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between;"><span>AI 总结</span> <span id="summ-val" style="color:#8e8e93;">${ChatConfig.settings.summaryCount}轮</span></div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSumm(this.value)">
                        <button class="black-btn">手动立即总结</button>
                    </div>
                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">聊天背景设置</div>
                        <div class="bg-preview-2x4" id="bgPrev" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()">
                            ${!ChatConfig.chatBg ? '选取背景' : ''}
                        </div>
                        <div class="red-text-btn" onclick="window.clearBg()">清除背景图</div>
                    </div>
                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>开启线上旁白</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration', this.checked)">
                        </div>
                    </div>
                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>自动翻译</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate', this.checked)">
                        </div>
                        <div style="font-size:11px; color:#8e8e93; margin-top:4px;">提示：当角色说非简体中文的时候，一律翻译</div>
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
                            <button class="white-btn" style="color:#ff3b30;" onclick="window.clearLog()">清空聊天记录</button>
                            <button class="black-btn" style="margin-bottom:10px;">拉黑联系人</button>
                            <button class="white-btn">删除联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
    window.loadHistory(name);
};

// ===== 5. 功能逻辑实现 =====
window.send = async function() {
    const input = document.getElementById('chatInp');
    const flow = document.getElementById('chatFlow');
    if (!input.value.trim()) return;
    const text = input.value.trim();
    appendBubble(flow, text.startsWith('(')||text.startsWith('（') ? 'narration' : 'user', text);
    input.value = '';
    window.saveHistory();
    // 模拟回复略...
};

function appendBubble(box, role, text) {
    const d = document.createElement('div'); d.className = `bubble bubble-${role}`; d.innerText = text;
    box.appendChild(d); box.scrollTop = box.scrollHeight;
}

window.saveHistory = () => { const f = document.getElementById('chatFlow'); if(f) localStorage.setItem('yujie_logs_枝玉', f.innerHTML); };
window.loadHistory = () => { const f = document.getElementById('chatFlow'); const l = localStorage.getItem('yujie_logs_枝玉'); if(f && l) { f.innerHTML = l; f.scrollTop = f.scrollHeight; } };
window.updateSumm = (v) => { ChatConfig.settings.summaryCount = v; document.getElementById('summ-val').innerText = v + '轮'; localStorage.setItem('yujie_summary_count', v); };
window.setSet = (k, v) => { ChatConfig.settings[k] = v; localStorage.setItem('yujie_' + k, v); };
window.setPronoun = (p) => { ChatConfig.settings.pronoun = p; localStorage.setItem('yujie_pronoun', p); };
window.pickBg = () => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*';
    i.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
            const r = new FileReader(); r.onload = (ev) => {
                ChatConfig.chatBg = ev.target.result; localStorage.setItem('yujie_chat_bg', ev.target.result);
                document.getElementById('bgPrev').style.backgroundImage = `url(${ev.target.result})`;
                document.getElementById('bgPrev').innerText = ''; document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`;
            }; r.readAsDataURL(file);
        }
    }; i.click();
};
window.clearBg = () => {
    ChatConfig.chatBg = ''; localStorage.removeItem('yujie_chat_bg');
    document.getElementById('bgPrev').style.backgroundImage = ''; document.getElementById('bgPrev').innerText = '选取聊天背景';
    document.getElementById('chatFlow').style.backgroundImage = '';
};
window.toggleDanger = () => {
    const dz = document.getElementById('dangerZone'); const ic = document.getElementById('danger-icon');
    const show = dz.style.display === 'block'; dz.style.display = show ? 'none' : 'block'; ic.innerText = show ? '>' : '∨';
};
window.toggleMental = (show) => {
    const pop = document.getElementById('mentalPop');
    if (show === undefined) pop.style.display = (pop.style.display === 'block' ? 'none' : 'block');
    else pop.style.display = (show ? 'block' : 'none');
};
window.clearLog = () => { if(confirm('确定清空记录？')) { document.getElementById('chatFlow').innerHTML = ''; window.saveHistory(); } };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

window.addEventListener('click', (e) => {
    const pop = document.getElementById('mentalPop');
    if (pop && pop.style.display === 'block' && !pop.contains(e.target) && !e.target.classList.contains('nav-mental-btn')) window.toggleMental(false);
});

console.log("玉界：旗舰交互系统已就绪。");
