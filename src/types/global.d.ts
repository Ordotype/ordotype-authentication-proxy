import type { default as MsTypes } from "@memberstack/dom/lib/index";

export type MemberstackDom = ReturnType<typeof MsTypes.init>;

declare global {
    interface Window {
        $memberstackReady: boolean;
        $memberstackDom: MemberstackDom;
        _msConfig?: {
            verifyPageLoad?: boolean;
            preventLogin?: boolean;
        };
    }
}