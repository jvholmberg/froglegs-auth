import { z } from "zod";

export const verifyEmailFormDataSchema = z.object({
  code: z.string().length(8),
});

export type IVerifyEmailFormData = z.infer<typeof verifyEmailFormDataSchema>;

