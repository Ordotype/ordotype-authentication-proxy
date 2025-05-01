export function isMemberLoggedIn() {
    const memberToken = localStorage.getItem("_ms-mid");
    return !!memberToken;
}

export function navigateTo(url: string) {
    window.$memberstackDom._showLoader()
    setTimeout(() => {
        window.location.href = url;
    }, 500)
}