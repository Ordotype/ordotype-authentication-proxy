var u = Object.defineProperty;
var m = (o, e, t) => e in o ? u(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var r = (o, e, t) => m(o, typeof e != "symbol" ? e + "" : e, t);
const c = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login"
};
function f() {
  window._msConfig || (window._msConfig = {
    preventLogin: !0
  }), window.$memberstackDom = new Proxy(window.$memberstackDom, {
    get(o, e) {
      const t = o[e];
      return typeof t == "function" ? async function(...n) {
        var a;
        if (console.log(
          `Method ${e} called with arguments: ${JSON.stringify(n)}`
        ), e === "logout") {
          const s = new Event(c.LOGOUT, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(s);
        }
        if (e === "getApp") {
          const s = new Event(c.GET_APP, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(s);
        }
        if (e === "loginMemberEmailPassword") {
          const s = new Event(c.LOGIN, {
            bubbles: !1,
            cancelable: !1
          });
          return document.dispatchEvent(s), ((a = window._msConfig) == null ? void 0 : a.preventLogin) && !1;
        }
        return t.apply(o, n);
      } : t;
    }
  });
}
function w() {
  const e = document.cookie.split("; ");
  for (const t of e) {
    const [n, a] = t.split("=");
    if (n === void 0)
      return a;
  }
  throw new Error("Device Id cookie not found");
}
const v = "https://staging-api.ordotype.fr";
class h {
  constructor() {
    r(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), n = w();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": n ?? void 0
    };
  }
  async request(e, t = "GET", n = null, a = {}) {
    const s = `${v}/${e}`, l = {
      "Content-Type": "application/json",
      ...this.headers,
      ...a
    }, d = {
      method: t,
      headers: l,
      ...n && { body: JSON.stringify(n) }
    };
    try {
      const i = await fetch(s, d);
      if (!i.ok)
        throw new Error(`Error ${i.status}: ${i.statusText}`);
      return await i.json();
    } catch (i) {
      throw console.error("API Request Failed:", i), i;
    }
  }
  async validateSessionStatus() {
    try {
      const e = localStorage.getItem("_ms-mid");
      return await this.request(
        "validate-session-status",
        "POST",
        null,
        { Authorization: `Bearer ${e}` }
      );
    } catch (e) {
      throw console.error("Session validation failed:", e), e;
    }
  }
}
f();
document.addEventListener(c.GET_APP, async () => {
  console.log("getApp"), await new h().validateSessionStatus();
});
