import {AuthResponse, TwoFactorRequiredResponse, ValidateSessionResponse} from "../types/AuthenticationSchema";
import {getDeviceId} from "./getDeviceId";
import {isMemberLoggedIn} from "./utils";
import {LoginMemberEmailPasswordParams, LoginMemberEmailPasswordPayload} from "@memberstack/dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export class AuthError extends Error {
    status: number;

    constructor(message: string, status: number = 500) {
        super(message);
        this.name = "AuthError";
        this.status = status;

        // Maintain proper stack trace for where the error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AuthError);
        }
    }
}

export class TwoFactorRequiredError extends Error {
    data: {
        memberId: string,
        email: string,
        phone: string | null
    }
    type: AuthResponse

    constructor(message: string, data: {
        memberId: string,
        email: string,
        phone: string | null
    }, type: AuthResponse) {
        super(message);
        this.name = "TwoFactorRequiredError";
        this.data = data
        this.type = type
    }
}

class AuthService {
    private readonly headers: {
        "X-Session-Id"?: string;
        "X-Api-Key": string;
        "X-Device-Id"?: string;
    };

    constructor() {
        // Securely fetch API key from environment variables
        const apiKey = import.meta.env.VITE_MS_PUBLIC_KEY;
        const sessionId = window.localStorage.getItem("ms_session_id");
        const deviceId = getDeviceId();

        if (!apiKey) {
            throw new Error("Missing API key for AuthService");
        }

        // Set custom headers for AuthService
        this.headers = {
            "X-Api-Key": apiKey,
            "X-Session-Id": sessionId ?? undefined,
            "X-Device-Id": deviceId ?? undefined,
        };
    }

    private async request<TResponse>(
        endpoint: string,
        entity: string,
        method: string = "GET",
        body: any = null,
        additionalHeaders: Record<string, string> = {}
    ): Promise<TResponse> {
        const url = `${BASE_URL}/${entity}/${endpoint}`;
        const headers = {
            "Content-Type": "application/json",
            ...this.headers,
            ...additionalHeaders,
        };

        const options: RequestInit = {
            method,
            headers,
            ...(body && {body: JSON.stringify(body)}),
        };

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new AuthError(response.statusText, response.status);
            }

            return (await response.json()) as TResponse;
        } catch (error) {
            console.error("API Request Failed:", error);
            throw error;
        }
    }

    async validateSessionStatus(): Promise<ValidateSessionResponse | null> {
        try {
            // Fetch the member token from localStorage
            if (!isMemberLoggedIn()) {
                return null
            }
            const memberToken = localStorage.getItem("_ms-mid");
            return await this.request<ValidateSessionResponse>(
                "validate-session-status",
                'auth',
                "POST",
                null,
                {Authorization: `Bearer ${memberToken}`}
            );
        } catch (error) {
            console.error("Session validation failed:", error);
            throw error;
        }
    }

    async logout(): Promise<void> {
        try {
            // Fetch the member token from localStorage
            if (!isMemberLoggedIn()) {
                return
            }
            const memberToken = localStorage.getItem("_ms-mid");
            await this.request<void>(
                "logout",
                'auth',
                "POST",
                null,
                {Authorization: `Bearer ${memberToken}`}
            );
            localStorage.removeItem("_ms-mid");
        } catch (error) {
            console.error("Session logout failed:", error);
            throw error;
        }
    }

    async login(params: LoginMemberEmailPasswordParams) {
        const res = await this.request<TwoFactorRequiredResponse | LoginMemberEmailPasswordPayload>(
            "login",
            "auth",
            "POST",
            params,
            {}
        );

        if (isTwoFactorRequiredResponse(res)) {
            throw new TwoFactorRequiredError('2fa required', res.data, res.type)
        }
        return res as LoginMemberEmailPasswordPayload
    }

    // Helper to get a cookie
    private getCookie(name: string): string | null {
        const matches = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return matches ? decodeURIComponent(matches[2]) : null;
    }

    // Helper to set a cookie with expiration time
    private setCookie(name: string, value: string, expirationMs: number): void {
        const date = new Date();
        date.setTime(date.getTime() + expirationMs);
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${date.toUTCString()}; path=/`;
    }


    // Reusable throttle function
    private async throttle<T>(
        method: () => Promise<T>, // The method to execute (e.g., API call)
        identifier: string, // Unique key to track this throttle
        interval: number // Throttle interval in milliseconds
    ): Promise<T | null> {
        const lastExecution = this.getCookie(identifier);
        const now = Date.now();

        // Check if the method was executed within the throttle interval
        if (lastExecution && now - parseInt(lastExecution, 10) < interval) {
            console.log(`Skipping execution of ${identifier}: Throttled.`);
            return null; // Skip execution
        }

        console.log(`Executing ${identifier}...`);

        // Execute the method, then update the throttle cookie
        const result = await method();
        this.setCookie(identifier, now.toString(), interval);
        return result;
    }

    // Public wrapper for validateSessionStatus with throttling
    public validateSessionStatusThrottled(): Promise<ValidateSessionResponse | null> {
        const memberToken = localStorage.getItem("_ms-mid");

        if (!memberToken) {
            return Promise.resolve(null)
        }

        return this.throttle(
            () => this.validateSessionStatus(),
            "lastSessionValidation",
            3 * 60 * 1000 // 3 minutes throttle interval
        );
    }

}

function isTwoFactorRequiredResponse(
    response: TwoFactorRequiredResponse | LoginMemberEmailPasswordPayload
): response is TwoFactorRequiredResponse {
    return 'data' in response && typeof response.data === 'object' && 'type' in response.data;
}

export {AuthService};