import { z } from "zod";

export const signInFormDataSchema = z.object({
  email: z.string().email("Ogilitig epost").min(5, "Eposten måste vara minst 5 tecken lång").max(255, "Eposten får inte vara längre än 255 tecken"),
  password: z.string().min(6, "Lösenord måste vara minst 6 tecken långt").max(100, "Lösenord får inte vara längre än 100 tecken"),
});

export type ISignInFormData = z.infer<typeof signInFormDataSchema>;

