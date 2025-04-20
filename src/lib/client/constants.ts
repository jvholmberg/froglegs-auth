
export const ROUTE_HOME = "/";
export const ROUTE_SIGN_IN = "/sign-in";
export const ROUTE_SIGN_UP = "/sign-up";
export const ROUTE_VERIFY_EMAIL = "/verify-email";
export const ROUTE_FORGOT_PASSWORD = "/forgot-password";

export const ROUTE_2FA = "/2fa";
export const ROUTE_2FA_SETUP = "/2fa/setup";
export const ROUTE_2FA_RESET = "/2fa/reset";

export const ROUTE_SETTINGS = "/settings";
export const ROUTE_SETTINGS_UPDATE_EMAIL = "/settings/update-email";
export const ROUTE_SETTINGS_UPDATE_PASSWORD = "/settings/update-password";

export const ROUTE_RESET_PASSWORD = "/reset-password";
export const ROUTE_RESET_PASSWORD_2FA = "/reset-password/2fa";
export const ROUTE_RESET_PASSWORD_VERIFY_EMAIL = "/reset-password/verify-email";

export const ROUTE_ACCOUNT = "/account";
export const ROUTE_INVITATIONS = "/invitations";
export const ROUTE_INVITATIONS_SEND = "/invitations/send";
export const ROUTE_ADMIN = "/admin";
export const ROUTE_RECOVERY_CODE = "/recovery-code";

export const TWO_FACTOR_MANDATORY = process.env.TWO_FACTOR_MANDATORY === "1";
export const APP_DISPLAY_NAME = process.env.APP_DISPLAY_NAME || "Unknown";
