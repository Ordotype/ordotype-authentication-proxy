import {MemberstackEvents, MemberstackInterceptor} from "./lib/memberstack-proxy-wrapper";
import {AuthService} from "./lib/http";

MemberstackInterceptor()

document.addEventListener(MemberstackEvents.GET_APP, async () => {
    console.log("getApp");
    const authService = new AuthService()
    const isStatusValid = await authService.validateSessionStatus()
    if(!isStatusValid) {
        await authService.logout()
        window.location.href = "/";
        return
    }
});


