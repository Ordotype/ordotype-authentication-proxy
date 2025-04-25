var m = Object.defineProperty;
var g = (o, e, t) => e in o ? m(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var l = (o, e, t) => g(o, typeof e != "symbol" ? e + "" : e, t);
const r = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login"
};
function h() {
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
          const i = new Event(r.LOGOUT, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(i);
        }
        if (e === "getApp") {
          const i = new Event(r.GET_APP, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(i);
        }
        if (e === "loginMemberEmailPassword") {
          const i = new Event(r.LOGIN, {
            bubbles: !1,
            cancelable: !1
          });
          return document.dispatchEvent(i), ((n = window._msConfig) == null ? void 0 : n.preventLogin) && !1;
        }
        return t.apply(o, s);
      } : t;
    }
  });
}
function w() {
  const o = "_ga_7T2LX34911", e = document.cookie.split("; ");
  for (const t of e) {
    const [s, n] = t.split("=");
    if (s === o)
      return n;
  }
  throw new Error("Device Id cookie not found");
}
const f = "https://staging-api.ordotype.fr/v1.0.0";
class v {
  constructor() {
    l(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), s = w();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": s ?? void 0
    };
  }
  async request(e, t, s = "GET", n = null, i = {}) {
    const c = `${f}/${t}/${e}`, u = {
      "Content-Type": "application/json",
      ...this.headers,
      ...i
    }, d = {
      method: s,
      headers: u,
      ...n && { body: JSON.stringify(n) }
    };
    try {
      const a = await fetch(c, d);
      if (!a.ok)
        throw new Error(`Error ${a.status}: ${a.statusText}`);
      return await a.json();
    } catch (a) {
      throw console.error("API Request Failed:", a), a;
    }
  }
  async validateSessionStatus() {
    try {
      const e = localStorage.getItem("_ms-mid");
      return e ? await this.request(
        "validate-session-status",
        "auth",
        "POST",
        null,
        { Authorization: `Bearer ${e}` }
      ) : null;
    } catch (e) {
      throw console.error("Session validation failed:", e), e;
    }
  }
  async logout() {
    try {
      const e = localStorage.getItem("_ms-mid");
      if (!e)
        return;
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
  setCookie(e, t, s) {
    const n = /* @__PURE__ */ new Date();
    n.setTime(n.getTime() + s), document.cookie = `${e}=${encodeURIComponent(t)}; expires=${n.toUTCString()}; path=/`;
  }
  // Reusable throttle function
  async throttle(e, t, s) {
    const n = this.getCookie(t), i = Date.now();
    if (n && i - parseInt(n, 10) < s)
      return console.log(`Skipping execution of ${t}: Throttled.`), null;
    console.log(`Executing ${t}...`);
    const c = await e();
    return this.setCookie(t, i.toString(), s), c;
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
h();
document.addEventListener(r.GET_APP, async () => {
  console.log("getApp");
  const o = new v();
  if (!await o.validateSessionStatus()) {
    await o.logout(), window.location.href = "/";
    return;
  }
});
