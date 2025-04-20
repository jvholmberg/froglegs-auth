import { z } from "zod";

export const updateEmailFormDataSchema = z.object({
  email: z.string().email(),
});

export type IUpdateEmailFormData = z.infer<typeof updateEmailFormDataSchema>;

