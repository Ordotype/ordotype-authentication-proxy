import {MemberstackEvents, MemberstackInterceptor} from "./lib/memberstack-proxy-wrapper";
import {AuthError, AuthService} from "./lib/http";
import {isMemberLoggedIn} from "./lib/utils";

MemberstackInterceptor()
const authService = new AuthService();

document.addEventListener(MemberstackEvents.GET_APP, async () => {
    console.log("getApp");

    if (!isMemberLoggedIn()) {
        return
    }
    try {
        const isStatusValid = await authService.validateSessionStatus()
        if (isStatusValid === false) {
            await window.$memberstackDom.logout()
            window.location.href = "/";
            return
        }
    } catch (error) {
        if (error instanceof AuthError) {
            if(error.status === 401 || error.status === 403)
                await window.$memberstackDom.logout()
                window.location.href = "/";
                return
        }
    }
});

document.addEventListener(MemberstackEvents.LOGOUT, async () => {
    console.log("logout");

    await authService.logout();
    localStorage.removeItem("_ms-mid");
    localStorage.removeItem("_ms_mem")
})


