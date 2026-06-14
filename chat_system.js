/**
 * 玉界 - 顶级全功能交互系统 (数据持久化 + 液态玻璃全功能版)
 * 严禁删除功能 | 实时保存 | 手势优化 | 心理状态刷新
 */

// ===== 1. 核心数据与初始化 (含本地记录读取) =====
const currentContactId = 'c1'; // 默认联系人ID
window.ChatConfig = {
    userName: "用户",
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    // 聊天记录持久化
    history: JSON.parse(localStorage.getItem('yujie_history_' + currentContactId) || '[]'),
    settings: {
        summaryCount: 50,
        onlineNarration: true,
        autoTranslate: true,
        pronoun: 'me', // me, you, ta
        apiTotal: parseInt(localStorage.getItem('api_total') || 0)
    },
    mental: { mood: "静谧", favorability: 92, action: "翻阅书卷", thought: "希望能给宝宝最完美的系统。" }
};

// 保存聊天记录
window.saveChatHistory = () => {
    localStorage.setItem('yujie_history_' + currentContactId, JSON.stringify(window.ChatConfig.history));
};

// ===== 2. 样式深度注入 (液态玻璃 + 组件美化) =====
const injectUltraStyle = () => {
    if (document.getElementById('yujie-ultra-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-ultra-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }
        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }

        /* 顶部导航 */
        .chat-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; cursor: pointer; color: #000; }
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 20px; cursor: pointer; }

        /* 气泡系统 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; display: flex; flex-direction: column; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }
        /* 吸附翻译气泡 */
        .trans-attach { align-self: flex-start; background: rgba(255,255,255,0.4); backdrop-filter: blur(10px); font-size: 13px; color: #3a3a3c; margin-top: -6px; margin-bottom: 12px; border-radius: 12px; padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.3); max-width: 70%; }

        /* 心理状态 popup */
        .mental-pop { position: absolute; top: 75px; right: 15px; width: 220px; background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(40px); border-radius: 20px; padding: 16px; z-index: 550; display: none; border: 1px solid #fff; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .m-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin: 8px 0; }

        /* 液态玻璃半窗 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet { position: absolute; bottom: 0; width: 100%; height: 85%; background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(45px); border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); border-top: 0.5px solid #fff; }
        .half-sheet.dragging { transition: none !important; }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: grab; }

        /* 设置组 */
        .glass-box { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .ios-switch { appearance: none; width: 46px; height: 26px; background: rgba(0,0,0,0.08); border-radius: 13px; position: relative; cursor: pointer; transition: 0.3s; }
        .ios-switch:checked { background: #34c759; }
        .ios-switch::after { content:''; position:absolute; top:2px; left:2px; width:22px; height:22px; background:#fff; border-radius:50%; transition:0.3s; }
        .ios-switch:checked::after { transform: translateX(20px); }
        
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #000; border-radius: 50%; cursor: pointer; }
        
        .btn-black { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        .btn-red-clear { color: #ff3b30; font-weight: 700; cursor: pointer; text-align: center; font-size: 14px; margin-top: 8px; }

        /* 2x4 背景预览 */
        .bg-2x4 { width: 100%; height: 100px; border-radius: 15px; border: 2px dashed rgba(0,0,0,0.05); background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; color: rgba(0,0,0,0.2); cursor: pointer; margin-bottom: 5px; }

        /* 危险区 */
        .danger-fold { background:#fff; border-radius:12px; padding:14px; display:flex; justify-content:space-between; align-items:center; color:#ff3b30; font-weight:700; cursor:pointer; }
        .danger-body { display:none; padding:15px 0 0; }
        .btn-white { background:#fff; color:#000; border:none; border-radius:12px; padding:12px; width:100%; margin-bottom:10px; font-weight:600; box-shadow: 0 2px 5px rgba(0,0,0,0.03); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 接管功能与手势 (解决 Bug) =====
let dragY = 0;
let isDragging = false;
window.initSheetDrag = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => { dragY = e.touches[0].clientY; isDragging = true; sheet.classList.add('dragging'); };
    window.ontouchmove = (e) => {
        if (!isDragging) return;
        let delta = e.touches[0].clientY - dragY;
        if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    };
    window.ontouchend = (e) => {
        if (!isDragging) return;
        isDragging = false; sheet.classList.remove('dragging');
        let delta = e.changedTouches[0].clientY - dragY;
        if (delta > 150) window.toggleSheet(false);
        else sheet.style.transform = `translateY(0)`;
    };
};

window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (show) {
        window.toggleMental(false); // 打开详情时关闭心理窗口
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

// ===== 4. 核心渲染 (数据加载) =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectUltraStyle();
    document.body.classList.add('chat-active');
    const appContent = document.getElementById('appContent');
    document.getElementById('genericAppWindow').style.display = 'flex';

    appContent.innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav">
                <div class="nav-status"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="window.closeWhole()">‹</span>
                    <span class="nav-title" id="chatTitleTitle" onclick="window.navTab('chats')">聊天</span>
                </div>
            </nav>
            <main id="chatMainBody" style="flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; background:#fff;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05);">
                <div onclick="window.navTab('chats', this)" style="cursor:pointer; font-weight:700;">聊天</div>
                <div onclick="window.navTab('contacts', this)" style="cursor:pointer; color:#8e8e93;">联系人</div>
                <div onclick="window.navTab('moments', this)" style="cursor:pointer; color:#8e8e93;">动态</div>
                <div onclick="window.navTab('me', this)" style="cursor:pointer; color:#8e8e93;">我的</div>
            </footer>
            <div id="chatWindowLayer" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:500; display:none; flex-direction:column;"></div>
        </div>
    `;
    window.navTab('chats');
};

window.navTab = (tab, el) => {
    const body = document.getElementById('chatMainBody');
    if (el) {
        el.parentElement.querySelectorAll('div').forEach(d => { d.style.color = '#8e8e93'; d.style.fontWeight = '500'; });
        el.style.color = '#000'; el.style.fontWeight = '700';
    }
    if (tab === 'chats') {
        body.innerHTML = window.ChatConfig.contacts.map(c => `
            <div style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px; cursor:pointer;" onclick="window.enterChat('${c.name}')">
                <div style="width:50px;height:50px;background:#000;color:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;font-weight:800;">${c.avatar}</div>
                <div><div style="font-weight:600;">${c.name}</div><div style="font-size:12px;color:#8e8e93;">点击开始对话</div></div>
            </div>`).join('');
    } else {
        body.innerHTML = `<div style="padding:100px; text-align:center; color:#ccc;">${tab} 模块开发中</div>`;
    }
};

window.enterChat = (name) => {
    const layer = document.getElementById('chatWindowLayer');
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
        <div id="msgFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover; background-position:center;"></div>
        
        <div id="mentalPop" class="mental-pop" onclick="window.toggleMental(false)">
            <div style="font-weight:800; font-size:15px; margin-bottom:10px;">窥视ta...</div>
            <div class="m-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">心情</div><div style="font-size:13px; margin-bottom:8px;">${ChatConfig.mental.mood}</div>
            <div class="m-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">好感值</div><div style="font-size:13px; margin-bottom:8px;">${ChatConfig.mental.favorability}</div>
            <div class="m-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">当前动作</div><div style="font-size:13px; margin-bottom:8px;">${ChatConfig.mental.action}</div>
            <div class="m-divider"></div>
            <div style="font-size:11px; color:#8e8e93;">内心想法</div><div style="font-size:13px;">${ChatConfig.mental.thought}</div>
        </div>

        <div style="padding:10px 16px 30px; background:rgba(255,255,255,0.4); backdrop-filter:blur(30px); display:flex; align-items:center; gap:12px;">
            <div style="width:28px; height:28px; border:1px solid #8e8e93; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#8e8e93; cursor:pointer;" onclick="alert('功能面板')">+</div>
            <input type="text" id="wxInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
            <div style="font-size:26px; cursor:pointer;" onclick="window.send()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"></div>
                <div style="padding:0 24px 50px; overflow-y:auto; height:calc(100% - 40px);">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    
                    <div class="glass-box">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:8px;">API 消耗</div>
                        <div style="font-size:14px; font-weight:700;">总点数: <span id="api-disp">${ChatConfig.settings.apiTotal}</span></div>
                    </div>

                    <div class="glass-box">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>AI 总结</span> <span id="sum-val" style="color:#8e8e93;">${ChatConfig.settings.summaryCount}轮</span>
                        </div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="document.getElementById('sum-val').innerText=this.value+'轮'">
                        <button class="btn-black" style="margin-top:15px;">手动立即总结</button>
                    </div>

                    <div class="glass-box">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">聊天背景</div>
                        <div class="bg-2x4" id="bgPre" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()">
                            ${!ChatConfig.chatBg ? '选取背景' : ''}
                        </div>
                        <div class="btn-red-clear" onclick="window.clearBg()">清除背景图</div>
                    </div>

                    <div class="glass-box">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>线上旁白开关</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.ChatConfig.settings.onlineNarration=this.checked">
                        </div>
                    </div>

                    <div class="glass-box">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span>自动翻译开关</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.ChatConfig.settings.autoTranslate=this.checked">
                        </div>
                        <div style="font-size:11px; color:#8e8e93;">提示：当角色说非简体中文的时候，一律翻译。</div>
                    </div>

                    <div class="glass-box">
                        <div style="margin-bottom:10px;">人称选择</div>
                        <div style="display:flex; justify-content:space-between; font-size:14px;">
                            <label><input type="radio" name="pron" ${ChatConfig.settings.pronoun=='me'?'checked':''} onclick="window.ChatConfig.settings.pronoun='me'"> 我</label>
                            <label><input type="radio" name="pron" ${ChatConfig.settings.pronoun=='you'?'checked':''} onclick="window.ChatConfig.settings.pronoun='you'"> 你</label>
                            <label><input type="radio" name="pron" ${ChatConfig.settings.pronoun=='ta'?'checked':''} onclick="window.ChatConfig.settings.pronoun='ta'"> ta</label>
                        </div>
                    </div>

                    <div class="danger-fold" onclick="window.toggleDanger()">危险区 <span id="danger-icon">></span></div>
                    <div id="dangerBody" class="danger-body">
                        <button class="btn-white" style="color:#ff3b30;" onclick="window.clearLogs()">清空聊天记录</button>
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">提示：请谨慎清除。</div>
                        <button class="btn-black" style="margin-bottom:10px;">拉黑联系人</button>
                        <button class="btn-white">删除联系人</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initSheetDrag(document.getElementById('detailSheet'));
    
    // 加载历史记录
    const box = document.getElementById('msgFlow');
    ChatConfig.history.forEach(m => appendBubble(box, m.role, m.text, true));
};

// ===== 5. 发送与逻辑 (持久化) =====
window.send = async function() {
    const input = document.getElementById('wxInp');
    const box = document.getElementById('msgFlow');
    const text = input.value.trim();
    if (!text) return;

    const isNar = text.startsWith('(') || text.startsWith('（');
    appendBubble(box, isNar ? 'narration' : 'user', text);
    ChatConfig.history.push({ role: isNar ? 'narration' : 'user', text: text });
    window.saveChatHistory();
    input.value = '';

    // 简单模拟回复逻辑 (实际对接 API)
    setTimeout(() => {
        const reply = "This is an AI message for translation test.";
        appendBubble(box, 'assistant', reply);
        if (ChatConfig.settings.autoTranslate) {
            const trans = document.createElement('div');
            trans.className = 'trans-attach';
            trans.innerText = "翻译：这是一条用于测试翻译的 AI 消息。";
            box.appendChild(trans);
        }
        ChatConfig.history.push({ role: 'assistant', text: reply });
        window.saveChatHistory();
        box.scrollTop = box.scrollHeight;
    }, 1000);
};

function appendBubble(box, role, text, isHistory) {
    const div = document.createElement('div');
    div.className = `bubble bubble-${role}`;
    div.innerText = text;
    box.appendChild(div);
    if(!isHistory) box.scrollTop = box.scrollHeight;
}

window.pickBg = () => {
    const i = document.createElement('input'); i.type='file'; i.accept='image/*';
    i.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
            const r = new FileReader();
            r.onload = (ev) => {
                ChatConfig.chatBg = ev.target.result;
                localStorage.setItem('yujie_chat_bg', ev.target.result);
                document.getElementById('bgPre').style.backgroundImage = `url(${ev.target.result})`;
                document.getElementById('bgPre').innerText = '';
                document.getElementById('msgFlow').style.backgroundImage = `url(${ev.target.result})`;
            };
            r.readAsDataURL(file);
        }
    };
    i.click();
};

window.clearBg = () => {
    ChatConfig.chatBg = ''; localStorage.removeItem('yujie_chat_bg');
    document.getElementById('bgPre').style.backgroundImage = ''; document.getElementById('bgPre').innerText = '选取背景';
    document.getElementById('msgFlow').style.backgroundImage = '';
};

window.toggleDanger = () => {
    const b = document.getElementById('dangerBody');
    const i = document.getElementById('danger-icon');
    const show = b.style.display === 'block';
    b.style.display = show ? 'none' : 'block';
    i.innerText = show ? '>' : '∨';
};

window.clearLogs = () => { if(confirm('清空聊天记录？')) { document.getElementById('msgFlow').innerHTML = ''; ChatConfig.history = []; window.saveChatHistory(); } };
window.closeChat = () => document.getElementById('chatWindowLayer').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

console.log("玉界：旗舰版聊天插件重载成功。");                    
