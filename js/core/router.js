window.App = window.App || {};

App.router = {
  stack: ["desktop"],

  // 进入任何页面（任何应用都用这个）
  go(page) {
    this.stack.push(page);
    this.render(page);
  },

  // 全局返回（所有应用通用）
  back() {
    if (this.stack.length <= 1) return;

    this.stack.pop();
    const page = this.stack[this.stack.length - 1];
    this.render(page);
  },

  // 页面渲染器（统一控制所有应用）
  render(page) {
    console.log("切换到页面：", page);

    // 统一隐藏所有页面
    document.querySelectorAll(".page").forEach(el => {
      el.style.display = "none";
    });

    // 显示目标页面
    const target = document.getElementById(page);
    if (target) {
      target.style.display = "block";
    }

    // 全局事件（所有软件都能监听）
    window.dispatchEvent(
      new CustomEvent("app-change", {
        detail: { page }
      })
    );
  }
};
