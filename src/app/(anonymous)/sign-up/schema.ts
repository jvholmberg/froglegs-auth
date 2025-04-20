import { z } from "zod";

export const signUpFormDataSchema = z.object({
  email: z.string().email().min(5).max(255),
  password: z.string().min(6).max(100),
  passwordVerify: z.string().min(6).max(100),
});

export type ISignUpFormData = z.infer<typeof signUpFormDataSchema>;

