window.App = window.App || {};
App.settings = {
  api: {},
  theme: {},
  font: {},
  wallpaper: null
};

// =======================
// ① 液态玻璃统一UI
// =======================
function glass(el) {
  el.style.background = "rgba(255,255,255,0.12)";
  el.style.backdropFilter = "blur(18px)";
  el.style.borderRadius = "18px";
  el.style.padding = "12px";
}

// =======================
// ② 三点加载动画
// =======================
function createLoading() {
  const box = document.createElement("div");
  box.innerHTML = `
    <div class="loading-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  return box;
}

// =======================
// CSS动画注入（只执行一次）
// =======================
(function () {
  const style = document.createElement("style");
  style.innerHTML = `
  .loading-dots{display:flex;gap:8px;align-items:center;}
  .loading-dots span{
    width:10px;height:10px;border-radius:50%;
    background:#999;
    animation:bounce 1.2s infinite ease-in-out;
  }
  .loading-dots span:nth-child(2){animation-delay:0.2s;}
  .loading-dots span:nth-child(3){animation-delay:0.4s;}
  @keyframes bounce{
    0%,100%{transform:translateY(0) scale(0.7);opacity:0.4;}
    50%{transform:translateY(-6px) scale(1);opacity:1;}
  }
  `;
  document.head.appendChild(style);
})();

// =======================
// ③ 连接测试逻辑（通用版）
// =======================
App.settings.testConnection = function (btn, output) {
  btn.style.display = "none";

  let done = false;
  output.innerHTML = "";
  output.appendChild(createLoading());

  // 模拟请求成功
  const request = setTimeout(() => {
    done = true;
    output.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;">
        <div style="width:8px;height:8px;border-radius:50%;background:#22c55e;"></div>
        连接成功
      </div>
    `;
    btn.style.display = "block";
  }, 3000);

  // 超时
  setTimeout(() => {
    if (!done) {
      clearTimeout(request);
      output.innerHTML = `
        <div style="display:flex;gap:6px;align-items:center;">
          <div style="width:8px;height:8px;border-radius:50%;background:#ef4444;"></div>
          连接超时
        </div>
      `;
      btn.style.display = "block";
    }
  }, 10000);
};
