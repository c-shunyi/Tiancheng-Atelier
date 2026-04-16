import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/config";
import type { WxUser } from "@/types/api";

/**
 * 当前登录用户的全局状态。
 * 同时把 token / user 镜像到 uni storage，保证刷新或冷启动后仍然登录。
 */
export const useUserStore = defineStore("user", () => {
  const token = ref<string>("");
  const user = ref<WxUser | null>(null);
  const isLoggedIn = computed(() => Boolean(token.value));

  /**
   * 从本地缓存恢复登录状态，应在 App 启动时调用一次。
   */
  function restore() {
    const cachedToken = uni.getStorageSync(TOKEN_STORAGE_KEY);
    const cachedUser = uni.getStorageSync(USER_STORAGE_KEY);
    if (cachedToken) token.value = cachedToken;
    if (cachedUser) user.value = cachedUser as WxUser;
  }

  /**
   * 登录成功后写入 token + 用户资料，并持久化。
   */
  function setSession(nextToken: string, nextUser: WxUser) {
    token.value = nextToken;
    user.value = nextUser;
    uni.setStorageSync(TOKEN_STORAGE_KEY, nextToken);
    uni.setStorageSync(USER_STORAGE_KEY, nextUser);
  }

  /**
   * 仅更新用户资料（如昵称/头像变更后），不动 token。
   */
  function setUser(nextUser: WxUser) {
    user.value = nextUser;
    uni.setStorageSync(USER_STORAGE_KEY, nextUser);
  }

  /**
   * 退出登录，清空内存与本地缓存。
   */
  function logout() {
    token.value = "";
    user.value = null;
    uni.removeStorageSync(TOKEN_STORAGE_KEY);
    uni.removeStorageSync(USER_STORAGE_KEY);
  }

  return { token, user, isLoggedIn, restore, setSession, setUser, logout };
});
