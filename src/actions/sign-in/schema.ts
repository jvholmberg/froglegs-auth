import { z } from "zod";

export const signInFormDataSchema = z.object({
  email: z.string().email().min(5).max(255),
  password: z.string().min(6).max(100),
});

export type ISignInFormData = z.infer<typeof signInFormDataSchema>;

