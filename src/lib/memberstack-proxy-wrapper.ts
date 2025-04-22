import type { default as MsTypes } from "@memberstack/dom/lib/index";

const MemberstackEvents = {
    LOGOUT: "memberstack.logout",
    GET_APP: "memberstack.getApp",
    LOGIN: "memberstack.login",
};

function MemberstackInterceptor() {
    if (!window._msConfig) {
        window._msConfig = {
            preventLogin: true,
        };
    }
    window.$memberstackDom = new Proxy(window.$memberstackDom, {
        get(
            target: ReturnType<typeof MsTypes.init>,
            propKey: keyof ReturnType<typeof MsTypes.init>
        ) {
            const originalMethod = target[propKey];

            if (typeof originalMethod === "function") {
                // Return a wrapped function that logs and calls the original method
                return async function (...args: any[]) {
                    console.log(
                        `Method ${propKey} called with arguments: ${JSON.stringify(args)}`
                    );
                    if (propKey === "logout") {
                        const evt = new Event(MemberstackEvents.LOGOUT, {
                            bubbles: false,
                            cancelable: false,
                        });
                        document.dispatchEvent(evt);
                    }
                    if (propKey === "getApp") {
                        const evt = new Event(MemberstackEvents.GET_APP, {
                            bubbles: false,
                            cancelable: false,
                        });
                        document.dispatchEvent(evt);
                    }
                    if (propKey === "loginMemberEmailPassword") {
                        const evt = new Event(MemberstackEvents.LOGIN, {
                            bubbles: false,
                            cancelable: false,
                        });
                        document.dispatchEvent(evt);

                        // Prevent login
                        return window._msConfig?.preventLogin && false;
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
