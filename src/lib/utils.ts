export function isMemberLoggedIn() {
    const memberToken = localStorage.getItem("_ms-mid");
    return !!memberToken;
}