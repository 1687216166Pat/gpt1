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
}

syncAppHeight();
window.addEventListener("resize", syncAppHeight);
window.addEventListener("orientationchange", () => {
  setTimeout(syncAppHeight, 100);
});

app.mount("#app");
