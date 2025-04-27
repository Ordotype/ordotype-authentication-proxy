var f = Object.defineProperty;
var p = (s, e, t) => e in s ? f(s, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : s[e] = t;
var c = (s, e, t) => p(s, typeof e != "symbol" ? e + "" : e, t);
const i = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login"
};
function S() {
  window._msConfig || (window._msConfig = {
    preventLogin: !0
  }), window.$memberstackDom = new Proxy(window.$memberstackDom, {
    get(s, e) {
      const t = s[e];
      return typeof t == "function" ? async function(...o) {
        var n;
        if (console.log(
          `Method ${e} called with arguments: ${JSON.stringify(o)}`
        ), e === "logout") {
          const r = new Event(i.LOGOUT, {
            bubbles: !1,
            cancelable: !1
          });
          return document.dispatchEvent(r), !1;
        }
        if (e === "getApp") {
          const r = new Event(i.GET_APP, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(r);
        }
        if (e === "loginMemberEmailPassword") {
          const r = new CustomEvent(i.LOGIN, {
            bubbles: !1,
            cancelable: !1,
            detail: o[0]
          });
          return document.dispatchEvent(r), ((n = window._msConfig) == null ? void 0 : n.preventLogin) && !1;
        }
        return t.apply(s, o);
      } : t;
    }
  });
}
function v() {
  const s = "_ga_7T2LX34911", e = document.cookie.split("; ");
  for (const t of e) {
    const [o, n] = t.split("=");
    if (o === s)
      return n;
  }
  throw new Error("Device Id cookie not found");
}
function l() {
  return !!localStorage.getItem("_ms-mid");
}
const b = "https://staging-api.ordotype.fr/v1.0.0";
class u extends Error {
  constructor(t, o = 500) {
    super(t);
    c(this, "status");
    this.name = "AuthError", this.status = o, Error.captureStackTrace && Error.captureStackTrace(this, u);
  }
}
class g extends Error {
  constructor(t, o, n) {
    super(t);
    c(this, "data");
    c(this, "type");
    this.name = "TwoFactorRequiredError", this.data = o, this.type = n;
  }
}
class k {
  constructor() {
    c(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), o = v();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": o ?? void 0
    };
  }
  async request(e, t, o = "GET", n = null, r = {}) {
    const d = `${b}/${t}/${e}`, w = {
      "Content-Type": "application/json",
      ...this.headers,
      ...r
    }, h = {
      method: o,
      headers: w,
      ...n && { body: JSON.stringify(n) }
    };
    try {
      const a = await fetch(d, h);
      if (!a.ok)
        throw new u(a.statusText, a.status);
      return await a.json();
    } catch (a) {
      throw console.error("API Request Failed:", a), a;
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
    const t = {
      ...e,
      options: {
        includeContentGroups: !0,
        isWebflow: !0
      },
      device: this.headers["X-Device-Id"] ?? "unknown"
    }, o = await this.request(
      "login",
      "auth",
      "POST",
      t,
      {}
    );
    if (y(o))
      throw new g("2fa required", o.data, o.type);
    return o;
  }
  // Helper to get a cookie
  getCookie(e) {
    const t = document.cookie.match(new RegExp(`(^| )${e}=([^;]+)`));
    return t ? decodeURIComponent(t[2]) : null;
  }
  // Helper to set a cookie with expiration time
  setCookie(e, t, o) {
    const n = /* @__PURE__ */ new Date();
    n.setTime(n.getTime() + o), document.cookie = `${e}=${encodeURIComponent(t)}; expires=${n.toUTCString()}; path=/`;
  }
  // Reusable throttle function
  async throttle(e, t, o) {
    const n = this.getCookie(t), r = Date.now();
    if (n && r - parseInt(n, 10) < o)
      return console.log(`Skipping execution of ${t}: Throttled.`), null;
    console.log(`Executing ${t}...`);
    const d = await e();
    return this.setCookie(t, r.toString(), o), d;
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
function y(s) {
  return "data" in s && typeof s.data == "object" && "type" in s.data;
}
S();
const m = new k();
document.addEventListener(i.GET_APP, async () => {
  if (console.log("getApp"), !!l())
    try {
      if (await m.validateSessionStatus() === !1) {
        await window.$memberstackDom.logout();
        return;
      }
    } catch (s) {
      if (s instanceof u) {
        (s.status === 401 || s.status === 403) && await window.$memberstackDom.logout();
        return;
      }
    }
});
document.addEventListener(i.LOGOUT, async () => {
  console.log("logout"), await m.logout(), localStorage.removeItem("_ms-mid"), localStorage.removeItem("_ms_mem"), window.location.href = "/";
});
document.addEventListener(i.LOGIN, async (s) => {
  if (console.log("login"), l()) {
    console.log("Member is already logged in.");
    return;
  }
  try {
    const { detail: e } = s, t = await m.login({ email: e.email, password: e.password });
    localStorage.setItem("_ms-mid", t.data.tokens.accessToken), localStorage.setItem("_ms-mem", JSON.stringify(t.data.member)), window.location.href = t.data.redirect;
  } catch (e) {
    if (e instanceof g) {
      const t = "_ms-2fa-session", o = JSON.stringify({ data: e.data, type: e.type });
      sessionStorage.setItem(t, o), window.location.href = void 0;
      return;
    }
    throw e;
  }
});
