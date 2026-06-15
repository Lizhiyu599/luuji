/**
 * 玉界 - 旗舰级交互系统 (最终加固完全体)
 * 修复：导航栏绝对置底、黑色开关、API三行联动、14字精准引用、4档频率拉条
 */

// ===== 1. 核心状态持久化 =====
window.ChatConfig = {
    userName: "用户",
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    isAITyping: false,
    quotedMsg: null,
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
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '开发者测试角色' }],
    mental: { mood: "待命", favorability: 99, action: "系统重构", thought: "全力修复布局中。" }
};

// ===== 2. 核心样式 (锁定置底 + 黑色开关) =====
const injectFlagshipStyle = () => {
    if (document.getElementById('yujie-flagship-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-flagship-css';
    s.innerHTML = `
        .chat-active .app-header { display: none !important; }
        .chat-active #appContent { padding: 0 !important; height: 100% !important; position: relative !important; overflow: hidden; }
        .chat-shell { display: flex; flex-direction: column; height: 100%; width: 100%; background: #f2f2f7; position: relative; }
        
        /* 导航栏置顶 */
        .chat-nav { flex-shrink: 0; height: 70px; display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(30px); border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100; }
        .nav-status { height: 30px; }
        .nav-body { height: 40px; display: flex; align-items: center; justify-content: center; position: relative; padding: 0 16px; }
        .nav-back { position: absolute; left: 16px; font-size: 24px; cursor: pointer; color:#000; }
        .nav-title { font-size: 16px; font-weight: 600; color: #000; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 22px; cursor: pointer; }

        /* 内容区 */
        .chat-main-body { flex: 1; overflow-y: auto; background: #fff; padding-bottom: 70px; -webkit-overflow-scrolling: touch; }

        /* 底部导航栏：钉死在底部 */
        .tab-fixed-bottom {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 65px;
            background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(30px);
            border-top: 0.5px solid rgba(0,0,0,0.05); display: flex; justify-content: space-around;
            align-items: center; z-index: 999; padding-bottom: env(safe-area-inset-bottom);
        }
        .tab-item { font-size: 11px; color: #8e8e93; font-weight: 500; text-align: center; cursor: pointer; }
        .tab-item.active { color: #000; font-weight: 700; }

        /* 气泡样式 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 8px; line-height: 1.4; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.9); color: #000; border-bottom-right-radius: 4px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color: #fff; border-bottom-left-radius: 4px; }
        .bubble-narration { align-self: center; background: none !important; color: #8e8e93; font-size: 12px; text-align: center; margin: 10px 0; }
        
        /* 长按功能栏 */
        .bubble-menu { position: fixed; background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(25px); border: 0.5px solid #fff; border-radius: 14px; width: 210px; z-index: 2000; display: none; box-shadow: 0 8px 25px rgba(0,0,0,0.1); overflow: hidden; }
        .menu-row { display: flex; }
        .menu-item { flex: 1; text-align: center; padding: 12px 0; font-size: 12px; color: #000; cursor: pointer; border-right: 0.5px dashed rgba(0,0,0,0.1); }
        .menu-item:last-child { border-right: none; }

        /* 详情页包裹框 (液态玻璃) */
        .glass-group { background: rgba(255,255,255,0.6); backdrop-filter: blur(10px); border-radius: 24px; margin-bottom: 16px; padding: 18px; border: 0.5px solid rgba(255,255,255,0.4); }
        .item-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        
        /* 黑色开关与滑块 */
        .custom-switch { appearance: none; width: 50px; height: 30px; background: #fff; border: 1px solid #e5e5ea; border-radius: 15px; position: relative; cursor: pointer; transition: 0.3s; vertical-align: middle; }
        .custom-switch:checked { background: #000 !important; border-color: #000 !important; }
        .custom-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 24px; height: 24px; background: #fff; border-radius: 50%; transition: 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .custom-switch:checked::after { transform: translateX(20px); }
        
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; margin: 15px 0; border: 0.5px solid rgba(0,0,0,0.05); }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; background: #000; border-radius: 50%; cursor: pointer; border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }

        .black-btn { background: #000; color: #fff; border: none; border-radius: 12px; padding: 14px; width: 100%; font-weight: 700; cursor: pointer; }
        #chatOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f2f2f7; z-index: 1000; display: none; flex-direction: column; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 功能逻辑 (长按、引用、详情交互) =====

// 3.1 引用逻辑 (精准14字截断)
window.setupQuote = (name, text) => {
    ChatConfig.quotedMsg = { name, text };
    const qv = document.getElementById('quotePreview');
    const qt = document.getElementById('quoteText');
    qv.style.display = 'block';
    let combined = name + "：" + text;
    let line1 = combined.substring(0, 14);
    let line2 = "";
    if (combined.length > 14) {
        let secondPart = combined.substring(14);
        line2 = "\n" + secondPart.substring(0, 12) + (secondPart.length > 12 ? "..." : "");
    }
    qt.innerText = line1 + line2;
};
window.cancelQuote = () => { ChatConfig.quotedMsg = null; document.getElementById('quotePreview').style.display = 'none'; };

// 3.2 功能栏逻辑 (滑动消失)
let longTarget = null;
window.showBubbleMenu = (e, el) => {
    e.preventDefault(); longTarget = el;
    const menu = document.getElementById('bubbleMenu');
    menu.style.display = 'block';
    const rect = el.getBoundingClientRect();
    menu.style.top = (rect.top - 100) + 'px';
    menu.style.left = Math.max(10, rect.left + (rect.width/2) - 105) + 'px';

    const flow = document.getElementById('chatFlow');
    const autoClose = () => { menu.style.display = 'none'; flow.removeEventListener('scroll', autoClose); };
    flow.addEventListener('scroll', autoClose);
};

window.menuAct = (act) => {
    const text = longTarget.innerText;
    const curName = document.getElementById('chatTitle').innerText;
    if (act === 'copy') navigator.clipboard.writeText(text);
    else if (act === 'quote') { window.setupQuote(curName, text); document.getElementById('chatInp').focus(); }
    document.getElementById('bubbleMenu').style.display = 'none';
};

// 3.3 搜索跳转与背景管理
window.doSearch = (val) => {
    const res = document.getElementById('searchRes');
    if(!val) { res.style.display='none'; return; }
    res.style.display='block';
    const bubbles = document.querySelectorAll('.bubble');
    let html = "";
    bubbles.forEach(b => {
        if(b.innerText.includes(val)) html += `<div style="padding:10px; background:rgba(255,255,255,0.4); border-radius:8px; margin-bottom:5px;" onclick="window.jumpMsg('${b.id}')">${b.innerText.substring(0,20)}...</div>`;
    });
    res.innerHTML = html || "无结果";
};
window.jumpMsg = (id) => { window.toggleSheet(false); document.getElementById(id).scrollIntoView({behavior:'smooth', block:'center'}); };

window.pickBg = () => {
    const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*';
    inp.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            ChatConfig.chatBg = ev.target.result;
            document.getElementById('chatFlow').style.backgroundImage = `url(${ev.target.result})`;
            document.getElementById('bgPrev').style.backgroundImage = `url(${ev.target.result})`;
            document.getElementById('bgPrev').innerText = "";
            localStorage.setItem('yujie_chat_bg', ev.target.result);
        };
        reader.readAsDataURL(e.target.files[0]);
    };
    inp.click();
};

window.clearBg = () => {
    ChatConfig.chatBg = "";
    localStorage.removeItem('yujie_chat_bg');
    document.getElementById('chatFlow').style.backgroundImage = "";
    document.getElementById('bgPrev').style.backgroundImage = "";
    document.getElementById('bgPrev').innerText = "点击添加聊天背景图";
};

// ===== 4. 核心渲染 (详情页 10 大模块) =====
window.enterChat = (name) => {
    const layer = document.getElementById('chatOverlay');
    layer.style.display = 'flex';
    layer.innerHTML = `
        <header class="chat-nav">
            <div class="nav-status"></div><div class="nav-body">
                <span class="nav-back" onclick="window.closeChat()">‹</span>
                <span class="nav-title" id="chatTitle" onclick="window.toggleSheet(true)">${name}</span>
                <span class="nav-mental-btn" onclick="window.toggleMental()">○</span>
            </div>
        </header>
        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-size:cover; background-position:center; background-image:url(${ChatConfig.chatBg});"></div>
        
        <div id="mentalPop" class="mental-popup" onclick="window.toggleMental(false)">
            <div class="mental-title">窥视ta...</div>
            <div class="mental-value">心情: ${ChatConfig.mental.mood}</div>
            <div class="mental-value">好感: ${ChatConfig.mental.favorability}</div>
            <div class="mental-value">内心: ${ChatConfig.mental.thought}</div>
        </div>

        <div id="bubbleMenu" class="bubble-menu">
            <div class="menu-row">
                <div class="menu-item" onclick="window.menuAct('copy')">复制</div>
                <div class="menu-item" onclick="window.menuAct('quote')">引用</div>
                <div class="menu-item" onclick="window.menuAct('translate')">翻译</div>
                <div class="menu-item" onclick="window.menuAct('regret')">重回</div>
            </div>
        </div>

        <footer class="chat-footer" style="flex-shrink:0;">
            <div id="quotePreview" class="quote-preview" style="background:rgba(255,255,255,0.6);backdrop-filter:blur(20px);margin:10px;padding:10px;border-radius:12px;display:none;position:relative;border:0.5px solid rgba(0,0,0,0.05);">
                <span onclick="window.cancelQuote()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:#666;font-size:20px;">x</span>
                <div id="quoteText" style="font-size:12px;color:#333;line-height:1.4;white-space:pre-wrap;"></div>
            </div>
            <div class="input-row" style="display:flex;padding:10px 16px 25px;background:#f2f2f7;gap:10px;align-items:center;">
                <div style="width:28px;height:28px;border:1px solid #8e8e93;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#8e8e93;font-size:20px;">+</div>
                <input type="text" id="chatInp" class="chat-inp-box" style="flex:1;height:38px;border:none;background:#fff;border-radius:19px;padding:0 15px;" placeholder="输入消息..." onkeypress="if(event.key==='Enter') window.send()">
                <div onclick="window.send()" style="font-size:28px;color:#555;cursor:pointer;">+</div>
            </div>
        </footer>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()" style="position:absolute;bottom:0;width:100%;height:85%;background:rgba(255,255,255,0.7);backdrop-filter:blur(40px);border-radius:30px 30px 0 0;padding:20px;overflow-y:auto;box-sizing:border-box;">
                <div style="width:100%;height:20px;display:flex;justify-content:center;margin-bottom:10px;"><div style="width:40px;height:5px;background:rgba(0,0,0,0.1);border-radius:3px;"></div></div>
                <div style="font-size:24px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                
                <div class="glass-group">
                    <div style="font-size:18px; font-weight:800; margin-bottom:12px;">API 消耗详情</div>
                    <div style="font-size:14px; color:rgba(0,0,0,0.5); margin-bottom:10px;">全部点数：<span style="color:#000;font-weight:700;">${ChatConfig.settings.api.total} token</span></div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:rgba(0,0,0,0.5);margin-bottom:8px;">
                        <span>线上：${ChatConfig.settings.api.online} token</span><span>线下：${ChatConfig.settings.api.offline} token</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:rgba(0,0,0,0.5);">
                        <span>生图：${ChatConfig.settings.api.image} token</span><span>语音：${ChatConfig.settings.api.voice} token</span>
                    </div>
                </div>

                <div class="glass-group">
                    <div style="font-size:18px; font-weight:800; margin-bottom:12px;">搜索聊天记录</div>
                    <input type="text" placeholder="请输入内容..." style="width:100%;height:44px;border:none;background:#fff;border-radius:12px;padding:0 15px;" oninput="window.doSearch(this.value)">
                    <div id="searchRes" style="margin-top:10px;display:none;"></div>
                </div>

                <div class="glass-group">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:18px;font-weight:800;">聊天总结</span><span style="font-weight:700;">${ChatConfig.settings.summaryCount}轮</span>
                    </div>
                    <div style="font-size:11px;color:#8e8e93;margin:8px 0;">提示：默认50轮自动总结，你可调自动总结轮数。</div>
                    <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryCount}" class="ios-slider" oninput="window.updateSet('summaryCount',this.value)">
                    <button class="black-btn" onclick="alert('总结已适配拾忆林')">手动总结</button>
                </div>

                <div class="glass-group">
                    <div style="font-size:18px;font-weight:800;margin-bottom:12px;">聊天背景图</div>
                    <div id="bgPrev" style="width:100%;height:120px;background:#fff;border-radius:15px;display:flex;align-items:center;justify-content:center;color:#8e8e93;background-size:cover;background-position:center;border:1px dashed #ccc;" onclick="window.pickBg()">点击添加聊天背景图</div>
                    <button class="black-btn" style="margin-top:10px;" onclick="window.clearBg()">清除当前背景</button>
                </div>

                <div class="glass-group">
                    <div style="font-size:18px;font-weight:800;margin-bottom:12px;">角色信息条数</div>
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:#8e8e93;"><span>提示：回复最少</span><span>${ChatConfig.settings.replyMin}</span></div>
                    <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMin}" class="ios-slider" oninput="window.updateSet('replyMin',this.value)">
                    <div style="display:flex;justify-content:space-between;font-size:13px;color:#8e8e93;margin-top:10px;"><span>提示：回复最多</span><span>${ChatConfig.settings.replyMax}</span></div>
                    <input type="range" min="1" max="10" value="${ChatConfig.settings.replyMax}" class="ios-slider" oninput="window.updateSet('replyMax',this.value)">
                </div>

                <div class="glass-group">
                    <div class="item-row"><span style="font-size:18px;font-weight:800;">线上聊天旁白</span><input type="checkbox" class="custom-switch" ${ChatConfig.settings.onlineNarration?'checked':''} onchange="window.setSet('onlineNarration',this.checked)"></div>
                </div>

                <div class="glass-group">
                    <div style="font-size:18px;font-weight:800;margin-bottom:4px;">人称选择</div>
                    <div style="font-size:11px;color:#8e8e93;margin-bottom:12px;">提示：用于聊天中的线上线下旁白。</div>
                    <div class="item-row"><span>第一人称“我”</span><input type="radio" name="p" class="custom-switch" ${ChatConfig.settings.pronoun=='me'?'checked':''} onclick="window.setSet('pronoun','me')"></div>
                    <div class="item-row"><span>第二人称“你”</span><input type="radio" name="p" class="custom-switch" ${ChatConfig.settings.pronoun=='you'?'checked':''} onclick="window.setSet('pronoun','you')"></div>
                    <div class="item-row"><span>第三人称“ta”</span><input type="radio" name="p" class="custom-switch" ${ChatConfig.settings.pronoun=='ta'?'checked':''} onclick="window.setSet('pronoun','ta')"></div>
                </div>

                <div class="glass-group">
                    <div class="item-row"><span style="font-size:18px;font-weight:800;">自动发消息</span><input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoMsg?'checked':''} onchange="window.setSet('autoMsg',this.checked)"></div>
                    <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:800;margin-top:10px;"><span>1h</span><span>5h</span><span>10h</span><span>24h</span></div>
                    <input type="range" min="0" max="3" step="1" value="${ChatConfig.settings.autoMsgFreq}" class="ios-slider" oninput="window.updateSet('autoMsgFreq',this.value)">
                </div>

                <div class="glass-group">
                    <div class="item-row"><span style="font-size:18px;font-weight:800;">自动翻译</span><input type="checkbox" class="custom-switch" ${ChatConfig.settings.autoTranslate?'checked':''} onchange="window.setSet('autoTranslate',this.checked)"></div>
                </div>

                <div class="glass-group" style="border:1px solid rgba(255,0,0,0.1);">
                    <div style="color:red;font-size:18px;font-weight:800;display:flex;justify-content:space-between;" onclick="window.toggleDanger()">危险区 <span id="danger-ic">></span></div>
                    <div id="dangerZone" style="display:none;margin-top:15px;padding-top:15px;border-top:1px dashed #ffd6d6;">
                        <button style="width:100%;padding:12px;background:#fff;color:red;border:1px solid red;border-radius:12px;margin-bottom:15px;font-weight:700;" onclick="window.clearLog()">清空聊天记录</button>
                        <button class="black-btn" style="margin-bottom:15px;">拉黑联系人</button>
                        <button style="width:100%;padding:12px;background:#fff;border:1px solid #000;border-radius:12px;font-weight:700;">删除联系人</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.loadHistory();
};

// ===== 5. 核心引擎 (发送、回复、路由) =====
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
            <main id="mainBody" class="chat-main-body"></main>
            <footer class="tab-fixed-bottom">
                <div onclick="window.navTo('chats', this)" class="tab-item active"><div class="tab-icon">聊</div>聊天</div>
                <div onclick="window.navTo('contacts', this)" class="tab-item"><div class="tab-icon">联</div>联系人</div>
                <div onclick="window.navTo('moments', this)" class="tab-item"><div class="tab-icon">动</div>动态</div>
                <div onclick="window.navTo('me', this)" class="tab-item"><div class="tab-icon">我</div>我的</div>
            </footer>
            <div id="chatOverlay"></div>
        </div>
    `;
    window.navTo('chats');
};

window.navTo = (t, el) => {
    if (el) { el.parentElement.querySelectorAll('.tab-item').forEach(d => d.classList.remove('active')); el.classList.add('active'); }
    document.getElementById('mainBody').innerHTML = `<div style="padding:15px;border-bottom:0.5px dashed #eee;" onclick="window.enterChat('枝玉')">枝玉</div>`;
};

window.send = async () => {
    const inp = document.getElementById('chatInp'); if(!inp.value.trim()) return;
    const t = inp.value.trim(); const f = document.getElementById('chatFlow');
    const d = document.createElement('div'); d.id='m-'+Date.now(); d.className = 'bubble bubble-user'; d.innerText = t;
    d.oncontextmenu = (e) => window.showBubbleMenu(e, d);
    f.appendChild(d); inp.value = ""; window.cancelQuote(); f.scrollTop = f.scrollHeight;
    window.triggerReply(t);
};

window.triggerReply = async (ctx) => {
    ChatConfig.isAITyping = true;
    document.getElementById('chatTitle').innerHTML = `<span style="font-size:12px;color:#8e8e93;">输入中...</span>`;
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');
    if(!baseUrl || !apiKey) { window.appendBot("请先配置API"); return; }
    const sysPrompt = window.getSystemPrompt ? window.getSystemPrompt("枝玉是个开发者。") : "你好。";
    try {
        const res = await fetch(baseUrl.replace(/\/+$/, '') + '/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({ model, messages: [{role:'system', content:sysPrompt}, {role:'user', content:ctx}] })
        });
        const data = await res.json();
        window.appendBot(data.choices[0].message.content);
    } catch(e) { window.appendBot("连接失败: " + e.message); }
    finally { ChatConfig.isAITyping = false; document.getElementById('chatTitle').innerText = "枝玉"; }
};

window.appendBot = (c) => {
    const f = document.getElementById('chatFlow'); let t = c; const j = c.match(/\{.*\}/);
    if(j) { try { ChatConfig.mental = JSON.parse(j[0]); t = c.replace(j[0], "").trim(); } catch(e){} }
    const d = document.createElement('div'); d.className = 'bubble bubble-assistant'; d.innerText = t; d.id='m-'+Date.now();
    d.oncontextmenu = (e) => window.showBubbleMenu(e, d);
    f.appendChild(d); f.scrollTop = f.scrollHeight;
};

// -- 通用控制 --
window.toggleSheet = (s) => { document.getElementById('sheetMask').style.display = s ? 'block' : 'none'; };
window.toggleMental = (s) => { document.getElementById('mentalPop').style.display = s===undefined?(document.getElementById('mentalPop').style.display==='block'?'none':'block'):(s?'block':'none'); };
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };
window.setSet = (k, v) => { ChatConfig.settings[k] = v; localStorage.setItem('yujie_'+k, v); };
window.updateSet = (k, v) => { window.setSet(k,v); window.enterChat(document.getElementById('chatTitle').innerText); };
window.toggleDanger = () => { const dz = document.getElementById('dangerZone'); const show = dz.style.display==='block'; dz.style.display=show?'none':'block'; document.getElementById('danger-ic').innerText=show?'>':'∨'; };
window.clearLog = () => { if(confirm("确定清空记录？")) { document.getElementById('chatFlow').innerHTML=""; localStorage.removeItem('yujie_logs_枝玉'); alert("已清空"); } };
window.loadHistory = () => { /* 载入历史记录 */ };
