import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from "@/config";
import type { WxUser } from "@/types/api";

export const useUserStore = defineStore("user", () => {
  const token = ref<string>("");
  const user = ref<WxUser | null>(null);
  const isLoggedIn = computed(() => Boolean(token.value));

  function restore() {
    const cachedToken = uni.getStorageSync(TOKEN_STORAGE_KEY);
    const cachedUser = uni.getStorageSync(USER_STORAGE_KEY);
    if (cachedToken) token.value = cachedToken;
    if (cachedUser) user.value = cachedUser as WxUser;
  }

  function setSession(nextToken: string, nextUser: WxUser) {
    token.value = nextToken;
    user.value = nextUser;
    uni.setStorageSync(TOKEN_STORAGE_KEY, nextToken);
    uni.setStorageSync(USER_STORAGE_KEY, nextUser);
  }

  function setUser(nextUser: WxUser) {
    user.value = nextUser;
    uni.setStorageSync(USER_STORAGE_KEY, nextUser);
  }

  function logout() {
    token.value = "";
    user.value = null;
    uni.removeStorageSync(TOKEN_STORAGE_KEY);
    uni.removeStorageSync(USER_STORAGE_KEY);
  }

  return { token, user, isLoggedIn, restore, setSession, setUser, logout };
});
