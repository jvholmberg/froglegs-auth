import { z } from "zod";

export const forgotPasswordFormDataSchema = z.object({
  email: z.string().email().min(5).max(255),
});

export type IForgotPasswordFormData = z.infer<typeof forgotPasswordFormDataSchema>;

