import { z } from "zod";

export const twoFactorSetupFormDataSchema = z.object({
  key: z.string().length(28),
  code: z.string(),
});

export const twoFactorVerifyFormDataSchema = z.object({
  code: z.string(),
});

export const twoFactorResetFormDataSchema = z.object({
  code: z.string(),
});

export type ITwoFactorSetupFormData = z.infer<typeof twoFactorSetupFormDataSchema>;
export type ITwoFactorVerifyFormData = z.infer<typeof twoFactorVerifyFormDataSchema>;
export type ITwoFactorResetFormData = z.infer<typeof twoFactorResetFormDataSchema>;

