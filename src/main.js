import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";

const app = createApp(App);
app.use(createPinia());
app.use(router);

// 全局错误处理，防止白屏
app.config.errorHandler = (err, vm, info) => {
  console.error("全局错误:", err, info);
};

// 动态 viewport 高度同步
function syncAppHeight() {
  const h = window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${h}px`);
  // 强制 body 和 html 高度
  document.documentElement.style.height = h + "px";
  document.body.style.height = h + "px";
}

syncAppHeight();
window.addEventListener("resize", syncAppHeight);
window.addEventListener("orientationchange", () => {
  setTimeout(syncAppHeight, 100);
});

// iOS standalone 模式额外处理
if (window.navigator.standalone) {
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  document.body.style.position = "fixed";
  document.body.style.width = "100%";
  document.body.style.height = "100%";
}

app.mount("#app");
