var u = Object.defineProperty;
var l = (o, e, t) => e in o ? u(o, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : o[e] = t;
var i = (o, e, t) => l(o, typeof e != "symbol" ? e + "" : e, t);
const h = {
  GET_APP: "memberstack.getApp"
};
function p() {
  const e = document.cookie.split("; ");
  for (const t of e) {
    const [n, r] = t.split("=");
    if (n === void 0)
      return r;
  }
  throw new Error("Device Id cookie not found");
}
const v = "https://staging-api.ordotype.fr";
class m {
  constructor() {
    i(this, "headers");
    const e = "pk_sb_e80d8429a51c2ceb0530", t = window.localStorage.getItem("ms_session_id"), n = p();
    this.headers = {
      "X-Api-Key": e,
      "X-Session-Id": t ?? void 0,
      "X-Device-Id": n ?? void 0
    };
  }
  async request(e, t = "GET", n = null, r = {}) {
    const a = `${v}/${e}`, c = {
      "Content-Type": "application/json",
      ...this.headers,
      ...r
    }, d = {
      method: t,
      headers: c,
      ...n && { body: JSON.stringify(n) }
    };
    try {
      const s = await fetch(a, d);
      if (!s.ok)
        throw new Error(`Error ${s.status}: ${s.statusText}`);
      return await s.json();
    } catch (s) {
      throw console.error("API Request Failed:", s), s;
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
document.addEventListener(h.GET_APP, async () => {
  console.log("getApp"), await new m().validateSessionStatus();
});
