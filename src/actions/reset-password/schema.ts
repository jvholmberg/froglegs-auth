import { z } from "zod";

export const resetPasswordFormDataSchema = z.object({
  password: z.string().min(6).max(100),
});

export const passwordResetEmailVerificationFormDataSchema = z.object({
  code: z.string().length(8),
});

export const passwordResetRecoveryCodeFormDataSchema = z.object({
  code: z.string(),
});

export const passwordResetTotpFormDataSchema = z.object({
  code: z.string(),
});

export type IResetPasswordFormData = z.infer<typeof resetPasswordFormDataSchema>;
export type IPasswordResetEmailVerificationFormData = z.infer<typeof passwordResetEmailVerificationFormDataSchema>;
export type IPasswordResetRecoveryCodeFormData = z.infer<typeof passwordResetRecoveryCodeFormDataSchema>;
export type IPasswordResetTOTPFormData = z.infer<typeof passwordResetTotpFormDataSchema>;

