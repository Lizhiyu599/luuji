/**
 * 玉界 - 顶级全功能沉浸式交互系统 (Bug 修复 + 心理状态窗归位)
 * 修复：下拉死机 Bug、手势误触、互斥逻辑
 */

// ===== 1. 核心数据与状态 =====
window.ChatConfig = {
    userAvatar: localStorage.getItem('yujie_user_avatar') || '',
    chatBg: localStorage.getItem('yujie_chat_bg') || '',
    apiStats: { total: parseInt(localStorage.getItem('api_total') || 0) },
    // 心理状态 (实时刷新)
    mental: { mood: "静谧", favorability: 85, action: "正在思考", thought: "希望能完美解决宝宝的反馈。" },
    contacts: [{ id: 'c1', name: '枝玉', avatar: '枝', bio: '你好，我是开发者枝玉。' }]
};

// ===== 2. 样式注入 (含状态窗与手势优化) =====
const injectFinalStyle = () => {
    if (document.getElementById('yujie-final-css')) return;
    const s = document.createElement('style');
    s.id = 'yujie-final-css';
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
        .nav-back { position: absolute; left: 16px; font-size: 24px; font-weight: 300; cursor: pointer; color:#000; }
        .nav-title { font-size: 16px; font-weight: 600; cursor: pointer; }
        .nav-mental-btn { position: absolute; right: 16px; font-size: 20px; cursor: pointer; color: #000; }

        /* 心理状态浮窗 (○) */
        .mental-popup {
            position: absolute; top: 75px; right: 15px; width: 220px;
            background: rgba(255, 255, 255, 0.5); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.7); border-radius: 20px; padding: 16px;
            z-index: 550; display: none; box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }
        .mental-title { font-weight: 800; font-size: 15px; margin-bottom: 10px; color: #000; }
        .mental-label { font-size: 11px; color: #8e8e93; margin-bottom: 2px; }
        .mental-value { font-size: 13px; color: #000; margin-bottom: 8px; }
        .mental-divider { border-bottom: 0.5px dashed rgba(0,0,0,0.1); margin-bottom: 10px; }

        /* 半屏详情 */
        .sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.1); z-index: 600; display: none; }
        .half-sheet {
            position: absolute; bottom: 0; width: 100%; height: 85%;
            background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(45px);
            border-radius: 30px 30px 0 0; transform: translateY(100%); 
            transition: transform 0.4s cubic-bezier(0.2, 1, 0.3, 1);
            border-top: 0.5px solid rgba(255,255,255,0.5); z-index: 650;
        }
        .half-sheet.dragging { transition: none !important; }
        .sheet-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; cursor: grab; }

        /* 气泡与输入框 */
        .bubble { max-width: 75%; padding: 12px 16px; border-radius: 20px; font-size: 15px; margin-bottom: 12px; }
        .bubble-user { align-self: flex-end; background: rgba(255,255,255,0.85); color:#000; border-bottom-right-radius: 4px; }
        .bubble-assistant { align-self: flex-start; background: rgba(0,0,0,0.75); color:#fff; border-bottom-left-radius: 4px; }
        .chat-footer { height: 60px; display: flex; align-items: center; padding: 0 16px 20px; background: rgba(255,255,255,0.4); backdrop-filter: blur(30px); border-top: 0.5px solid rgba(0,0,0,0.05); gap: 12px; }
    `;
    document.head.appendChild(s);
};

// ===== 3. 手势与键盘逻辑 (修复重写) =====
let dragY = 0;
let isDragging = false;

window.initGesture = (sheet) => {
    const handle = sheet.querySelector('.sheet-handle');
    
    // 只有按住 handle 才能拖拽
    handle.addEventListener('touchstart', (e) => {
        dragY = e.touches[0].clientY;
        isDragging = true;
        sheet.classList.add('dragging');
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        let delta = e.touches[0].clientY - dragY;
        if (delta > 0) {
            sheet.style.transform = `translateY(${delta}px)`;
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        sheet.classList.remove('dragging');
        let delta = e.changedTouches[0].clientY - dragY;
        
        if (delta > 150) {
            window.toggleSheet(false); // 下拉关闭
        } else {
            sheet.style.transform = `translateY(0)`; // 弹回
        }
    });
};

// 键盘自适应
if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
        const shell = document.querySelector('.chat-shell');
        if(shell) shell.style.height = window.visualViewport.height + 'px';
    });
}

// ===== 4. 功能函数 (修复死机 Bug) =====
window.toggleSheet = (show) => {
    const mask = document.getElementById('sheetMask');
    const sheet = document.getElementById('detailSheet');
    if (!sheet) return;

    if (show) {
        // 打开时，先关掉心理状态窗口
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
            // 重要：彻底清除内联样式，防止下次无法开启
            sheet.style.transform = '';
        }, 400);
    }
};

window.toggleMental = (show) => {
    const pop = document.getElementById('mentalPopup');
    if (show === undefined) {
        pop.style.display = (pop.style.display === 'block' ? 'none' : 'block');
    } else {
        pop.style.display = (show ? 'block' : 'none');
    }
};

// ===== 5. 核心渲染 =====
window.openApp = function(appName) {
    if (appName !== 'chat') return;
    injectFinalStyle();
    document.body.classList.add('chat-active');
    const appContent = document.getElementById('appContent');
    const appWindow = document.getElementById('genericAppWindow');
    appWindow.style.display = 'flex';

    appContent.innerHTML = `
        <div class="chat-shell">
            <nav class="chat-nav">
                <div class="nav-status"></div>
                <div class="nav-body">
                    <span class="nav-back" onclick="window.closeWhole()">‹</span>
                    <span class="nav-title" onclick="window.navTo('chats')">聊天</span>
                </div>
            </nav>
            <main id="mainBody" style="flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; background:#fff;"></main>
            <footer style="height:60px; display:flex; justify-content:space-around; align-items:center; background:rgba(255,255,255,0.7); backdrop-filter:blur(30px); border-top:0.5px solid rgba(0,0,0,0.05);">
                <div onclick="window.navTo('chats')" style="font-weight:700; cursor:pointer;">聊天</div>
                <div onclick="window.navTo('contacts')" style="color:#8e8e93; cursor:pointer;">联系人</div>
                <div onclick="window.navTo('moments')" style="color:#8e8e93; cursor:pointer;">动态</div>
                <div onclick="window.navTo('me')" style="color:#8e8e93; cursor:pointer;">我的</div>
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
        <header class="chat-nav" style="background:rgba(255,255,255,0.4);">
            <div class="nav-status"></div>
            <div class="nav-body">
                <span class="nav-back" onclick="window.closeChat()">‹</span>
                <span class="nav-title" onclick="window.toggleSheet(true)">${name}</span>
                <span class="nav-mental-btn" onclick="window.toggleMental()">○</span>
            </div>
        </header>

        <div id="chatFlow" style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; background-image:url(${ChatConfig.chatBg}); background-size:cover; background-position:center;"></div>

        <!-- 心理状态浮窗 (○) -->
        <div id="mentalPopup" class="mental-popup" onclick="window.toggleMental(false)">
            <div class="mental-title">窥视ta...</div>
            <div class="mental-label">心情</div><div class="mental-value">${ChatConfig.mental.mood}</div><div class="mental-divider"></div>
            <div class="mental-label">好感值</div><div class="mental-value">${ChatConfig.mental.favorability}</div><div class="mental-divider"></div>
            <div class="mental-label">当前动作</div><div class="mental-value">${ChatConfig.mental.action}</div><div class="mental-divider"></div>
            <div class="mental-label">内心想法</div><div class="mental-value">${ChatConfig.mental.thought}</div>
        </div>

        <div class="chat-footer">
            <div style="width:28px; height:28px; border:1px solid #8e8e93; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#8e8e93; cursor:pointer;" onclick="alert('功能区')">+</div>
            <input type="text" id="chatInp" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') window.send()">
            <div style="font-size:26px; cursor:pointer;" onclick="window.send()">+</div>
        </div>

        <div class="sheet-mask" id="sheetMask" onclick="window.toggleSheet(false)">
            <div class="half-sheet" id="detailSheet" onclick="event.stopPropagation()">
                <div class="sheet-handle"></div>
                <div style="padding:0 24px 40px; overflow-y:auto; height:calc(100% - 40px);">
                    <div style="font-size:20px; font-weight:800; margin-bottom:20px;">聊天详情</div>
                    <div style="background:rgba(255,255,255,0.4); border-radius:18px; padding:18px; margin-bottom:15px;">
                        <div style="color:#8e8e93; font-size:11px; margin-bottom:10px;">API 统计</div>
                        <div style="font-weight:700;">总点数: <span id="api-disp">${ChatConfig.apiStats.total}</span></div>
                    </div>
                    <!-- 这里可以放你之前的 2x4 背景预览、人称开关、危险区等 -->
                    <div style="height:100px; border:2px dashed #ccc; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#ccc;" onclick="alert('图库')">背景预览 2x4</div>
                    <button style="width:100%; padding:15px; border:none; background:#000; color:#fff; border-radius:15px; margin-top:20px;" onclick="window.toggleSheet(false)">返回聊天</button>
                </div>
            </div>
        </div>
    `;
    window.initGesture(document.getElementById('detailSheet'));
};

window.send = function() {
    const input = document.getElementById('chatInp');
    const text = input.value.trim();
    if (!text) return;
    const flow = document.getElementById('chatFlow');
    const div = document.createElement('div');
    div.className = 'bubble bubble-user';
    div.innerText = text;
    flow.appendChild(div);
    input.value = '';
    flow.scrollTop = flow.scrollHeight;

    // 模拟点数增加与心理刷新
    ChatConfig.apiStats.total += 10;
    if(document.getElementById('api-disp')) document.getElementById('api-disp').innerText = ChatConfig.apiStats.total;
};

// 通用关闭
window.closeChat = () => document.getElementById('chatOverlay').style.display = 'none';
window.closeWhole = () => { document.body.classList.remove('chat-active'); document.getElementById('genericAppWindow').style.display = 'none'; };

// 点击浮窗外关闭处理
window.addEventListener('click', (e) => {
    const pop = document.getElementById('mentalPopup');
    const btn = document.querySelector('.nav-mental-btn');
    if (pop && pop.style.display === 'block' && !pop.contains(e.target) && e.target !== btn) {
        window.toggleMental(false);
    }
});

console.log("玉界：Bug 修复版已就绪，状态窗 ○ 归位。");                    
