import type { SignupMemberEmailPasswordParams, LoginMemberEmailPasswordParams,} from "@memberstack/dom";
import type {MemberstackDom} from "../types/global";

const MemberstackEvents = {
    LOGOUT: "memberstack.logout",
    GET_APP: "memberstack.getApp",
    LOGIN: "memberstack.login",
    VALID_SESSION: "memberstack.validSession",
    SIGN_UP: "memberstack.signUp",
};

function MemberstackInterceptor(memberstackInstance: MemberstackDom) {
    if (!window._msConfig) {
        window._msConfig = {
            preventLogin: true,
        };
    }
    window.$memberstackDom = new Proxy(memberstackInstance, {
        get(
            target: MemberstackDom,
            propKey: keyof MemberstackDom
        ) {
            const originalMethod = target[propKey];

            if (typeof originalMethod === "function") {
                // Return a wrapped function that logs and calls the original method
                return async function (...args: any[]) {
                    console.log(
                        `Method ${propKey} called with arguments: ${JSON.stringify(args)}`
                    );
                    if (propKey === "logout") {
                        const evt = new CustomEvent(MemberstackEvents.LOGOUT, {
                            bubbles: false,
                            cancelable: false,
                            detail: args[0] as unknown as {isExpired?: boolean}
                        });
                        document.dispatchEvent(evt);
                        return false
                    }
                    if (propKey === "getApp") {
                        const evt = new Event(MemberstackEvents.GET_APP, {
                            bubbles: false,
                            cancelable: false,
                        });
                        document.dispatchEvent(evt);
                    }
                    if (propKey === "loginMemberEmailPassword") {
                        const evt = new CustomEvent(MemberstackEvents.LOGIN, {
                            bubbles: false,
                            cancelable: false,
                            detail: args[0] as unknown as LoginMemberEmailPasswordParams
                        });
                        document.dispatchEvent(evt);

                        // Prevent login
                        return window._msConfig?.preventLogin && false;
                    }
                    if(propKey === "signupMemberEmailPassword") {
                        const evt = new CustomEvent(MemberstackEvents.SIGN_UP, {
                            bubbles: false,
                            cancelable: false,
                            detail: args[0] as unknown as SignupMemberEmailPasswordParams
                        });
                        document.dispatchEvent(evt);
                        return false;
                    }
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-expect-error
                    return originalMethod.apply(target, args);
                };
            }
            // If not a function, just return the property
            return originalMethod;
        },
    });
}

export { MemberstackInterceptor, MemberstackEvents };
