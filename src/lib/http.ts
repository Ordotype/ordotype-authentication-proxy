import { ValidateSessionResponse} from "../types/AuthenticationSchema";
import {getDeviceId} from "./getDeviceId";

const BASE_URL = import.meta.env.VITE_API_URL;

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
            ...(body && { body: JSON.stringify(body) }),
        };

        try {
            const response = await fetch(url, options);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            return (await response.json()) as TResponse;
        } catch (error) {
            console.error("API Request Failed:", error);
            throw error;
        }
    }

    async validateSessionStatus(): Promise<ValidateSessionResponse> {
        try {
            // Fetch the member token from localStorage
            const memberToken = localStorage.getItem("_ms-mid");

            return await this.request<ValidateSessionResponse>(
                "validate-session-status",
                'auth',
                "POST",
                null,
                { Authorization: `Bearer ${memberToken}` }
            );
        } catch (error) {
            console.error("Session validation failed:", error);
            throw error;
        }
    }
}

export {AuthService};