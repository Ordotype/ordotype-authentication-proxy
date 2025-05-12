var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var _a;
const MemberstackEvents = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login",
  VALID_SESSION: "memberstack.validSession",
  SIGN_UP: "memberstack.signUp"
};
function MemberstackInterceptor(memberstackInstance) {
  if (!window._msConfig) {
    window._msConfig = {
      preventLogin: true
    };
  }
  window.$memberstackDom = new Proxy(memberstackInstance, {
    get(target, propKey) {
      const originalMethod = target[propKey];
      if (typeof originalMethod === "function") {
        return async function(...args) {
          console.log(
            `Method ${propKey} called with arguments: ${JSON.stringify(args)}`
          );
          if (propKey === "logout") {
            const evt = new CustomEvent(MemberstackEvents.LOGOUT, {
              bubbles: false,
              cancelable: false,
              detail: args[0]
            });
            document.dispatchEvent(evt);
            return false;
          }
          if (propKey === "getApp") {
            const evt = new Event(MemberstackEvents.GET_APP, {
              bubbles: false,
              cancelable: false
            });
            document.dispatchEvent(evt);
          }
          if (propKey === "loginMemberEmailPassword") {
            const evt = new CustomEvent(MemberstackEvents.LOGIN, {
              bubbles: false,
              cancelable: false,
              detail: args[0]
            });
            document.dispatchEvent(evt);
            return {
              data: {}
            };
          }
          if (propKey === "signupMemberEmailPassword") {
            const evt = new CustomEvent(MemberstackEvents.SIGN_UP, {
              bubbles: false,
              cancelable: false,
              detail: args[0]
            });
            document.dispatchEvent(evt);
            return false;
          }
          return originalMethod.apply(target, args);
        };
      }
      return originalMethod;
    }
  });
}
function getDeviceId() {
  const cookieName = "_ga_7T2LX34911";
  const cookies = document.cookie.split("; ");
  for (const cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === cookieName) {
      return value;
    }
  }
  throw new Error("Device Id cookie not found");
}
const BASE_URL = "https://staging-api.ordotype.fr/v1.0.0";
class AuthError extends Error {
  constructor(message, status = 500) {
    super(message);
    __publicField(this, "status");
    this.name = "AuthError";
    this.status = status;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}
class TwoFactorRequiredError extends Error {
  constructor(message, data, type) {
    super(message);
    __publicField(this, "data");
    __publicField(this, "type");
    this.name = "TwoFactorRequiredError";
    this.data = data;
    this.type = type;
  }
}
class AuthService {
  constructor() {
    __publicField(this, "headers");
    const apiKey = "pk_sb_e80d8429a51c2ceb0530";
    const sessionId = window.localStorage.getItem("ms_session_id");
    const deviceId = getDeviceId();
    this.headers = {
      "X-Api-Key": apiKey,
      "X-Session-Id": sessionId ?? void 0,
      "X-Device-Id": deviceId ?? void 0
    };
  }
  async request(endpoint, entity, method = "GET", body = null, additionalHeaders = {}) {
    const url = `${BASE_URL}/${entity}/${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...this.headers,
      ...additionalHeaders
    };
    const options = {
      method,
      headers,
      ...body && { body: JSON.stringify(body) }
    };
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new AuthError(response.statusText, response.status);
      }
      if (response.status === 204 || !response.body) {
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("API Request Failed:", error);
      throw error;
    }
  }
  async validateSessionStatus() {
    try {
      const memberToken = localStorage.getItem("_ms-mid");
      return await this.request(
        "validate-session-status",
        "auth",
        "POST",
        null,
        { Authorization: `Bearer ${memberToken}` }
      );
    } catch (error) {
      console.error("Session validation failed:", error);
      throw error;
    }
  }
  async logout() {
    try {
      const memberToken = localStorage.getItem("_ms-mid");
      await this.request(
        "logout",
        "auth",
        "POST",
        null,
        { Authorization: `Bearer ${memberToken}` }
      );
      localStorage.removeItem("_ms-mid");
    } catch (error) {
      console.error("Session logout failed:", error);
      throw error;
    }
  }
  async signup(params) {
    return await this.request(
      "signup",
      "auth",
      "POST",
      params,
      {}
    );
  }
  async login(params) {
    const payload = {
      ...params,
      options: {
        includeContentGroups: true,
        isWebflow: true
      },
      device: this.headers["X-Device-Id"] ?? "unknown"
    };
    const res = await this.request(
      "login",
      "auth",
      "POST",
      payload,
      {}
    );
    if (isTwoFactorRequiredResponse(res)) {
      throw new TwoFactorRequiredError("2fa required", res.data, res.type);
    }
    return res;
  }
  // Helper to get a cookie
  getCookie(name) {
    const matches = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return matches ? decodeURIComponent(matches[2]) : null;
  }
  // Helper to set a cookie with expiration time
  setCookie(name, value, expirationMs) {
    const date = /* @__PURE__ */ new Date();
    date.setTime(date.getTime() + expirationMs);
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
  }
  // Reusable throttle function
  async throttle(method, identifier, interval) {
    const lastExecution = this.getCookie(identifier);
    const now = Date.now();
    if (lastExecution && now - parseInt(lastExecution, 10) < interval) {
      console.log(`Skipping execution of ${identifier}: Throttled.`);
      return null;
    }
    console.log(`Executing ${identifier}...`);
    const result = await method();
    this.setCookie(identifier, now.toString(), interval);
    return result;
  }
  // Public wrapper for validateSessionStatus with throttling
  validateSessionStatusThrottled() {
    const memberToken = localStorage.getItem("_ms-mid");
    if (!memberToken) {
      return Promise.resolve(null);
    }
    return this.throttle(
      () => this.validateSessionStatus(),
      "lastSessionValidation",
      3 * 60 * 1e3
      // 3 minutes throttle interval
    );
  }
}
function isTwoFactorRequiredResponse(response) {
  return "data" in response && typeof response.data === "object" && "type" in response;
}
const authService$1 = new AuthService();
function isMemberLoggedIn() {
  const memberToken = localStorage.getItem("_ms-mid");
  return !!memberToken;
}
function navigateTo(url) {
  window.$memberstackDom._showLoader();
  setTimeout(() => {
    window.location.href = url;
  }, 500);
}
function pollLocalStorage(key, interval = 1e3, timeout = 6e4) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      if (localStorage.getItem(key)) {
        resolve(`Key "${key}" found in localStorage.`);
        return;
      }
      if (Date.now() - startTime >= timeout) {
        reject(new Error(`Polling timed out. Key "${key}" not found in localStorage.`));
        return;
      }
      setTimeout(poll, interval);
    };
    poll();
  });
}
function handleLocalStoragePolling(key, interval, timeout) {
  pollLocalStorage(key, interval, timeout).then((message) => {
    console.debug(`[pollLocalStorage] Success: ${message}`);
    const token = localStorage.getItem(key);
    return authService$1.signup({ token });
  }).catch((error) => {
    console.error(`[pollLocalStorage] Error: ${error}`);
  });
}
MemberstackInterceptor(window.$memberstackDom);
const authService = new AuthService();
const EXCLUDED_URL_PATTERNS = "/default".split(",").map((pattern) => new RegExp(pattern));
const isExcludedPage = (url) => {
  return EXCLUDED_URL_PATTERNS.some((pattern) => pattern.test(url));
};
document.addEventListener(MemberstackEvents.GET_APP, async () => {
  if (isExcludedPage(location.href)) {
    console.log("Avoided verification on excluded page");
    return;
  }
  console.log("getApp");
  if (!isMemberLoggedIn()) {
    return;
  }
  try {
    const isStatusValid = await authService.validateSessionStatus();
    if (isStatusValid === false) {
      await window.$memberstackDom.logout();
      return;
    }
    const validSessionEvt = new Event(MemberstackEvents.VALID_SESSION, {
      bubbles: false,
      cancelable: false
    });
    document.dispatchEvent(validSessionEvt);
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.status === 401 || error.status === 403) {
        await window.$memberstackDom.logout({ isExpired: true });
      }
      return;
    }
  }
}, { once: true });
document.addEventListener(MemberstackEvents.LOGOUT, async (ev) => {
  const { detail } = ev;
  console.log("logout");
  if (!isMemberLoggedIn()) {
    console.log("Member is not logged in.");
    return;
  }
  if (detail == null ? void 0 : detail.isExpired) {
    await window.$memberstackDom._showMessage("Forbidden. Please login again.", true);
  } else {
    try {
      await window.$memberstackDom._showMessage("Your session has expired. Please login again.", true);
      await authService.logout();
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.status === 401 || error.status === 403) {
          console.log("Member is already logged out from the server.");
        }
      }
    }
  }
  localStorage.removeItem("_ms-mid");
  localStorage.removeItem("_ms_mem");
  navigateTo("/");
});
document.addEventListener(MemberstackEvents.LOGIN, async (event) => {
  console.log("login");
  if (isMemberLoggedIn()) {
    console.log("Member is already logged in.");
    await window.$memberstackDom._showMessage("You are already logged in.", true);
    return;
  }
  try {
    const { detail } = event;
    const res = await authService.login({ email: detail.email, password: detail.password });
    localStorage.setItem("_ms-mid", res.data.tokens.accessToken);
    localStorage.setItem("_ms-mem", JSON.stringify(res.data.member));
    window.location.href = res.data.redirect;
  } catch (error) {
    if (error instanceof TwoFactorRequiredError) {
      const SESSION_NAME = "_ms-2fa-session";
      const session = JSON.stringify({ data: error.data, type: error.type });
      sessionStorage.setItem(SESSION_NAME, session);
      navigateTo("/src/pages/2factor-challenge/");
      return;
    }
    throw error;
  }
});
document.addEventListener(MemberstackEvents.SIGN_UP, async () => {
  console.log("signup");
  handleLocalStoragePolling("_ms-mid", 1e3, 3e4);
});
(_a = document.querySelector('[data-ms-form="signup"]')) == null ? void 0 : _a.addEventListener("submit", () => {
  console.log("signup_form_submit");
  handleLocalStoragePolling("_ms-mid", 1e3, 3e4);
});
