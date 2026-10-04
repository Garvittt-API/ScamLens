export const TEXT_MAX_LENGTH = 4000;
export const TEXT_MIN_LENGTH = 3;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
export const URL_MAX_LENGTH = 2048;
export const HISTORY_MAX_ITEMS = 20;
export const HISTORY_STORAGE_KEY = "scamlens:history:v1";
export const SAVE_HISTORY_KEY = "scamlens:save-history:v1";

export const EXAMPLE_MESSAGE =
  "Your bank account will be blocked today. Verify immediately by sending your OTP to avoid permanent suspension.";

export const DEMO_IMAGE_ALT =
  "Your bank account will be blocked today. Send your OTP immediately to verify your account.";
