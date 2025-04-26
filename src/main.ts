import {MemberstackEvents, MemberstackInterceptor} from "./lib/memberstack-proxy-wrapper";
import {AuthError, AuthService} from "./lib/http";
import {isMemberLoggedIn} from "./lib/utils";

MemberstackInterceptor()

document.addEventListener(MemberstackEvents.GET_APP, async () => {
    console.log("getApp");

    if (!isMemberLoggedIn()) {
        return
    }
    const authService = new AuthService();
    try {
        const isStatusValid = await authService.validateSessionStatus()
        if (isStatusValid === false) {
            await authService.logout()
            window.location.href = "/";
            return
        }
    } catch (error) {
        if (error instanceof AuthError) {
            if(error.status === 401 || error.status === 403)
                await authService.logout()
                window.location.href = "/";
                return
        }
    }
});


