import { z } from "zod";

export const updateUserDetailsFormDataSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

export type IUpdateUserDetailsFormData = z.infer<typeof updateUserDetailsFormDataSchema>;
