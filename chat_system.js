/**
 * 玉界 - 顶级微信结构 + iOS 玻璃视觉重构版
 * 修复：导航栏绝对贴底、去双标题、功能逻辑全实装
 */

// ===== 1. 核心状态与持久化数据 =====
window.ChatConfig = {
    // API 点数实时数据
    api: {
        total: parseInt(localStorage.getItem('yujie_api_total')) || 0,
        online: parseInt(localStorage.getItem('yujie_api_online')) || 0,
        offline: parseInt(localStorage.getItem('yujie_api_offline')) || 0,
        image: parseInt(localStorage.getItem('yujie_api_image')) || 0,
        voice: parseInt(localStorage.getItem('yujie_api_voice')) || 0
    },
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    pronoun: localStorage.getItem('yujie_pronoun') || '我', // 我, 你, ta
    isNarration: localStorage.getItem('yujie_narration') === 'true',
    summaryCount: 50,
    wallet: 5200.00
};

// 更新API点数函数
window.useApi = (type, points) => {
    ChatConfig.api.total += points;
    ChatConfig.api[type] += points;
    localStorage.setItem('yujie_api_total', ChatConfig.api.total);
    localStorage.setItem('yujie_api_' + type, ChatConfig.api[type]);
    if(document.getElementById('api-total-val')) {
        document.getElementById('api-total-val').innerText = ChatConfig.api.total;
    }
};

// ===== 2. CSS 样式：色度分层与交互动画 =====
const injectAdvancedStyles = () => {
    const styleId = 'liquid-advanced-ui';
    if (document.getElementById(styleId)) return;
    const s = document.createElement('style');
    s.id = styleId;
    s.innerHTML = `
        /* 根布局：三段式 */
        .chat-root {
            display: flex; flex-direction: column; height: 100%; width: 100%;
            background: #fdfdfd; position: relative; overflow: hidden;
        }
        
        /* 顶部和底部：深色玻璃 (88px) */
        .glass-header {
            height: 88px; flex-shrink: 0; display: flex; align-items: flex-end;
            justify-content: center; padding-bottom: 12px; position: relative;
            background: rgba(242, 242, 247, 0.95); backdrop-filter: blur(40px);
            border-bottom: 0.5px solid rgba(0,0,0,0.05); z-index: 100;
        }
        .glass-tabbar {
            position: fixed; bottom: 0; left: 0; width: 100%; height: 85px;
            background: rgba(242, 242, 247, 0.95); backdrop-filter: blur(40px);
            display: flex; justify-content: space-around; align-items: flex-start;
            padding-top: 10px; border-top: 0.5px solid rgba(0,0,0,0.05);
            z-index: 100; padding-bottom: env(safe-area-inset-bottom);
        }
        
        /* 内容区：浅色护眼 */
        .scroll-body { flex: 1; overflow-y: auto; background: #fdfdfd; padding-bottom: 100px; }

        .tab-btn { font-size: 14px; color: #8e8e93; font-weight: 500; cursor: pointer; display: flex; flex-direction: column; align-items: center; }
        .tab-btn.active { color: #000; font-weight: 700; }

        /* 联系人列表：扁平+虚线 */
        .contact-item {
            padding: 12px 16px; display: flex; align-items: center; gap: 12px;
            border-bottom: 0.5px dashed rgba(0,0,0,0.1); background: #fff;
        }

        /* 聊天气泡 */
        .bubble { max-width: 78%; padding: 12px 16px; border-radius: 20px; font-size: 15px; line-height: 1.5; margin-bottom: 12px; position: relative; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.8); color: #000; backdrop-filter: blur(10px); border: 0.5px solid #fff; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.8); color: #fff; backdrop-filter: blur(10px); border-bottom-left-radius: 4px; }
        .narration-text { align-self: center; color: #8e8e93; font-size: 13px; text-align: center; margin: 10px 0; max-width: 90%; }

        /* 详情半屏：VisionOS 风格 */
        .half-sheet-mask {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.2); z-index: 500; display: none; opacity: 0; transition: 0.3s;
        }
        .half-sheet {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(50px);
            border-top: 0.5px solid rgba(255,255,255,0.5); border-radius: 30px 30px 0 0;
            transform: translateY(100%); transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1); z-index: 600;
        }
        .half-sheet.active { transform: translateY(0); }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; }

        /* 2x4 预览框 */
        .bg-preview-box {
            width: 100%; height: 120px; border-radius: 12px; background: rgba(255,255,255,0.5);
            border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center;
            background-size: cover; background-position: center; font-size: 13px; color: #8e8e93;
        }

        /* 状态浮窗 (ᥫ᭡) */
        .status-popup {
            position: absolute; top: 95px; right: 15px; width: 220px;
            background: rgba(255, 255, 255, 0.45); backdrop-filter: blur(30px);
            border-radius: 20px; padding: 18px; z-index: 1000; display: none;
            border: 1px solid #fff; box-shadow: 0 8px 30px rgba(0,0,0,0.05);
        }
        
        /* 滑块定制 */
        .ios-slider { -webkit-appearance: none; width: 100%; height: 4px; background: #fff; border-radius: 2px; }
        .ios-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 20px; height: 20px; background: #000; border-radius: 50%; cursor: pointer; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 初始化与主结构 =====
window.openApp = function(appName) {
    injectAdvancedStyles();
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    const oldTitle = document.getElementById('appTitle');
    if (oldTitle) oldTitle.style.display = 'none'; // 删掉原有的“应用”字样

    appWindow.style.display = 'flex';
    appContent.style.padding = '0';
    appContent.innerHTML = `
        <div class="chat-root">
            <div class="glass-header">
                <span style="font-size:17px; font-weight:700;" id="centerTitle">聊天</span>
                <span id="backBtn" onclick="window.closeChatOverlay()" style="position:absolute; left:16px; bottom:12px; font-size:22px; cursor:pointer; display:none;"> < </span>
                <span id="rightAction" style="position:absolute; right:16px; bottom:12px; font-size:24px; cursor:pointer;">+</span>
            </div>
            
            <div class="scroll-body" id="chatBody"></div>

            <div class="glass-tabbar" id="mainTabBar">
                <div class="tab-btn active" onclick="window.navTo('chats', this)">聊天</div>
                <div class="tab-btn" onclick="window.navTo('contacts', this)">联系人</div>
                <div class="tab-btn" onclick="window.navTo('moments', this)">动态</div>
                <div class="tab-btn" onclick="window.navTo('me', this)">我的</div>
            </div>

            <!-- 挂载层 -->
            <div id="fullChatOverlay" style="position:absolute; top:0; left:0; width:100%; height:100%; display:none; flex-direction:column; z-index:200; background:#fdfdfd;"></div>
            <div id="sheetMask" class="half-sheet-mask" onclick="window.hideSheet()"></div>
            <div id="detailSheet" class="half-sheet"></div>
            <input type="file" id="imagePicker" style="display:none" accept="image/*">
        </div>
    `;
    window.navTo('chats');
};

// ===== 4. 导航逻辑 =====
window.navTo = function(tab, el) {
    const body = document.getElementById('chatBody');
    const title = document.getElementById('centerTitle');
    if (el) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }

    if (tab === 'chats') {
        title.innerText = "聊天";
        body.innerHTML = `
            <div style="padding:10px 0;">
                <div class="contact-item" onclick="window.enterChat('枝玉')">
                    <div style="width:50px; height:50px; border-radius:12px; background:#000; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">枝</div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span style="font-weight:700;">枝玉</span><span style="font-size:12px; color:#c7c7cc;">刚刚</span></div>
                        <div style="color:#8e8e93; font-size:13px;">你好，我是开发者枝玉。</div>
                    </div>
                </div>
            </div>
        `;
    } else if (tab === 'contacts') {
        title.innerText = "联系人";
        body.innerHTML = `
            <div class="contact-item">新的朋友 <span style="margin-left:auto; color:#ccc;">></span></div>
            <div style="background:#f2f2f7; padding:4px 16px; font-size:11px; color:#8e8e93;">Z</div>
            <div class="contact-item" onclick="window.enterChat('枝玉')">
                <div style="width:36px; height:36px; border-radius:4px; background:#000;"></div>
                <span style="font-weight:600;">枝玉</span>
            </div>
        `;
    } else if (tab === 'moments') {
        title.innerText = "";
        body.innerHTML = `<div style="padding:100px 20px; text-align:center; color:#ccc;">动态功能开发中...</div>`;
    } else if (tab === 'me') {
        title.innerText = "";
        body.innerHTML = `<div style="padding:100px 20px; text-align:center; color:#ccc;">我的功能开发中...</div>`;
    }
};

// ===== 5. 聊天界面逻辑 =====
window.enterChat = function(name) {
    const overlay = document.getElementById('fullChatOverlay');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="glass-header" id="chatHeader" style="background: rgba(242, 242, 247, 0.7);">
            <span onclick="window.closeChatOverlay()" style="position:absolute; left:16px; bottom:12px; font-size:22px; cursor:pointer;"> < </span>
            <div style="text-align:center; cursor:pointer;" onclick="window.showDetailSheet()">
                <div style="font-weight:700; font-size:17px;">${name}</div>
                <div id="chatStatus" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
            </div>
            <span onclick="window.toggleStatusPopup()" style="position:absolute; right:16px; bottom:12px; font-size:22px; cursor:pointer;">ᥫ᭡</span>
        </div>
        
        <div id="msgFlow" style="flex:1; overflow-y:auto; padding:20px 16px; display:flex; flex-direction:column; background-size:cover; background-position:center; background-image:url(${ChatConfig.chatBg});">
            <div class="narration-text">iMessage 加密对话</div>
        </div>

        <div id="inputBar" style="padding:10px 16px 30px; background:rgba(242, 242, 247, 0.8); backdrop-filter:blur(30px); border-top:0.5px solid rgba(0,0,0,0.05); display:flex; align-items:center; gap:12px;">
            <div style="width:28px; height:28px; border:1px solid #000; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;">+</div>
            <input type="text" id="wxInput" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.sendMessage()">
            <div style="font-size:22px; cursor:pointer;">∧</div>
            <div style="font-size:26px; cursor:pointer;" onclick="window.sendMessage()">+</div>
        </div>

        <div id="statusPopup" class="status-popup" onclick="this.style.display='none'">
            <div style="font-weight:800; font-size:15px; margin-bottom:10px;">窥视ta...</div>
            <div style="font-size:11px; color:#8e8e93;">心情</div><div style="font-size:13px;">期待</div><div style="border-bottom:0.5px dashed #ddd; margin:8px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">好感值</div><div style="font-size:13px;">85</div><div style="border-bottom:0.5px dashed #ddd; margin:8px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">当前动作</div><div style="font-size:13px;">查看对话框</div><div style="border-bottom:0.5px dashed #ddd; margin:8px 0;"></div>
            <div style="font-size:11px; color:#8e8e93;">内心想法</div><div style="font-size:13px;">希望回复让你满意</div>
        </div>
    `;
};

window.closeChatOverlay = () => { document.getElementById('fullChatOverlay').style.display = 'none'; };

window.sendMessage = () => {
    const input = document.getElementById('wxInput');
    const flow = document.getElementById('msgFlow');
    if (!input.value.trim()) return;

    const div = document.createElement('div');
    const isNar = input.value.startsWith('(') || input.value.startsWith('（');
    div.className = isNar ? 'narration-text' : 'bubble bubble-user';
    div.innerText = input.value;
    flow.appendChild(div);
    input.value = '';
    flow.scrollTop = flow.scrollHeight;
    
    window.useApi('online', 10);
};

// ===== 6. 详情面板逻辑 (Bottom Sheet) =====
window.showDetailSheet = function() {
    const sheet = document.getElementById('detailSheet');
    const mask = document.getElementById('sheetMask');
    mask.style.display = 'block';
    setTimeout(() => { mask.style.opacity = '1'; sheet.classList.add('active'); }, 10);

    const bgPreview = ChatConfig.chatBg ? `background-image:url(${ChatConfig.chatBg})` : '';

    sheet.innerHTML = `
        <div class="sheet-handle"></div>
        <div style="padding:0 25px 50px; overflow-y:auto; height:100%;" onscroll="handleSheetScroll(this)">
            <div style="font-size:20px; font-weight:800; margin:10px 0 20px;">聊天详情</div>
            
            <!-- API 面板 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px; border:1px solid #fff;">
                <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">API消耗面板</div>
                <div style="font-size:14px; line-height:2;">
                    <div style="display:flex; justify-content:space-between;"><span>全部点数</span> <span id="api-total-val" style="font-weight:700;">${ChatConfig.api.total}</span></div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; color:#555; margin-top:5px;">
                        <span>线上: ${ChatConfig.api.online}</span> <span>线下: ${ChatConfig.api.offline}</span>
                        <span>生图: ${ChatConfig.api.image}</span> <span>语音: ${ChatConfig.api.voice}</span>
                    </div>
                </div>
            </div>

            <!-- 搜索 -->
            <div style="margin-bottom:15px; position:relative;">
                <input type="text" placeholder="搜索聊天记录…" style="width:100%; border:none; background:#fff; padding:12px; border-radius:12px; outline:none;" oninput="window.doSearch(this.value)">
                <div id="searchRes" style="display:none; background:rgba(255,255,255,0.8); border-radius:12px; margin-top:5px; padding:10px; font-size:13px; color:#8e8e93;"></div>
            </div>

            <!-- 总结 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px; border:1px solid #fff;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="font-weight:600;">AI总结</span> <span id="sum-val" style="font-size:13px; color:#8e8e93;">50轮</span>
                </div>
                <input type="range" class="ios-slider" min="10" max="200" value="${ChatConfig.summaryCount}" oninput="window.updateSum(this.value)">
                <button style="width:100%; height:44px; background:#000; color:#fff; border:none; border-radius:12px; margin-top:15px; font-weight:700;" onclick="alert('总结已存入拾忆林')">手动总结</button>
            </div>

            <!-- 背景设置 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px; border:1px solid #fff;">
                <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">聊天背景设置</div>
                <div class="bg-preview-box" id="bgPreview" style="${bgPreview}" onclick="window.pickChatBg()">
                    ${!ChatConfig.chatBg ? '点击上传背景 (2x4)' : ''}
                </div>
                <button style="width:100%; height:44px; background:#ff3b30; color:#fff; border:none; border-radius:12px; margin-top:10px; font-weight:700;" onclick="window.clearChatBg()">清除背景图</button>
            </div>

            <!-- 旁白 & 人称 -->
            <div style="background:rgba(255,255,255,0.6); padding:16px; border-radius:18px; margin-bottom:15px; border:1px solid #fff;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span>线上聊天旁白</span>
                    <input type="checkbox" ${ChatConfig.isNarration ? 'checked' : ''} onchange="ChatConfig.isNarration=this.checked; localStorage.setItem('yujie_narration', this.checked)">
                </div>
                <div style="height:1px; background:rgba(0,0,0,0.05); margin:12px 0;"></div>
                <div style="font-size:11px; color:#8e8e93; margin-bottom:10px;">人称选择 (用于旁白)</div>
                <div style="display:flex; justify-content:space-around;">
                    <span onclick="window.setPronoun('我')" style="${ChatConfig.pronoun==='我'?'font-weight:700;color:#000':'color:#8e8e93'}">我</span>
                    <span onclick="window.setPronoun('你')" style="${ChatConfig.pronoun==='你'?'font-weight:700;color:#000':'color:#8e8e93'}">你</span>
                    <span onclick="window.setPronoun('ta')" style="${ChatConfig.pronoun==='ta'?'font-weight:700;color:#000':'color:#8e8e93'}">ta</span>
                </div>
            </div>

            <!-- 危险区 (危险区折叠逻辑) -->
            <div style="padding:16px; border-radius:18px; border:1px solid #ffd6d6; background:#fff5f5;" onclick="window.toggleDangerZone()">
                <div style="display:flex; justify-content:space-between; color:#ff3b30; font-weight:700;">
                    <span>危险区</span> <span id="dangerArrow">></span>
                </div>
                <div id="dangerZone" style="display:none; margin-top:15px; flex-direction:column; gap:10px;">
                    <button style="width:100%; padding:12px; border:1px solid #ff3b30; background:#fff; color:#ff3b30; border-radius:10px;" onclick="alert('清空成功')">清空聊天记录</button>
                    <button style="width:100%; padding:12px; border:none; background:#000; color:#fff; border-radius:10px;">拉黑联系人</button>
                </div>
            </div>
        </div>
    `;
};

window.hideSheet = () => {
    const sheet = document.getElementById('detailSheet');
    const mask = document.getElementById('sheetMask');
    sheet.classList.remove('active');
    mask.style.opacity = '0';
    setTimeout(() => { mask.style.display = 'none'; }, 300);
};

// 功能函数
window.updateSum = (v) => { ChatConfig.summaryCount = v; document.getElementById('sum-val').innerText = v + '轮'; };
window.setPronoun = (p) => { ChatConfig.pronoun = p; localStorage.setItem('yujie_pronoun', p); window.showDetailSheet(); };
window.toggleDangerZone = () => {
    const dz = document.getElementById('dangerZone');
    const arrow = document.getElementById('dangerArrow');
    dz.style.display = dz.style.display === 'none' ? 'flex' : 'none';
    arrow.innerText = dz.style.display === 'none' ? '>' : '∨';
};

window.pickChatBg = () => {
    const p = document.getElementById('imagePicker');
    p.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const r = new FileReader();
            r.onload = (ev) => {
                const data = ev.target.result;
                ChatConfig.chatBg = data;
                localStorage.setItem('yujie_chat_bg', data);
                document.getElementById('bgPreview').style.backgroundImage = `url(${data})`;
                document.getElementById('bgPreview').innerText = '';
                const flow = document.getElementById('msgFlow');
                if(flow) flow.style.backgroundImage = `url(${data})`;
            };
            r.readAsDataURL(file);
        }
    };
    p.click();
};

window.clearChatBg = () => {
    ChatConfig.chatBg = '';
    localStorage.removeItem('yujie_chat_bg');
    document.getElementById('bgPreview').style.backgroundImage = '';
    document.getElementById('bgPreview').innerText = '点击上传背景 (2x4)';
    const flow = document.getElementById('msgFlow');
    if(flow) flow.style.backgroundImage = '';
};

window.doSearch = (val) => {
    const res = document.getElementById('searchRes');
    if(!val) { res.style.display = 'none'; return; }
    res.style.display = 'block';
    res.innerHTML = `<div style="background:rgba(0,0,0,0.03); padding:8px; border-radius:8px;">搜索结果："${val}" 相关内容</div>`;
};

window.toggleStatusPopup = () => {
    const p = document.getElementById('statusPopup');
    p.style.display = p.style.display === 'block' ? 'none' : 'block';
};
