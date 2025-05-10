import type {LoginMemberEmailPasswordParams} from "@memberstack/dom";

type ValidateSessionResponse = boolean;
export type TwoFactorRequiredResponse = {
    data: {
        memberId: string,
        email: string,
        phone: string
    },
    type: AuthResponse
}

type ObjectValues<T> = T[keyof T];

export type AuthResponse = ObjectValues<typeof AUTH_RESPONSE_TYPES>;

export const AUTH_RESPONSE_TYPES = {
    firstLogin: "first_login",
    otpRequired: "otp_required",
} as const;

interface AuthLoginParams extends LoginMemberEmailPasswordParams {
    device: string;
    options?: {
        includeContentGroups: boolean;
        isWebflow: boolean;
    };
}

interface AuthSignupParams {
    token: string;
}

export type {
    AuthLoginParams,
    ValidateSessionResponse,
    AuthSignupParams
};
