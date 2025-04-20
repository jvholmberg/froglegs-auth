import { z } from "zod";

export const updatePasswordFormDataSchema = z.object({
  password: z.string().min(6).max(100),
  passwordNew: z.string().min(6).max(100),
});

export type IUpdatePasswordFormData = z.infer<typeof updatePasswordFormDataSchema>;

