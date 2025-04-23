var m = Object.defineProperty;
var f = (o, e, t) => e in o ? m(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var r = (o, e, t) => f(o, typeof e != "symbol" ? e + "" : e, t);
const c = {
  LOGOUT: "memberstack.logout",
  GET_APP: "memberstack.getApp",
  LOGIN: "memberstack.login"
};
function w() {
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
          const i = new Event(c.LOGOUT, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(i);
        }
        if (e === "getApp") {
          const i = new Event(c.GET_APP, {
            bubbles: !1,
            cancelable: !1
          });
          document.dispatchEvent(i);
        }
        if (e === "loginMemberEmailPassword") {
          const i = new Event(c.LOGIN, {
            bubbles: !1,
            cancelable: !1
          });
          return document.dispatchEvent(i), ((s = window._msConfig) == null ? void 0 : s.preventLogin) && !1;
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
const h = "https://staging-api.ordotype.fr/v1.0.0";
class g {
  constructor() {
    r(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), n = v();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": n ?? void 0
    };
  }
  async request(e, t, n = "GET", s = null, i = {}) {
    const l = `${h}/${t}/${e}`, d = {
      "Content-Type": "application/json",
      ...this.headers,
      ...i
    }, u = {
      method: n,
      headers: d,
      ...s && { body: JSON.stringify(s) }
    };
    try {
      const a = await fetch(l, u);
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
}
w();
document.addEventListener(c.GET_APP, async () => {
  console.log("getApp"), await new g().validateSessionStatus();
});
