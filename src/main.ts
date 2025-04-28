import {MemberstackEvents, MemberstackInterceptor} from "./lib/memberstack-proxy-wrapper";
import {AuthError, AuthService, TwoFactorRequiredError} from "./lib/http";
import type {LoginMemberEmailPasswordParams} from "@memberstack/dom";



MemberstackInterceptor()
const authService = new AuthService();

document.addEventListener(MemberstackEvents.GET_APP, async () => {
    function isMemberLoggedIn() {
        const memberToken = localStorage.getItem("_ms-mid");
        return !!memberToken;
    }

    // ToDo Add logic to exclude verification on some pages
    if(location.href.includes("challenge")) {
        console.log("Avoided verification on challenge page")
        return
    }

    console.log("getApp");

    if (!isMemberLoggedIn()) {
        return
    }

    try {
        const isStatusValid = await authService.validateSessionStatus()
        if (isStatusValid === false) {
            await window.$memberstackDom.logout()
            return
        }
    } catch (error) {
        if (error instanceof AuthError) {
            if (error.status === 401 || error.status === 403)
                await window.$memberstackDom.logout()
            return
        }
    }
});

document.addEventListener(MemberstackEvents.LOGOUT, async () => {
    function isMemberLoggedIn() {
        const memberToken = localStorage.getItem("_ms-mid");
        return !!memberToken;
    }

    console.log("logout");
    if (!isMemberLoggedIn()) {
        console.log("Member is not logged in.")
        return
    }

    try {
        await authService.logout();

    } catch (error) {
        if (error instanceof AuthError) {
            if (error.status === 401 || error.status === 403) {
                console.log("Member is already logged out from the server.")
            }
        }
    }
    localStorage.removeItem("_ms-mid");
    localStorage.removeItem("_ms_mem")
    window.location.href = "/";
})

document.addEventListener(MemberstackEvents.LOGIN, async (event) => {
    function isMemberLoggedIn() {
        const memberToken = localStorage.getItem("_ms-mid");
        return !!memberToken;
    }

    console.log("login");
    if (isMemberLoggedIn()) {
        console.log('Member is already logged in.')
        return
    }
    try {
        const {detail} = event as CustomEvent<LoginMemberEmailPasswordParams>;
        const res = await authService.login({email: detail.email, password: detail.password});

        localStorage.setItem("_ms-mid", res.data.tokens.accessToken);
        localStorage.setItem("_ms-mem", JSON.stringify(res.data.member));

        window.location.href = res.data.redirect
    } catch (error) {
        if (error instanceof TwoFactorRequiredError) {
            const SESSION_NAME = "_ms-2fa-session";
            const session = JSON.stringify({data: error.data, type: error.type});
            sessionStorage.setItem(SESSION_NAME, session);

            window.location.href = import.meta.env.VITE_2FA_URL;
            return
        }
        throw error;
    }
})

