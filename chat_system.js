/* 
 * 玉界 - 聊天系统增强插件 (chat_system.js)
 * 核心逻辑：完全重写聊天、联系人、动态、我的
 * UI风格：iOS iMessage / 液态玻璃 / 黑白极简
 */

// ===== 1. 全局配置与状态管理 =====
const ChatConfig = {
    userAvatar: '',
    userName: '用户',
    walletBalance: 5200.00,
    activeChatId: 'dev1',
    messages: {}, // 存储消息记录 { chatId: [] }
    contacts: [
        { id: 'dev1', name: '枝玉', bio: '你好，我是开发者枝玉。', avatar: '枝', status: 'online' }
    ],
    moments: [],
    settings: {
        replyCount: [1, 3], // [min, max]
        showNarration: true,
        pronoun: '我', // 我, 你, ta
        globalWallpaper: ''
    }
};

// ===== 2. 注入专用CSS样式 =====
const style = document.createElement('style');
style.innerHTML = `
/* 移除所有默认emoji，使用纯黑符号 */
.no-emoji { font-family: sans-serif; }

/* 气泡样式：iMessage风格 */
.msg-bubble {
    max-width: 75%; padding: 10px 16px; border-radius: 20px; font-size: 15px; 
    line-height: 1.4; position: relative; margin-bottom: 8px; transition: transform 0.2s;
}
/* 助手气泡：黑色液态玻璃 + 白色文字 */
.msg-assistant {
    align-self: flex-start; background: rgba(0, 0, 0, 0.85); color: #fff;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom-left-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
/* 用户气泡：白色液态玻璃 + 黑色文字 */
.msg-user {
    align-self: flex-end; background: rgba(255, 255, 255, 0.7); color: #000;
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8); border-bottom-right-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
/* 旁白样式：无气泡居中 */
.msg-narration {
    align-self: center; color: #8e8e93; font-size: 13px; text-align: center;
    margin: 12px 0; max-width: 90%; background: none !important; backdrop-filter: none !important; box-shadow: none !important;
}

/* 顶部半窗设置面板 (Liquid Glass) */
.half-panel {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(255, 255, 255, 0.3); backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px); z-index: 100; transform: translateY(100%);
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    display: flex; flex-direction: column; overflow: hidden;
}
.half-panel.active { transform: translateY(0); }
.half-panel-handle { width: 40px; height: 5px; background: rgba(0,0,0,0.1); border-radius: 3px; margin: 12px auto; }

/* 底部标签栏 - 纯文字 */
.chat-tab-bar {
    height: 60px; display: flex; justify-content: space-around; align-items: center;
    background: rgba(242, 242, 247, 0.8); backdrop-filter: blur(20px); border-top: 0.5px solid rgba(0,0,0,0.1);
}
.chat-tab-item { font-size: 14px; font-weight: 500; color: #8e8e93; cursor: pointer; }
.chat-tab-item.active { color: #000; font-weight: 700; }

/* 状态窥视浮窗 */
.status-peek {
    position: absolute; top: 60px; right: 20px; width: 220px;
    background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(255,255,255,0.8);
    backdrop-filter: blur(25px); border-radius: 20px; padding: 15px; z-index: 150;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: none;
}
.status-row { padding: 8px 0; border-bottom: 0.5px dashed rgba(0,0,0,0.1); }
.status-row:last-child { border-bottom: none; }
.status-label { font-size: 11px; color: #8e8e93; margin-bottom: 4px; }
.status-value { font-size: 13px; color: #000; font-weight: 500; }

/* 按钮风格 */
.btn-black { background: #000; color: #fff; border: none; border-radius: 10px; padding: 10px; cursor: pointer; }
.btn-white { background: #fff; color: #000; border: 1px solid #e5e5ea; border-radius: 10px; padding: 10px; cursor: pointer; }
`;
document.head.appendChild(style);

// ===== 3. 初始化功能与路由覆盖 =====

// 覆盖原 openApp 中的聊天逻辑
window.openApp = function(appName) {
    const appWindow = document.getElementById('genericAppWindow');
    const appContent = document.getElementById('appContent');
    const appTitle = document.getElementById('appTitle');
    
    appWindow.style.display = 'flex';
    appContent.innerHTML = ''; // 清空内容
    appContent.style.padding = '0';
    appContent.style.display = 'flex';
    appContent.style.flexDirection = 'column';
    appContent.style.height = '100%';

    if (appName === 'chat') {
        renderChatContainer(appContent);
    } else {
        appContent.innerHTML = `<div style="padding:100px 20px; text-align:center; color:#8e8e93;">${appName} 正在建设中...</div>`;
    }
};

// 渲染聊天主容器
function renderChatContainer(container) {
    container.innerHTML = `
        <div id="chatMainWrap" style="flex:1; display:flex; flex-direction:column; overflow:hidden; position:relative;">
            <div id="chatHeader" style="height:50px; display:flex; justify-content:space-between; align-items:center; padding:0 16px; border-bottom:0.5px solid rgba(0,0,0,0.1);">
                <span style="font-size:18px; font-weight:700;" id="chatNavTitle">聊天</span>
                <span style="font-size:24px; cursor:pointer;" onclick="showAddMenu()">+</span>
            </div>
            
            <div id="chatViewArea" style="flex:1; overflow-y:auto; background:#f2f2f7;"></div>

            <div class="chat-tab-bar" id="chatTabBar">
                <div class="chat-tab-item active" onclick="switchTab('chats')">聊天</div>
                <div class="chat-tab-item" onclick="switchTab('contacts')">联系人</div>
                <div class="chat-tab-item" onclick="switchTab('moments')">动态</div>
                <div class="chat-tab-item" onclick="switchTab('me')">我的</div>
            </div>
        </div>

        <!-- 角色状态窥视浮窗 -->
        <div id="statusPeek" class="status-peek" onclick="this.style.display='none'">
            <div style="font-size:14px; font-weight:700; margin-bottom:10px;">窥视ta...</div>
            <div class="status-row">
                <div class="status-label">心情</div>
                <div class="status-value" id="peek-mood">平静</div>
            </div>
            <div class="status-row">
                <div class="status-label">好感值</div>
                <div class="status-value" id="peek-fav">0</div>
            </div>
            <div class="status-row">
                <div class="status-label">当前动作</div>
                <div class="status-value" id="peek-action">静止</div>
            </div>
            <div class="status-row">
                <div class="status-label">内心想法</div>
                <div class="status-value" id="peek-thought">无</div>
            </div>
        </div>
    `;
    switchTab('chats');
}

// 标签切换逻辑
window.switchTab = function(tab) {
    const view = document.getElementById('chatViewArea');
    const title = document.getElementById('chatNavTitle');
    const tabs = document.querySelectorAll('.chat-tab-item');
    
    tabs.forEach(t => t.classList.remove('active'));
    if (tab === 'chats') {
        title.innerText = '聊天';
        tabs[0].classList.add('active');
        renderConversationList(view);
    } else if (tab === 'contacts') {
        title.innerText = '联系人';
        tabs[1].classList.add('active');
        renderContactsList(view);
    } else if (tab === 'moments') {
        title.innerText = '动态';
        tabs[2].classList.add('active');
        renderMomentsFeed(view);
    } else if (tab === 'me') {
        title.innerText = '我的';
        tabs[3].classList.add('active');
        renderMePage(view);
    }
};

// ===== 4. 模块：会话列表页 =====
function renderConversationList(container) {
    container.innerHTML = `
        <div style="padding:10px 0;">
            ${ChatConfig.contacts.map(c => `
                <div class="ios-row" style="background:#fff; margin-bottom:1px; padding:12px 16px; display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="enterSingleChat('${c.id}')">
                    <div style="width:50px; height:50px; border-radius:12px; background:#000; color:#fff; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:700;">${c.avatar}</div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                            <span style="font-weight:600;">${c.name}</span>
                            <span style="font-size:12px; color:#8e8e93;">刚刚</span>
                        </div>
                        <div style="font-size:13px; color:#8e8e93; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.bio}</div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ===== 5. 模块：单聊窗口页 (核心) =====
window.enterSingleChat = function(chatId) {
    const contact = ChatConfig.contacts.find(c => c.id === chatId);
    const mainWrap = document.getElementById('chatMainWrap');
    
    const chatDetailHTML = `
        <div id="singleChatWindow" style="position:absolute; top:0; left:0; width:100%; height:100%; background:#f2f2f7; z-index:50; display:flex; flex-direction:column;">
            <div style="height:50px; display:flex; justify-content:space-between; align-items:center; padding:0 16px; background:rgba(255,255,255,0.8); backdrop-filter:blur(20px); border-bottom:0.5px solid rgba(0,0,0,0.1);">
                <span onclick="exitSingleChat()" style="cursor:pointer; color:#000; font-size:18px;"> < </span>
                <div style="text-align:center;" onclick="toggleChatDetails()">
                    <div id="chattingName" style="font-weight:700; font-size:16px;">${contact.name}</div>
                    <div id="chattingStatus" style="font-size:10px; color:#8e8e93; display:none;">输入中…</div>
                </div>
                <div style="display:flex; gap:15px; align-items:center;">
                    <span style="font-size:20px; cursor:pointer;" onclick="togglePeekStatus()">ᥫ᭡</span>
                    <span style="font-size:18px; font-weight:700; cursor:pointer;" onclick="toggleChatDetails()"> > </span>
                </div>
            </div>

            <div id="chatBox" style="flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:8px;">
                <!-- 消息内容 -->
            </div>

            <!-- 输入区域 -->
            <div style="padding:10px 16px 24px; background:#f2f2f7; border-top:0.5px solid rgba(0,0,0,0.1); display:flex; align-items:center; gap:10px;">
                <div style="width:28px; height:28px; border:1px solid #000; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="toggleAddons()">+</div>
                <input type="text" id="chatMsgInput" style="flex:1; border:none; background:#fff; border-radius:18px; padding:10px 14px; outline:none;" placeholder="输入消息…" onkeypress="if(event.key==='Enter') performSend()">
                <div style="font-size:22px; cursor:pointer;" onclick="alert('语音输入模式')">∧</div>
                <div id="sendBtn" style="font-size:22px; color:#000; cursor:pointer; transform:rotate(45deg);" onclick="performSend()">+</div>
            </div>

            <!-- 详情设置半窗 -->
            <div id="chatDetailsPanel" class="half-panel">
                <div class="half-panel-handle" onclick="toggleChatDetails()"></div>
                <div style="flex:1; overflow-y:auto; padding:20px;">
                    <div style="font-size:18px; font-weight:700; margin-bottom:20px;">聊天详情</div>
                    
                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:18px; margin-bottom:15px;">
                        <div style="color:#8e8e93; font-size:12px; margin-bottom:10px;">API消耗详情</div>
                        <div style="display:flex; flex-direction:column; gap:8px; font-size:14px;">
                            <span>全部点数：1200</span>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                <span>线上聊天：100</span>
                                <span>线下聊天：50</span>
                                <span>生成图片：200</span>
                                <span>语音：20</span>
                            </div>
                        </div>
                    </div>

                    <div style="margin-bottom:15px;">
                        <input type="text" placeholder="此处可搜索聊天记录…" style="width:100%; border:none; background:#fff; padding:12px; border-radius:10px;">
                    </div>

                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:18px; margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>自动总结 (50轮)</span>
                            <input type="range" min="10" max="100" value="50" style="width:100px;">
                        </div>
                        <button class="btn-black" style="width:100%; margin-top:10px;">手动立即总结</button>
                    </div>

                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:18px; margin-bottom:15px;">
                        <div style="color:#8e8e93; font-size:12px; margin-bottom:10px;">聊天背景更改</div>
                        <div style="width:100%; height:80px; border:1px dashed #ccc; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#ccc;" onclick="alert('调取图库')">点击添加</div>
                        <button class="btn-black" style="width:100%; margin-top:10px;">清除当前背景</button>
                    </div>

                    <div style="background:rgba(255,255,255,0.8); padding:15px; border-radius:18px; margin-bottom:15px;">
                        <span>线上聊天旁白</span>
                        <input type="checkbox" checked style="float:right;">
                    </div>

                    <div class="ios-group">
                        <div class="ios-row" onclick="toggleSection('danger-chat')">
                            <span style="color:#ff3b30;">危险区</span>
                            <span> v </span>
                        </div>
                        <div id="danger-chat" style="padding:10px; display:none;">
                            <button class="btn-white" style="width:100%; color:#ff3b30; margin-bottom:8px;">清空聊天记录</button>
                            <button class="btn-black" style="width:100%; margin-bottom:8px;">拉黑联系人</button>
                            <button class="btn-white" style="width:100%;">删除联系人</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    mainWrap.insertAdjacentHTML('beforeend', chatDetailHTML);
    setTimeout(() => {
        document.getElementById('singleChatWindow').style.display = 'flex';
    }, 10);
};

window.exitSingleChat = function() {
    const win = document.getElementById('singleChatWindow');
    if (win) win.remove();
};

window.toggleChatDetails = function() {
    const panel = document.getElementById('chatDetailsPanel');
    panel.classList.toggle('active');
};

window.togglePeekStatus = function() {
    const peek = document.getElementById('statusPeek');
    peek.style.display = peek.style.display === 'block' ? 'none' : 'block';
};

// 发送消息
window.performSend = async function() {
    const input = document.getElementById('chatMsgInput');
    const text = input.value.trim();
    if (!text) return;

    // 添加消息到界面
    appendMessageToBox('user', text);
    input.value = '';

    // 显示“输入中…”
    document.getElementById('chattingStatus').style.display = 'block';
    document.getElementById('chattingName').style.display = 'none';

    // 调用 API
    await handleBotResponse(text);
};

function appendMessageToBox(role, text) {
    const box = document.getElementById('chatBox');
    const msgDiv = document.createElement('div');
    
    // 判断是否为旁白
    const isNarration = text.startsWith('(') || text.startsWith('（');
    
    if (isNarration) {
        msgDiv.className = 'msg-bubble msg-narration';
        msgDiv.innerText = text;
    } else {
        msgDiv.className = `msg-bubble msg-${role}`;
        msgDiv.innerText = text;
        
        // 长按/右键菜单
        msgDiv.oncontextmenu = (e) => {
            e.preventDefault();
            showMsgMenu(msgDiv, text, role);
        };
    }
    
    box.appendChild(msgDiv);
    box.scrollTop = box.scrollHeight;
}

// 模拟 API 响应逻辑
async function handleBotResponse(userText) {
    const baseUrl = localStorage.getItem('main_api_base_url');
    const apiKey = localStorage.getItem('main_api_key');
    const model = localStorage.getItem('main_api_model');

    if (!baseUrl || !apiKey || !model) {
        appendMessageToBox('system', '错误：API未配置');
        return;
    }

    try {
        const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: `你是角色，严禁超20字，禁止emoji。结尾必须带JSON：{"mood":"心情","favorability":50,"action":"动作","thought":"想法"}` },
                    { role: 'user', content: userText }
                ]
            })
        });

        const data = await response.json();
        document.getElementById('chattingStatus').style.display = 'none';
        document.getElementById('chattingName').style.display = 'block';

        if (data.choices && data.choices[0]) {
            let content = data.choices[0].message.content;
            
            // 解析状态 JSON
            const jsonMatch = content.match(/\{.*\}/);
            if (jsonMatch) {
                try {
                    const status = JSON.parse(jsonMatch[0]);
                    document.getElementById('peek-mood').innerText = status.mood;
                    document.getElementById('peek-fav').innerText = status.favorability;
                    document.getElementById('peek-action').innerText = status.action;
                    document.getElementById('peek-thought').innerText = status.thought;
                    content = content.replace(jsonMatch[0], '').trim();
                } catch(e) {}
            }
            
            appendMessageToBox('assistant', content);
        }
    } catch (e) {
        document.getElementById('chattingStatus').style.display = 'none';
        document.getElementById('chattingName').style.display = 'block';
        appendMessageToBox('system', '连接失败');
    }
}

// 消息菜单
function showMsgMenu(el, text, role) {
    const reason = prompt("1. 复制\n2. 收藏\n3. 重回\n4. 多选\n5. 引用\n请输入数字：");
    if (reason === '1') {
        navigator.clipboard.writeText(text);
        alert('已复制');
    } else if (reason === '3' && role === 'assistant') {
        const hint = prompt("请输入重回原因或发展方向(可选)：");
        el.remove();
        handleBotResponse("系统：重回上一次对话。" + (hint ? "用户提示：" + hint : ""));
    }
}

// ===== 6. 模块：动态 (Moments) =====
function renderMomentsFeed(container) {
    container.innerHTML = `
        <div style="background:#fff; height:200px; position:relative; background-size:cover; background-image:url('https://via.placeholder.com/400x200');">
            <div style="position:absolute; right:15px; bottom:-20px; display:flex; align-items:flex-end; gap:10px;">
                <span style="color:#fff; font-weight:700; text-shadow:0 1px 3px rgba(0,0,0,0.5); margin-bottom:25px;">${ChatConfig.userName}</span>
                <div style="width:70px; height:70px; background:#eee; border-radius:10px; border:3px solid #fff;"></div>
            </div>
        </div>
        <div style="margin-top:40px; padding:20px;">
            <div style="display:flex; gap:10px; margin-bottom:30px;">
                <div style="width:40px; height:40px; border-radius:5px; background:#000;"></div>
                <div style="flex:1;">
                    <div style="color:#576b95; font-weight:700; margin-bottom:5px;">枝玉</div>
                    <div style="font-size:15px; margin-bottom:10px;">今日代码大功告成。</div>
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; width:70%;">
                        <div style="aspect-ratio:1; background:#eee;"></div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#8e8e93; display:flex; justify-content:space-between;">
                        <span>刚刚</span>
                        <span style="background:#f2f2f7; padding:0 8px; border-radius:4px; color:#576b95; font-weight:700; cursor:pointer;">..</span>
                    </div>
                </div>
            </div>
            <div style="text-align:center; color:#cecece; font-size:12px; padding:20px;">动态到底了</div>
        </div>
    `;
}

// ===== 7. 模块：联系人 (Contacts) =====
function renderContactsList(container) {
    container.innerHTML = `
        <div style="background:#fff;">
            <div class="ios-row" style="padding:15px 16px;">
                <span style="font-weight:600;">新的朋友</span>
                <span style="float:right; color:#8e8e93;"> > </span>
            </div>
            <div style="background:#f2f2f7; padding:5px 16px; font-size:12px; color:#8e8e93;">A</div>
            ${ChatConfig.contacts.map(c => `
                <div class="ios-row" style="padding:12px 16px; display:flex; align-items:center; gap:12px;">
                    <div style="width:36px; height:36px; border-radius:6px; background:#000; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">${c.avatar}</div>
                    <span style="font-weight:500;">${c.name}</span>
                </div>
            `).join('')}
        </div>
        <!-- 侧边索引 -->
        <div style="position:fixed; right:5px; top:150px; display:flex; flex-direction:column; gap:2px; font-size:10px; font-weight:700; color:#555;">
            <span>↑</span><span>☆</span><span>A</span><span>B</span><span>C</span><span>D</span><span>Z</span><span>#</span>
        </div>
    `;
}

// ===== 8. 模块：我的 (Me) =====
function renderMePage(container) {
    container.innerHTML = `
        <div style="background:#fff; padding:40px 20px 30px; display:flex; flex-direction:column; align-items:center; border-bottom:0.5px solid #eee;">
            <div style="width:80px; height:80px; background:#f2f2f7; border-radius:15px; margin-bottom:15px; display:flex; align-items:center; justify-content:center; font-size:30px; color:#ccc;">+</div>
            <div style="font-size:22px; font-weight:700;">${ChatConfig.userName}</div>
        </div>
        <div style="margin-top:10px;">
            <div class="ios-group">
                <div class="ios-row" onclick="renderWallet()">
                    <span>服务</span>
                    <span style="color:#8e8e93;"> > </span>
                </div>
            </div>
            <div class="ios-group">
                <div class="ios-row"><span>收藏</span> <span style="color:#8e8e93;"> > </span></div>
                <div class="ios-row"><span>表情包</span> <span style="color:#8e8e93;"> > </span></div>
                <div class="ios-row"><span>设置</span> <span style="color:#8e8e93;"> > </span></div>
            </div>
        </div>
    `;
}

function renderWallet() {
    const view = document.getElementById('chatViewArea');
    view.innerHTML = `
        <div style="padding:16px;">
            <div style="height:50px; display:flex; align-items:center; margin-bottom:10px;" onclick="switchTab('me')"> < 返回</div>
            <div style="background:rgba(0,0,0,0.85); backdrop-filter:blur(20px); border-radius:24px; padding:30px; color:#fff; box-shadow:0 10px 30px rgba(0,0,0,0.2);">
                <div style="font-size:14px; opacity:0.6; margin-bottom:5px;">钱包余额</div>
                <div style="font-size:40px; font-weight:700; margin-bottom:20px; border-bottom:0.5px solid rgba(255,255,255,0.1); padding-bottom:15px;">
                    ${ChatConfig.walletBalance.toFixed(2)}
                </div>
                <div style="font-size:12px; display:flex; gap:20px;">
                    <span>充值记录</span>
                    <span>消耗记录</span>
                </div>
            </div>
            <button class="btn-black" style="width:100%; margin-top:20px; height:50px;" onclick="addMoney()">充值金额</button>
        </div>
    `;
}

window.addMoney = function() {
    const amount = prompt("请输入充值金额：");
    if (amount && !isNaN(amount)) {
        ChatConfig.walletBalance += parseFloat(amount);
        renderWallet();
    }
};

console.log("玉界聊天系统已就绪。");
