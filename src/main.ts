import {MemberstackEvents, MemberstackInterceptor} from "./lib/memberstack-proxy-wrapper";
import {AuthService} from "./lib/http";
import {isMemberLoggedIn} from "./lib/utils";

MemberstackInterceptor()

document.addEventListener(MemberstackEvents.GET_APP, async () => {
    console.log("getApp");

    if (!isMemberLoggedIn()) {
        return
    }
    const authService = new AuthService();
    const isStatusValid = await authService.validateSessionStatus()
    if(isStatusValid === false) {
        await authService.logout()
        window.location.href = "/";
        return
    }
});


