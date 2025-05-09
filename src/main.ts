import {MemberstackEvents, MemberstackInterceptor} from "./lib/memberstack-proxy-wrapper";
import {AuthError, AuthService, TwoFactorRequiredError} from "./lib/http";
import type {LoginMemberEmailPasswordParams} from "@memberstack/dom";
import {handleLocalStoragePolling, isMemberLoggedIn, navigateTo} from "./lib/utils";

MemberstackInterceptor(window.$memberstackDom)

const authService = new AuthService();

const EXCLUDED_URL_PATTERNS: RegExp[] = (
    import.meta.env.VITE_EXCLUDED_URLS || "/default"
)
    .split(",")
    .map((pattern: string) => new RegExp(pattern));

const isExcludedPage = (url: string): boolean => {
    return EXCLUDED_URL_PATTERNS.some(pattern => pattern.test(url));
};

document.addEventListener(MemberstackEvents.GET_APP, async () => {
    if (isExcludedPage(location.href)) {
        console.log("Avoided verification on excluded page")
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
        localStorage.setItem("_ms-mid", res.data.tokens.accessToken);
        localStorage.setItem("_ms-mem", JSON.stringify(res.data.member));

        window.location.href = res.data.redirect
    } catch (error) {
        if (error instanceof TwoFactorRequiredError) {
            const SESSION_NAME = "_ms-2fa-session";
            const session = JSON.stringify({data: error.data, type: error.type});
            sessionStorage.setItem(SESSION_NAME, session);

            navigateTo(import.meta.env.VITE_2FA_URL)
            return
        }
        throw error;
    }
})


document.addEventListener(MemberstackEvents.SIGN_UP, async () => {
    console.log('signup');
    handleLocalStoragePolling('_ms-mid', 1000, 30000);
})

document.querySelector('[data-ms-form="signup"]')?.addEventListener('submit', () => {
    console.log('signup_form_submit');
    handleLocalStoragePolling('_ms-mid', 1000, 30000);
})
