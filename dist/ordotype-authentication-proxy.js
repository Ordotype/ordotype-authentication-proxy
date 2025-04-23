var l = Object.defineProperty;
var d = (t, e, o) => e in t ? l(t, e, { enumerable: !0, configurable: !0, writable: !0, value: o }) : t[e] = o;
var a = (t, e, o) => d(t, typeof e != "symbol" ? e + "" : e, o);
const h = {
  GET_APP: "memberstack.getApp"
};
function m() {
  const e = document.cookie.split("; ");
  for (const o of e) {
    const [r, n] = o.split("=");
    if (r === void 0)
      return n;
  }
  throw new Error("Device Id cookie not found");
}
const w = "";
class S {
  constructor() {
    a(this, "headers");
    throw window.localStorage.getItem("ms_session_id"), m(), new Error("Missing API key for AuthService");
  }
  async request(e, o = "GET", r = null, n = {}) {
    const i = `${w}/${e}`, c = {
      "Content-Type": "application/json",
      ...this.headers,
      ...n
    }, u = {
      method: o,
      headers: c,
      ...r && { body: JSON.stringify(r) }
    };
    try {
      const s = await fetch(i, u);
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
  console.log("getApp"), await new S().validateSessionStatus();
});
