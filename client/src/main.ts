import { createSSRApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";

/**
 * uni-app 入口工厂函数。
 * 注意 uni-app 要求导出 `createApp` 而非直接挂载，框架内部会按平台调用。
 */
export function createApp() {
  const app = createSSRApp(App);
  app.use(createPinia());
  return { app };
}
