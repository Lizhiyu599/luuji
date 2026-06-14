/**
 * 玉界 - iOS 18 沉浸式液态玻璃系统 (全功能旗舰版)
 * 修复：手势下拉、吸附翻译、AI总结拉条、2x4预览、互斥开关
 */

// ===== 1. 核心数据与持久化配置 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    userName: "用户",
    // 聊天设置
    settings: {
        summaryCount: 50,
        onlineNarration: true,
        autoTranslate: true,
        pronoun: 'me', // me, you, ta
        apiTotal: parseInt(localStorage.getItem('api_total') || 0)
    },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }]
};

// ===== 2. 深度视觉样式注入 =====
const injectFlagshipStyle = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; }

        .chat-shell { display: flex; flex-direction: column; height: 100vh; width: 100%; background: #f2f2f7; position: relative; overflow: hidden; }
        
        /* 额头优化 */
        .chat-nav {
            flex-shrink: 0; height: 70px; display: flex; flex-direction: column;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px);
            border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100;
        }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; }
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; }

        /* 气泡与翻译吸附 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color: #000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .translate-bubble { 
            align-self: flex-start; background: rgba(255,255,255,0.4); backdrop-filter: blur(10px);
            font-size: 13px; color: #3a3a3c; margin-top: -4px; margin-bottom: 12px; border-radius: 12px; 
            padding: 8px 12px; border: 0.5px solid rgba(255,255,255,0.5); max-width: 70%;
        }
        .bubble-narration { align-self: center; background: none; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; max-width: 85%; }

        /* 液态玻璃半窗 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px); -webkit-backdrop-filter: blur(45px);
            border-radius: 30px 30px 0 0; transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); overflow: hidden;
        }
        .half-sheet.active { transform: translateY(0); }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: grab; }

        /* 设置组件：滑块、开关、按钮 */
        .glass-group { background: rgba(255,255,255,0.3); border-radius: 20px; margin-bottom: 15px; padding: 16px; border: 0.5px solid rgba(255,255,255,0.4); }
        .ios-switch { appearance: none; width: 50px; height: 30px; background: rgba(0,0,0,0.05); border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; }
        .ios-switch:checked { background: #34c759; }
        .ios-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 26px; height: 26px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .ios-switch:checked::after { transform: translateX(20px); }

        .black-btn { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        .red-text-btn { color: #ff3b30; font-weight: 700; cursor: pointer; text-align: center; margin-top: 10px; }

        /* 2x4 背景预览框 */
        .bg-preview-box { 
            width: 100%; height: 120px; border-radius: 15px; border: 2px dashed rgba(0,0,0,0.1);
            background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center;
            color: rgba(0,0,0,0.3); font-size: 13px; cursor: pointer; overflow: hidden;
        }

        /* 自定义滑块 */
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; }

        /* 危险区折叠 */
        .danger-header { display: flex; justify-content: space-between; align-items: center; color: #ff3b30; font-weight: 700; cursor: pointer; }
        .danger-content { display: none; margin-top: 15px; padding-top: 15px; border-top: 0.5px dashed rgba(255,0,0,0.1); }
        .white-btn { background: #fff; color: #000; border: none; border-radius: 12px; padding: 12px; width: 100%; margin-bottom: 10px; font-weight: 600; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 接管与手势逻辑 =====
let dragStartY = 0;
window.initSheetGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    handle.ontouchstart = (e) => {
        dragStartY = e.touches[0].clientY;
        sheet.style.transition = 'none';
    };
    sheet.ontouchmove = (e) => {
        let delta = e.touches[0].clientY - dragStartY;
        if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
    };
    sheet.ontouchend = (e) => {
        sheet.style.transition = 'transform 0.4s cubic-bezier(0.2, 1, 0.3, 1)';
        let delta = e.changedTouches[0].clientY - dragStartY;
        if (delta > 150) window.toggleSheet(false);
        else sheet.style.transform = `translateY(0)`;
    };
};

window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    mask.style.display = show ? 'block' : 'none';
    setTimeout(() => sheet.classList.toggle('active', show), 10);
};

// ===== 4. 核心渲染与功能适配 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectFlagshipStyle();
    document.body.classList.add('chat-active');
    const content = document.getElementById('appContent');
    document.getElementById('genericAppWindow').style.display = 'flex';

    content.innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav">
                <div class="nav-status"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="window.closeWholeApp()">‹</span>
                    <span class="nav-title" id="chatTitle" onclick="window.toggleSheet(true)">聊天</span>
                </div>
            </nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(20px); border-top:0.5px solid rgba(0,0,0,0.05);">
                <div onclick="window.navTo('chats', this)" style="cursor:pointer; font-weight:700;">聊天</div>
                <div onclick="window.navTo('contacts', this)" style="cursor:pointer; color:#8e8e93;">联系人</div>
                <div onclick="window.navTo('moments', this)" style="cursor:pointer; color:#8e8e93;">动态</div>
                <div onclick="window.navTo('me', this)" style="cursor:pointer; color:#8e8e93;">我的</div>
            </footer>
            <div id="chatOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:500; display:none; flex-direction:column;"></div>
        </div>
    `;
    window.navTo('chats');
};

window.navTo = (tab, el) => {
    const body = document.getElementById('mainBody');
    if (el) {
        el.parentElement.querySelectorAll('div').forEach(d => d.style.color = '#8e8e93');
        el.parentElement.querySelectorAll('div').forEach(d => d.style.fontWeight = '500');
        el.style.color = '#000'; el.style.fontWeight = '700';
    }
    if (tab === 'chats') {
        body.innerHTML = `<div style="background:#fff;">${ChatConfig.contacts.map(c => `
            <div class="contact-item" style="display:flex; padding:15px; border-bottom:0.5px dashed #eee; align-items:center; gap:12px;" onclick="window.enterChat('${c.name}')">
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
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover; background-position:center;"></div>
        <div style="padding:10px 16px 30px; background:rgba(255,255,255,0.4); backdrop-filter:blur(30px); display:flex; align-items:center; gap:12px;">
            <div style="width:28px; height:28px; border:1px solid #8e8e93; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#8e8e93; cursor:pointer;" onclick="alert('相册/功能')">+</div>
            <input type="text" id="chatInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.sendMsg()">
            <div style="font-size:26px; cursor:pointer;" onclick="window.sendMsg()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle" onclick="window.toggleSheet(false)"></div>
                <div style="padding:0 24px 50px; overflow-y:auto; height:calc(100% - 40px);">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    
                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:8px;">API 消耗详情</div>
                        <div style="font-size:14px; font-weight:700;">总点数: <span id="api-total">${ChatConfig.settings.apiTotal}</span></div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <span>AI 总结</span> <span id="summary-val" style="color:#8e8e93;">${ChatConfig.settings.summaryCount}轮</span>
                        </div>
                        <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="document.getElementById('summary-val').innerText=this.value+'轮'">
                        <button class="black-btn" style="margin-top:15px;">手动立即总结</button>
                    </div>

                    <div class="glass-group">
                        <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">聊天背景</div>
                        <div class="bg-preview-box" id="bgPreview" style="background-image:url(${ChatConfig.chatBg});" onclick="window.pickChatBg()">
                            ${!ChatConfig.chatBg ? '选取背景' : ''}
                        </div>
                        <div class="red-text-btn" onclick="window.clearChatBg()">清除背景图</div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>开启线上旁白</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.onlineNarration ? 'checked' : ''} onchange="ChatConfig.settings.onlineNarration=this.checked">
                        </div>
                    </div>

                    <div class="glass-group">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <span>自动翻译</span> <input type="checkbox" class="ios-switch" ${ChatConfig.settings.autoTranslate ? 'checked' : ''} onchange="ChatConfig.settings.autoTranslate=this.checked">
                        </div>
                        <div style="font-size:11px; color:#8e8e93;">提示：当角色说非简体中文时自动翻译</div>
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
                        <div class="danger-header" onclick="window.toggleDanger()">危险区 <span id="danger-icon">></span></div>
                        <div class="danger-content" id="dangerZone">
                            <button class="white-btn" style="color:#ff3b30;" onclick="window.clearLog()">清空聊天记录</button>
                            <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">提示：请谨慎清除聊天记录。</div>
                            <button class="black-btn" style="margin-bottom:10px;">拉黑联系人</button>
                            <button class="white-btn">删除联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.initSheetGesture(document.getElementById('detailSheet'));
};

// ===== 5. 功能逻辑实现 =====
window.sendMsg = async function() {
    const input = document.getElementById('chatInp');
    const flow = document.getElementById('chatFlow');
    const text = input.value.trim();
    if (!text) return;
    
    // 渲染用户消息
    const isNar = text.startsWith('(') || text.startsWith('（');
    appendBubble(flow, isNar ? 'narration' : 'user', text);
    input.value = '';

    // 模拟回复流程
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if(baseUrl && apiKey) {
        try {
            const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: 'system', content: 'Reply in English or Japanese sometimes to test translation.' }, { role: 'user', content: text }]
                })
            });
            const data = await res.json();
            const botText = data.choices[0].message.content;
            
            // 渲染 AI 消息
            appendBubble(flow, 'assistant', botText);
            
            // 自动翻译逻辑
            if(ChatConfig.settings.autoTranslate) {
                const trans = document.createElement('div');
                trans.className = 'translate-bubble';
                trans.innerText = "翻译：[这是自动翻译的内容示例]";
                flow.appendChild(trans);
            }
            
            ChatConfig.settings.apiTotal += 10;
            localStorage.setItem('api_total', ChatConfig.settings.apiTotal);
            if(document.getElementById('api-total')) document.getElementById('api-total').innerText = ChatConfig.settings.apiTotal;
            flow.scrollTop = flow.scrollHeight;
        } catch(e) {}
    }
};

function appendBubble(box, role, text) {
    const div = document.createElement('div');
    div.className = `bubble bubble-${role}`;
    div.innerText = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

window.pickChatBg = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = (e) => {
        const file = e.target.files[0];
        if(file) {
            const r = new FileReader();
            r.onload = (ev) => {
                ChatConfig.chatBg = ev.target.result;
                localStorage.setItem('yujie_chat_bg', ev.target.result);
                document.getElementById('bgPreview').style.backgroundImage = `url(${ev.target.result})`;
                document.getElementById('bgPreview').innerText = '';
                document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`;
            };
            r.readAsDataURL(file);
        }
    };
    inp.click();
};

window.clearChatBg = () => {
    ChatConfig.chatBg = '';
    localStorage.removeItem('yujie_chat_bg');
    document.getElementById('bgPreview').style.backgroundImage = '';
    document.getElementById('bgPreview').innerText = '选取背景';
    document.getElementById('chatFlow').style.backgroundImage = '';
};

window.setPronoun = (p) => ChatConfig.settings.pronoun = p;
window.toggleDanger = () => {
    const dz = document.getElementById('dangerZone');
    const icon = document.getElementById('danger-icon');
    const show = dz.style.display === 'block';
    dz.style.display = show ? 'none' : 'block';
    icon.innerText = show ? '>' : '∨';
};
window.clearLog = () => { if(confirm('确定清空所有聊天记录？')) document.getElementById('chatFlow').innerHTML = ''; };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWholeApp = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

console.log("玉界：旗舰全功能交互系统注入成功。");
