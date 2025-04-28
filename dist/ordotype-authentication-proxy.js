var h = Object.defineProperty;
var w = (n, e, t) => e in n ? h(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var c = (n, e, t) => w(n, typeof e != "symbol" ? e + "" : e, t);
const i = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login"
};
function S() {
  window._msConfig || (window._msConfig = {
    preventLogin: !0
  }), window.$memberstackDom = new Proxy(window.$memberstackDom, {
    get(n, e) {
      const t = n[e];
      return typeof t == "function" ? async function(...o) {
        var s;
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
          return document.dispatchEvent(r), ((s = window._msConfig) == null ? void 0 : s.preventLogin) && !1;
        }
        return t.apply(n, o);
      } : t;
    }
  });
}
function b() {
  const n = "_ga_7T2LX34911", e = document.cookie.split("; ");
  for (const t of e) {
    const [o, s] = t.split("=");
    if (o === n)
      return s;
  }
  throw new Error("Device Id cookie not found");
}
const p = "https://staging-api.ordotype.fr/v1.0.0";
class l extends Error {
  constructor(t, o = 500) {
    super(t);
    c(this, "status");
    this.name = "AuthError", this.status = o, Error.captureStackTrace && Error.captureStackTrace(this, l);
  }
}
class d extends Error {
  constructor(t, o, s) {
    super(t);
    c(this, "data");
    c(this, "type");
    this.name = "TwoFactorRequiredError", this.data = o, this.type = s;
  }
}
class v {
  constructor() {
    c(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), o = b();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": o ?? void 0
    };
  }
  async request(e, t, o = "GET", s = null, r = {}) {
    const m = `${p}/${t}/${e}`, g = {
      "Content-Type": "application/json",
      ...this.headers,
      ...r
    }, f = {
      method: o,
      headers: g,
      ...s && { body: JSON.stringify(s) }
    };
    try {
      const a = await fetch(m, f);
      if (!a.ok)
        throw new l(a.statusText, a.status);
      return a.status === 204 || !a.body ? null : await a.json();
    } catch (a) {
      throw console.error("API Request Failed:", a), a;
    }
  }
  async validateSessionStatus() {
    try {
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
    if (k(o))
      throw new d("2fa required", o.data, o.type);
    return o;
  }
  // Helper to get a cookie
  getCookie(e) {
    const t = document.cookie.match(new RegExp(`(^| )${e}=([^;]+)`));
    return t ? decodeURIComponent(t[2]) : null;
  }
  // Helper to set a cookie with expiration time
  setCookie(e, t, o) {
    const s = /* @__PURE__ */ new Date();
    s.setTime(s.getTime() + o), document.cookie = `${e}=${encodeURIComponent(t)}; expires=${s.toUTCString()}; path=/`;
  }
  // Reusable throttle function
  async throttle(e, t, o) {
    const s = this.getCookie(t), r = Date.now();
    if (s && r - parseInt(s, 10) < o)
      return console.log(`Skipping execution of ${t}: Throttled.`), null;
    console.log(`Executing ${t}...`);
    const m = await e();
    return this.setCookie(t, r.toString(), o), m;
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
function k(n) {
  return "data" in n && typeof n.data == "object" && "type" in n;
}
S();
const u = new v();
document.addEventListener(i.GET_APP, async () => {
  function n() {
    return !!localStorage.getItem("_ms-mid");
  }
  if (location.href.includes("challenge")) {
    console.log("Avoided verification on challenge page");
    return;
  }
  if (console.log("getApp"), !!n())
    try {
      if (await u.validateSessionStatus() === !1) {
        await window.$memberstackDom.logout();
        return;
      }
    } catch (e) {
      if (e instanceof l) {
        (e.status === 401 || e.status === 403) && await window.$memberstackDom.logout();
        return;
      }
    }
});
document.addEventListener(i.LOGOUT, async () => {
  function n() {
    return !!localStorage.getItem("_ms-mid");
  }
  if (console.log("logout"), !n()) {
    console.log("Member is not logged in.");
    return;
  }
  try {
    await u.logout();
  } catch (e) {
    e instanceof l && (e.status === 401 || e.status === 403) && console.log("Member is already logged out from the server.");
  }
  localStorage.removeItem("_ms-mid"), localStorage.removeItem("_ms_mem"), window.location.href = "/";
});
document.addEventListener(i.LOGIN, async (n) => {
  function e() {
    return !!localStorage.getItem("_ms-mid");
  }
  if (console.log("login"), e()) {
    console.log("Member is already logged in.");
    return;
  }
  try {
    const { detail: t } = n, o = await u.login({ email: t.email, password: t.password });
    localStorage.setItem("_ms-mid", o.data.tokens.accessToken), localStorage.setItem("_ms-mem", JSON.stringify(o.data.member)), window.location.href = o.data.redirect;
  } catch (t) {
    if (t instanceof d) {
      const o = "_ms-2fa-session", s = JSON.stringify({ data: t.data, type: t.type });
      sessionStorage.setItem(o, s), window.location.href = void 0;
      return;
    }
    throw t;
  }
});
