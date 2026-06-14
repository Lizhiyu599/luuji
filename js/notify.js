(function () {
  const container = document.createElement("div");

  container.id = "notify-container";
  container.style.cssText = `
    position: fixed;
    top: 18px;
    left: 50%;
    transform: translateX(-50%);
    width: 88%;
    max-width: 420px;
    z-index: 99999;
    pointer-events: none;
  `;

  document.body.appendChild(container);

  let queue = [];
  let showing = false;

  function createItem(title, text) {
    const el = document.createElement("div");

    el.style.cssText = `
      margin-bottom: 10px;
      padding: 14px 16px;
      border-radius: 16px;
      background: rgba(255,255,255,0.14);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.12);
      color: rgba(255,255,255,0.95);
      font-family: sans-serif;
      pointer-events: auto;
      transition: all .35s ease;
      opacity: 1;
      transform: translateY(0);
    `;

    el.innerHTML = `
      <div style="font-size:15px;font-weight:600;">${title || ""}</div>
      <div style="font-size:13px;opacity:0.85;margin-top:4px;">
        ${text || ""}
      </div>
    `;

    // 滑动关闭（手机手感）
    let startX = 0;
    let moveX = 0;

    el.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    });

    el.addEventListener("touchmove", (e) => {
      moveX = e.touches[0].clientX - startX;
      el.style.transform = `translateX(${moveX}px)`;
    });

    el.addEventListener("touchend", () => {
      if (Math.abs(moveX) > 80) {
        el.style.opacity = "0";
        el.style.transform = "translateY(-10px)";
        setTimeout(() => {
          el.remove();
        }, 250);
      } else {
        el.style.transform = "translateX(0)";
      }
    });

    return el;
  }

  function showNext() {
    if (queue.length === 0) {
      showing = false;
      return;
    }

    showing = true;

    const { title, text, duration } = queue.shift();
    const el = createItem(title, text);

    container.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(-10px)";

      setTimeout(() => {
        el.remove();
        showNext();
      }, 250);
    }, duration || 3000);
  }

  window.notify = function (title, text, duration) {
    queue.push({ title, text, duration });

    if (!showing) {
      showNext();
    }
  };
})();
