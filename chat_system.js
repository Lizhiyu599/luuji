/**
 * 玉界 - 顶级交互聊天系统 (极致细节修复版)
 * 风格：WeChat 结构 + iOS 渐变玻璃
 */

// ===== 1. 核心状态与数据追踪 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    userName: "用户",
    // 实时 API 消耗数据
    apiUsage: { total: 0, online: 0, offline: 0, image: 0, voice: 0 },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '开发者', letter: 'Z' }],
    // 设置项
    settings: {
        summaryRounds: 50,
        narrationOpen: true,
        pronoun: '我', // 我, 你, ta
        history: [] // 用于搜索
    }
};

// ===== 2. 样式深度定制 (层级、颜色、渐变) =====
const injectAdvancedStyles = () => {
    const styleId = 'chat-pro-ui-style';
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.innerHTML = `
        /* 布局逻辑 */
        .app-root { display: flex; flex-direction: column; height: 100%; background: #f9f9fb; position: relative; overflow: hidden; }
        .app-header { 
            flex-shrink: 0; height: 55px; display: flex; justify-content: center; align-items: center; 
            background: rgba(242, 242, 247, 0.9); backdrop-filter: blur(20px); border-bottom: 0.5px solid rgba(0,0,0,0.05);
            position: relative; z-index: 100;
        }
        .app-body { flex: 1; overflow-y: auto; background: #fafafc; padding-bottom: 70px; }
        .app-tabbar { 
            position: fixed; bottom: 0; width: 100%; height: 65px; 
            background: rgba(242, 242, 247, 0.9); backdrop-filter: blur(20px);
            display: flex; justify-content: space-around; align-items: center; z-index: 100;
        }

        /* 联系人：极简虚线 */
        .contact-item { 
            padding: 12px 16px; display: flex; align-items: center; gap: 12px; background: #fff;
            border-bottom: 0.5px dashed rgba(0,0,0,0.1); 
        }

        /* 聊天窗口：渐变透色 */
        #chatOverlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f2f2f7; z-index: 2000; display: none; flex-direction: column; }
        .chat-head-glass { 
            background: linear-gradient(to bottom, rgba(242,242,247,0.8), rgba(242,242,247,0.4));
            backdrop-filter: blur(15px); height: 55px; display: flex; justify-content: space-between; align-items: center; padding: 0 16px;
        }
        .chat-foot-glass { 
            background: linear-gradient(to top, rgba(242,242,247,0.8), rgba(242,242,247,0.4));
            backdrop-filter: blur(15px); padding: 10px 16px 25px; display: flex; align-items: center; gap: 10px;
        }

        /* 半屏面板 */
        .sheet-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.2); z-index: 2100; display: none; }
        .bottom-sheet { 
            position: absolute; bottom: 0; width: 100%; height: 85%; background: rgba(255,255,255,0.6); 
            backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px); border-radius: 25px 25px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); z-index: 2200;
        }
        .bottom-sheet.active { transform: translateY(0); }

        /* 滑块定制：白轨黑点 */
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; outline: none; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; }

        /* 状态浮窗 (ᥫ᭡) */
        .peek-bubble {
            position: absolute; top: 65px; right: 15px; width: 220px; background: rgba(255,255,255,0.5); 
            backdrop-filter: blur(30px); border-radius: 20px; padding: 16px; border: 0.5px solid #fff; z-index: 3000; display: none;
        }

        /* 气泡与旁白 */
        .bubble { max-width: 75%; padding: 10px 14px; border-radius: 18px; margin-bottom: 10px; font-size: 15px; }
        .bubble-user { align-self: flex-end; background: #000; color: #fff; }
        .bubble-assistant { align-self: flex-start; background: #fff; color: #000; border: 0.5px solid #eee; }
        .narration-text { align-self: center; color: #8e8e93; font-size: 13px; text-align: center; margin: 10px 0; max-width: 90%; }
        
        /* 危险区按钮 */
        .btn-danger { background: #fff; color: #ff3b30; border: 1px solid #ff3b30; border-radius: 12px; padding: 12px; font-weight: 700; width: 100%; }
        .btn-black-rect { background: #000; color: #fff; border: none; border-radius: 12px; padding: 12px; width: 100%; font-weight: 500; }
        
        /* 开关 UI */
        .ios-switch { appearance: none; width: 44px; height: 24px; background: #e9e9ea; border-radius: 12px; position: relative; cursor: pointer; transition: 0.3s; }
        .ios-switch:checked { background: #34c759; }
        .ios-switch::after { content:''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: #fff; border-radius: 50%; transition: 0.3s; }
        .ios-switch:checked::after { transform: translateX(20px); }
    `;
    document.head.appendChild(s);
};

// ===== 3. 页面渲染逻辑 =====
window.openApp = function(appName) {
    injectAdvancedStyles();
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    if (!appWindow || !appContent) return;

    appWindow.style.display = 'flex';
    appContent.style.padding = '0';
    appContent.innerHTML = `
        <div class="app-root">
            <div class="app-header">
                <div style="font-weight:700; font-size:17px;" id="headerTitle">聊天</div>
            </div>
            
            <div class="app-body" id="appBody"></div>

            <div class="app-tabbar">
                <div class="tab-item active" onclick="window.switchTab('chats', this)">聊天</div>
                <div class="tab-item" onclick="window.switchTab('contacts', this)">联系人</div>
                <div class="tab-item" onclick="window.switchTab('moments', this)">动态</div>
                <div class="tab-item" onclick="window.switchTab('me', this)">我的</div>
            </div>

            <div id="chatOverlay"></div>
            <div class="sheet-mask" id="sheetMask" onclick="window.closeSheet()"></div>
            <div id="chatSheet" class="bottom-sheet"></div>
            <input type="file" id="imgPicker" style="display:none" accept="image/*">
        </div>
    `;
    window.switchTab('chats');
};

window.switchTab = function(tab, el) {
    const body = document.getElementById('appBody');
    const head = document.getElementById('headerTitle');
    const headerRow = document.querySelector('.app-header');
    
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    // 标题逻辑：只有聊天和联系人显示标题
    headerRow.style.display = (tab === 'chats' || tab === 'contacts') ? 'flex' : 'none';

    if (tab === 'chats') {
        head.innerText = "聊天";
        renderChats(body);
    } else if (tab === 'contacts') {
        head.innerText = "联系人";
        renderContacts(body);
    } else if (tab === 'moments') {
        renderMoments(body);
    } else if (tab === 'me') {
        renderMe(body);
    }
};

// 渲染联系人
function renderContacts(container) {
    container.innerHTML = `
        <div style="background:#fff;">
            <div class="contact-item">
                <div style="width:40px;height:40px;background:#fa9d3b;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;">👤</div>
                <span style="font-weight:500;">新的朋友</span>
            </div>
            <div style="background:#fafafc; padding:4px 16px; font-size:11px; color:#8e8e93;">Z</div>
            <div class="contact-item" onclick="window.enterChat('枝玉')">
                <div style="width:40px;height:40px;background:#000;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;">枝</div>
                <span style="font-weight:500;">枝玉</span>
            </div>
        </div>
    `;
}

// ===== 4. 聊天窗口逻辑 (透色渐变) =====
window.enterChat = function(name) {
    const overlay = document.getElementById('chatOverlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="chat-head-glass">
            <span onclick="window.closeChat()" style="cursor:pointer; font-size:22px;"> < </span>
            <div style="font-weight:700; cursor:pointer;" onclick="window.openSheet()">${name}</div>
            <span onclick="window.togglePeek()" style="cursor:pointer; font-size:20px;">ᥫ᭡</span>
        </div>
        
        <div id="msgFlow" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column; 
             background-size:cover; background-position:center; background-image:url(${ChatConfig.chatBg});">
        </div>

        <div class="chat-foot-glass">
            <div style="width:28px;height:28px;border:1.5px solid #000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;cursor:pointer;" onclick="alert('更多功能')">+</div>
            <input type="text" id="chatIn" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
            <div style="font-size:22px; font-weight:300; cursor:pointer;" onclick="window.send()">+</div>
        </div>

        <div id="peek" class="peek-bubble" onclick="this.style.display='none'">
            <div style="font-weight:800; font-size:14px; margin-bottom:10px;">窥视ta...</div>
            <div style="font-size:11px; color:#8e8e93;">心情</div><div id="pk-mood" style="font-size:13px;">${ChatConfig.mental.mood}</div><div style="border-bottom:0.5px dashed #ddd;margin:6px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">好感值</div><div id="pk-fav" style="font-size:13px;">${ChatConfig.mental.favorability}</div><div style="border-bottom:0.5px dashed #ddd;margin:6px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">当前动作</div><div id="pk-act" style="font-size:13px;">${ChatConfig.mental.action}</div><div style="border-bottom:0.5px dashed #ddd;margin:6px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">内心想法</div><div id="pk-tht" style="font-size:13px;">${ChatConfig.mental.thought}</div>
        </div>
    `;
    renderSheet(); // 预渲染半屏
};

// ===== 5. 聊天详情半屏 (拖动关闭 & 实时数据) =====
function renderSheet() {
    const sheet = document.getElementById('chatSheet');
    sheet.innerHTML = `
        <div style="height:40px; display:flex; justify-content:center; align-items:center; cursor:pointer;" id="sheetHandle">
            <div style="width:36px; height:5px; background:rgba(0,0,0,0.1); border-radius:3px;"></div>
        </div>
        <div style="padding:0 24px 40px; overflow-y:auto; height:calc(100% - 40px);">
            <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
            
            <!-- API 面板 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px; border:0.5px solid #fff;">
                <div style="font-size:11px; color:#8e8e93; margin-bottom:12px;">实时 API 消耗</div>
                <div style="font-size:14px; line-height:1.8;">
                    全部点数：<span id="st-total">${ChatConfig.apiUsage.total}</span><br>
                    线上聊天：<span id="st-online">${ChatConfig.apiUsage.online}</span> | 线下聊天：${ChatConfig.apiUsage.offline}<br>
                    生成图片：${ChatConfig.apiUsage.image} | 语音：${ChatConfig.apiUsage.voice}
                </div>
            </div>

            <!-- 搜索 -->
            <div style="margin-bottom:15px;">
                <input type="text" id="searchInput" placeholder="搜索聊天记录…" style="width:100%; border:none; background:rgba(255,255,255,0.8); border-radius:14px; padding:12px;" oninput="window.searchChat(this.value)">
                <div id="searchResults" style="margin-top:8px; display:none; background:rgba(255,255,255,0.4); border-radius:12px; padding:10px; font-size:13px;"></div>
            </div>

            <!-- AI 总结 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px; border:0.5px solid #fff;">
                <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                    <span>AI 自动总结</span> <span style="font-weight:700;" id="sumVal">${ChatConfig.settings.summaryRounds}</span>
                </div>
                <input type="range" min="10" max="200" value="${ChatConfig.settings.summaryRounds}" class="ios-slider" oninput="window.updateSlider(this.value)">
                <button class="btn-black-rect" style="margin-top:15px;" onclick="alert('总结已存入拾忆林')">手动总结</button>
            </div>

            <!-- 背景设置 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px;">
                <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">聊天背景设置</div>
                <div id="bgPreview" style="width:100%; height:80px; background:#f2f2f7; border-radius:12px; border:1px dashed #ccc; display:flex; align-items:center; justify-content:center; color:#ccc; background-size:cover; background-position:center; background-image:url(${ChatConfig.chatBg});" onclick="window.pickBg()">
                    ${!ChatConfig.chatBg ? '2×4 选取背景' : ''}
                </div>
                <button style="margin-top:10px; background:none; border:none; color:#ff3b30; font-size:13px; font-weight:700; width:100%; text-align:center;" onclick="window.clearBg()">清除背景图</button>
            </div>

            <!-- 旁白 & 人称 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>开启旁白生成</span>
                    <input type="checkbox" class="ios-switch" ${ChatConfig.settings.narrationOpen ? 'checked' : ''} onchange="ChatConfig.settings.narrationOpen = this.checked">
                </div>
                <div style="margin-top:15px; border-top:0.5px solid rgba(0,0,0,0.05); padding-top:15px;">
                    <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">人称选择 (用于旁白)</div>
                    <div style="display:flex; justify-content:space-around;">
                        <label><input type="radio" name="p-sel" onclick="ChatConfig.settings.pronoun='我'" checked> 我</label>
                        <label><input type="radio" name="p-sel" onclick="ChatConfig.settings.pronoun='你'"> 你</label>
                        <label><input type="radio" name="p-sel" onclick="ChatConfig.settings.pronoun='ta'"> ta</label>
                    </div>
                </div>
            </div>

            <!-- 危险区 -->
            <div style="margin-top:20px;">
                <div style="display:flex; justify-content:space-between; color:#ff3b30; font-weight:700;" onclick="window.toggleDanger()">
                    <span>危险区</span> <span id="dangerArrow">></span>
                </div>
                <div id="dangerZone" style="display:none; margin-top:15px; display:flex; flex-direction:column; gap:10px;">
                    <button class="btn-danger" onclick="window.clearChat()">清空聊天记录</button>
                    <button class="btn-black-rect" style="background:#000;">拉黑联系人</button>
                    <button class="btn-danger" style="background:#fff;">删除联系人</button>
                </div>
            </div>
        </div>
    `;

    // 绑定拖动下滑关闭
    const handle = document.getElementById('sheetHandle');
    let startY = 0;
    handle.ontouchstart = e => startY = e.touches[0].clientY;
    handle.ontouchmove = e => {
        let delta = e.touches[0].clientY - startY;
        if (delta > 100) window.closeSheet();
    };
}

// ===== 6. 交互逻辑补全 =====
window.send = function() {
    const input = document.getElementById('chatIn');
    const flow = document.getElementById('msgFlow');
    const text = input.value.trim();
    if (!text) return;

    // 记录历史用于搜索
    ChatConfig.settings.history.push(text);
    appendMsg(flow, 'user', text);
    input.value = '';

    // 增加 API 消耗 (示例)
    ChatConfig.apiUsage.total += 10;
    ChatConfig.apiUsage.online += 10;
    updateAPIUI();

    setTimeout(() => {
        const reply = "好的。";
        ChatConfig.settings.history.push(reply);
        appendMsg(flow, 'assistant', reply);
    }, 1000);
};

function appendMsg(box, role, text) {
    const div = document.createElement('div');
    const isNar = text.startsWith('(') || text.startsWith('（');
    if (isNar) {
        div.className = 'narration-text';
        div.innerText = text;
    } else {
        div.className = `bubble bubble-${role}`;
        div.innerText = text;
    }
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

window.updateAPIUI = function() {
    if (document.getElementById('st-total')) {
        document.getElementById('st-total').innerText = ChatConfig.apiUsage.total;
        document.getElementById('st-online').innerText = ChatConfig.apiUsage.online;
    }
};

window.updateSlider = val => {
    ChatConfig.settings.summaryRounds = val;
    document.getElementById('sumVal').innerText = val;
};

window.searchChat = val => {
    const resBox = document.getElementById('searchResults');
    if (!val) { resBox.style.display = 'none'; return; }
    const matches = ChatConfig.settings.history.filter(h => h.includes(val));
    resBox.style.display = 'block';
    resBox.innerHTML = matches.length ? matches.map(m => `<div style="padding:4px 0; border-bottom:0.5px solid rgba(0,0,0,0.05);">${m}</div>`).join('') : '未找到相关记录';
};

window.pickBg = () => {
    const p = document.getElementById('imgPicker');
    p.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            const r = new FileReader();
            r.onload = ev => {
                const data = ev.target.result;
                ChatConfig.chatBg = data;
                localStorage.setItem('yujie_chat_bg', data);
                document.getElementById('bgPreview').style.backgroundImage = `url(${data})`;
                document.getElementById('bgPreview').innerText = '';
                document.getElementById('msgFlow').style.backgroundImage = `url(${data})`;
            };
            r.readAsDataURL(file);
        }
    };
    p.click();
};

window.clearBg = () => {
    ChatConfig.chatBg = '';
    localStorage.removeItem('yujie_chat_bg');
    document.getElementById('bgPreview').style.backgroundImage = '';
    document.getElementById('bgPreview').innerText = '2×4 选取背景';
    document.getElementById('msgFlow').style.backgroundImage = '';
};

window.openSheet = () => {
    document.getElementById('sheetMask').style.display = 'block';
    document.getElementById('chatSheet').classList.add('active');
};
window.closeSheet = () => {
    document.getElementById('sheetMask').style.display = 'none';
    document.getElementById('chatSheet').classList.remove('active');
};
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.togglePeek = () => {
    const p = document.getElementById('peek');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
};
window.toggleDanger = () => {
    const z = document.getElementById('dangerZone');
    const a = document.getElementById('dangerArrow');
    const isHidden = z.style.display === 'none';
    z.style.display = isHidden ? 'flex' : 'none';
    a.innerText = isHidden ? '∨' : '>';
};
window.clearChat = () => { if(confirm("确定清空记录？")) document.getElementById('msgFlow').innerHTML = ''; };

// 存根
function renderChats(c) { c.innerHTML = '<div style="padding:15px;"><div class="contact-item" style="border-radius:12px;border:none;box-shadow:0 4px 12px rgba(0,0,0,0.03);" onclick="window.enterChat(\'枝玉\')"><div style="width:40px;height:40px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;">枝</div><div style="flex:1;"><div style="font-weight:700;">枝玉</div><div style="font-size:12px;color:#8e8e93;">你好，我是开发者枝玉。</div></div></div></div>'; }
function renderMoments(c) { c.innerHTML = '<div style="height:200px;background:#ddd;display:flex;align-items:center;justify-content:center;color:#8e8e93;">动态流加载中...</div>'; }
function renderMe(c) { c.innerHTML = '<div style="padding:40px;text-align:center;"><div style="width:80px;height:80px;background:#eee;border-radius:20px;margin:0 auto 15px;"></div><div style="font-size:20px;font-weight:700;">用户</div></div>'; }

console.log("玉界：WeChat风极简系统修复完毕。");
