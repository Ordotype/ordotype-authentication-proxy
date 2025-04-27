var f = Object.defineProperty;
var S = (o, e, t) => e in o ? f(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var c = (o, e, t) => S(o, typeof e != "symbol" ? e + "" : e, t);
const i = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login"
};
function p() {
  window._msConfig || (window._msConfig = {
    preventLogin: !0
  }), window.$memberstackDom = new Proxy(window.$memberstackDom, {
    get(o, e) {
      const t = o[e];
      return typeof t == "function" ? async function(...s) {
        var n;
        if (console.log(
          `Method ${e} called with arguments: ${JSON.stringify(s)}`
        ), e === "logout") {
          const a = new Event(i.LOGOUT, {
            bubbles: !1,
            cancelable: !1
          });
          return document.dispatchEvent(a), !1;
        }
        if (e === "getApp") {
          const a = new Event(i.GET_APP, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(a);
        }
        if (e === "loginMemberEmailPassword") {
          const a = new CustomEvent(i.LOGIN, {
            bubbles: !1,
            cancelable: !1,
            detail: s
          });
          return document.dispatchEvent(a), ((n = window._msConfig) == null ? void 0 : n.preventLogin) && !1;
        }
        return t.apply(o, s);
      } : t;
    }
  });
}
function b() {
  const o = "_ga_7T2LX34911", e = document.cookie.split("; ");
  for (const t of e) {
    const [s, n] = t.split("=");
    if (s === o)
      return n;
  }
  throw new Error("Device Id cookie not found");
}
function l() {
  return !!localStorage.getItem("_ms-mid");
}
const v = "https://staging-api.ordotype.fr/v1.0.0";
class u extends Error {
  constructor(t, s = 500) {
    super(t);
    c(this, "status");
    this.name = "AuthError", this.status = s, Error.captureStackTrace && Error.captureStackTrace(this, u);
  }
}
class g extends Error {
  constructor(t, s, n) {
    super(t);
    c(this, "data");
    c(this, "type");
    this.name = "TwoFactorRequiredError", this.data = s, this.type = n;
  }
}
class k {
  constructor() {
    c(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), s = b();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": s ?? void 0
    };
  }
  async request(e, t, s = "GET", n = null, a = {}) {
    const m = `${v}/${t}/${e}`, w = {
      "Content-Type": "application/json",
      ...this.headers,
      ...a
    }, h = {
      method: s,
      headers: w,
      ...n && { body: JSON.stringify(n) }
    };
    try {
      const r = await fetch(m, h);
      if (!r.ok)
        throw new u(r.statusText, r.status);
      return await r.json();
    } catch (r) {
      throw console.error("API Request Failed:", r), r;
    }
  }
  async validateSessionStatus() {
    try {
      if (!l())
        return null;
      const e = localStorage.getItem("_ms-mid");
      return await this.request(
        "validate-session-status",
        "auth",
        "POST",
        null,
        { Authorization: `Bearer ${e}` }
      );
    } catch (e) {
      throw console.error("Session validation failed:", e), e;
    }
  }
  async logout() {
    try {
      if (!l())
        return;
      const e = localStorage.getItem("_ms-mid");
      await this.request(
        "logout",
        "auth",
        "POST",
        null,
        { Authorization: `Bearer ${e}` }
      ), localStorage.removeItem("_ms-mid");
    } catch (e) {
      throw console.error("Session logout failed:", e), e;
    }
  }
  async login(e) {
    const t = await this.request(
      "login",
      "auth",
      "POST",
      e,
      {}
    );
    if (T(t))
      throw new g("2fa required", t.data, t.type);
    return t;
  }
  // Helper to get a cookie
  getCookie(e) {
    const t = document.cookie.match(new RegExp(`(^| )${e}=([^;]+)`));
    return t ? decodeURIComponent(t[2]) : null;
  }
  // Helper to set a cookie with expiration time
  setCookie(e, t, s) {
    const n = /* @__PURE__ */ new Date();
    n.setTime(n.getTime() + s), document.cookie = `${e}=${encodeURIComponent(t)}; expires=${n.toUTCString()}; path=/`;
  }
  // Reusable throttle function
  async throttle(e, t, s) {
    const n = this.getCookie(t), a = Date.now();
    if (n && a - parseInt(n, 10) < s)
      return console.log(`Skipping execution of ${t}: Throttled.`), null;
    console.log(`Executing ${t}...`);
    const m = await e();
    return this.setCookie(t, a.toString(), s), m;
  }
  // Public wrapper for validateSessionStatus with throttling
  validateSessionStatusThrottled() {
    return localStorage.getItem("_ms-mid") ? this.throttle(
      () => this.validateSessionStatus(),
      "lastSessionValidation",
      3 * 60 * 1e3
      // 3 minutes throttle interval
    ) : Promise.resolve(null);
  }
}
function T(o) {
  return "data" in o && typeof o.data == "object" && "type" in o.data;
}
p();
const d = new k();
document.addEventListener(i.GET_APP, async () => {
  if (console.log("getApp"), !!l())
    try {
      if (await d.validateSessionStatus() === !1) {
        await window.$memberstackDom.logout();
        return;
      }
    } catch (o) {
      if (o instanceof u) {
        (o.status === 401 || o.status === 403) && await window.$memberstackDom.logout();
        return;
      }
    }
});
document.addEventListener(i.LOGOUT, async () => {
  console.log("logout"), await d.logout(), localStorage.removeItem("_ms-mid"), localStorage.removeItem("_ms_mem"), window.location.href = "/";
});
document.addEventListener(i.LOGIN, async (o) => {
  if (console.log("login"), l()) {
    console.log("Member is already logged in.");
    return;
  }
  try {
    const { detail: e } = o, t = await d.login({ email: e.email, password: e.password });
    localStorage.setItem("_ms-mid", t.data.tokens.accessToken), localStorage.setItem("_ms-mem", JSON.stringify(t.data.member)), window.location.href = t.data.redirect;
  } catch (e) {
    if (e instanceof g) {
      const t = "_ms-2fa-session", s = JSON.stringify({ data: e.data, type: e.type });
      sessionStorage.setItem(t, s), window.location.href = void 0;
      return;
    }
    throw e;
  }
});
