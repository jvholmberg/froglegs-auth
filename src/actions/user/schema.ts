import { z } from "zod";

export const updateUserDetailsFormDataSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

export type IUpdateUserDetailsFormData = z.infer<typeof updateUserDetailsFormDataSchema>;

