import {MemberstackEvents, MemberstackInterceptor} from "./lib/memberstack-proxy-wrapper";
import {AuthError, AuthService, TwoFactorRequiredError} from "./lib/http";
import type {LoginMemberEmailPasswordParams} from "@memberstack/dom";
import {isMemberLoggedIn, navigateTo, pollLocalStorage} from "./lib/utils";

MemberstackInterceptor(window.$memberstackDom)

const authService = new AuthService();

document.addEventListener(MemberstackEvents.GET_APP, async () => {
    // ToDo Add logic to exclude verification on some pages
    if (location.href.includes("challenge") || location.href.includes("signup")) {
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

        /**
         *  This allows other parts of the application to subscribe to and act upon this event for relevant functionality.
         */
        const validSessionEvt = new Event(MemberstackEvents.VALID_SESSION, {
            bubbles: false,
            cancelable: false,
        });
        document.dispatchEvent(validSessionEvt);
    } catch (error) {
        if (error instanceof AuthError) {
            if (error.status === 401 || error.status === 403) {
                // @ts-ignore
                await window.$memberstackDom.logout({isExpired: true})
            }
            return
        }
    }
}, {once: true});

document.addEventListener(MemberstackEvents.LOGOUT, async (ev) => {
    const {detail} = ev as CustomEvent<{isExpired?: boolean}>;
    console.log("logout");
    if (!isMemberLoggedIn()) {
        console.log("Member is not logged in.")
        return
    }

    if (detail?.isExpired) {
        await window.$memberstackDom._showMessage("Forbidden. Please login again.", true)
    } else {
        try {
            await window.$memberstackDom._showMessage("Your session has expired. Please login again.", true)
            await authService.logout();

        } catch (error) {
            if (error instanceof AuthError) {
                if (error.status === 401 || error.status === 403) {
                    console.log("Member is already logged out from the server.")
                }
            }
        }
    }

    localStorage.removeItem("_ms-mid");
    localStorage.removeItem("_ms_mem")
    navigateTo("/")
    // window.location.href = "/";
})

document.addEventListener(MemberstackEvents.LOGIN, async (event) => {
    console.log("login");
    if (isMemberLoggedIn()) {
        console.log('Member is already logged in.')
        await window.$memberstackDom._showMessage("You are already logged in.", true)
        return
    }
    try {
        const {detail} = event as CustomEvent<LoginMemberEmailPasswordParams>;
        const res = await authService.login({email: detail.email, password: detail.password});
debugger;
        localStorage.setItem("_ms-mid", res.data.tokens.accessToken);
        localStorage.setItem("_ms-mem", JSON.stringify(res.data.member));

        window.location.href = res.data.redirect
    } catch (error) {
        debugger;
        if (error instanceof TwoFactorRequiredError) {
            const SESSION_NAME = "_ms-2fa-session";
            const session = JSON.stringify({data: error.data, type: error.type});
            sessionStorage.setItem(SESSION_NAME, session);


            // window.location.href = import.meta.env.VITE_2FA_URL;
            navigateTo(import.meta.env.VITE_2FA_URL)
            return
        }
        throw error;
    }
})

document.addEventListener(MemberstackEvents.SIGN_UP, async () => {
    console.log('signup');
    pollLocalStorage('_ms-mid', 1000, 30000)
        .then((message) => console.log(message))
        .catch((error) => console.error(error));
})

// window.onbeforeunload = function (ev) {
//     debugger
// };

document.querySelector('[data-ms-form="signup"]')?.addEventListener('submit', () => {
    console.log('signup_form_submit');
    pollLocalStorage('_ms-mid', 1000, 30000)
        .then((message) => console.log(message))
        .catch((error) => console.error(error));

})
