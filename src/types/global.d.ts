import type { default as MsTypes } from "@memberstack/dom/lib/index";

declare global {
    interface Window {
        $memberstackReady: boolean;
        $memberstackDom: ReturnType<typeof MsTypes.init>;
        _msConfig?: {
            verifyPageLoad?: boolean;
            preventLogin?: boolean;
        };
    }
}