var w = Object.defineProperty;
var f = (o, e, t) => e in o ? w(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var u = (o, e, t) => f(o, typeof e != "symbol" ? e + "" : e, t);
const i = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login"
};
function S() {
  window._msConfig || (window._msConfig = {
    preventLogin: !0
  }), window.$memberstackDom = new Proxy(window.$memberstackDom, {
    get(o, e) {
      const t = o[e];
      return typeof t == "function" ? async function(...n) {
        var s;
        if (console.log(
          `Method ${e} called with arguments: ${JSON.stringify(n)}`
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
          const r = new Event(i.LOGIN, {
            bubbles: !1,
            cancelable: !1
          });
          return document.dispatchEvent(r), ((s = window._msConfig) == null ? void 0 : s.preventLogin) && !1;
        }
        return t.apply(o, n);
      } : t;
    }
  });
}
function v() {
  const o = "_ga_7T2LX34911", e = document.cookie.split("; ");
  for (const t of e) {
    const [n, s] = t.split("=");
    if (n === o)
      return s;
  }
  throw new Error("Device Id cookie not found");
}
function m() {
  return !!localStorage.getItem("_ms-mid");
}
const b = "https://staging-api.ordotype.fr/v1.0.0";
class c extends Error {
  constructor(t, n = 500) {
    super(t);
    u(this, "status");
    this.name = "AuthError", this.status = n, Error.captureStackTrace && Error.captureStackTrace(this, c);
  }
}
class k {
  constructor() {
    u(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), n = v();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": n ?? void 0
    };
  }
  async request(e, t, n = "GET", s = null, r = {}) {
    const l = `${b}/${t}/${e}`, g = {
      "Content-Type": "application/json",
      ...this.headers,
      ...r
    }, h = {
      method: n,
      headers: g,
      ...s && { body: JSON.stringify(s) }
    };
    try {
      const a = await fetch(l, h);
      if (!a.ok)
        throw new c(a.statusText, a.status);
      return await a.json();
    } catch (a) {
      throw console.error("API Request Failed:", a), a;
    }
  }
  async validateSessionStatus() {
    try {
      if (!m())
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
      if (!m())
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
  // Helper to get a cookie
  getCookie(e) {
    const t = document.cookie.match(new RegExp(`(^| )${e}=([^;]+)`));
    return t ? decodeURIComponent(t[2]) : null;
  }
  // Helper to set a cookie with expiration time
  setCookie(e, t, n) {
    const s = /* @__PURE__ */ new Date();
    s.setTime(s.getTime() + n), document.cookie = `${e}=${encodeURIComponent(t)}; expires=${s.toUTCString()}; path=/`;
  }
  // Reusable throttle function
  async throttle(e, t, n) {
    const s = this.getCookie(t), r = Date.now();
    if (s && r - parseInt(s, 10) < n)
      return console.log(`Skipping execution of ${t}: Throttled.`), null;
    console.log(`Executing ${t}...`);
    const l = await e();
    return this.setCookie(t, r.toString(), n), l;
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
S();
const d = new k();
document.addEventListener(i.GET_APP, async () => {
  if (console.log("getApp"), !!m())
    try {
      if (await d.validateSessionStatus() === !1) {
        await window.$memberstackDom.logout();
        return;
      }
    } catch (o) {
      if (o instanceof c) {
        (o.status === 401 || o.status === 403) && await window.$memberstackDom.logout();
        return;
      }
    }
});
document.addEventListener(i.LOGOUT, async () => {
  console.log("logout"), await d.logout(), localStorage.removeItem("_ms-mid"), localStorage.removeItem("_ms_mem"), window.location.href = "/";
});
