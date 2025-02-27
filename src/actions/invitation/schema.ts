import { z } from "zod";

export const createAppInvitationFormDataSchema = z.object({
  appId: z.number(),
  email: z.string().email(),
  role: z.enum(["super_admin", "admin", "manager", "user", "guest"]),
  organizationId: z.string().nullable(),
});
export const acceptAppInvitationFormDataSchema = z.object({
  id: z.number(),
});
export const declineAppInvitationFormDataSchema = z.object({
  id: z.number(),
});

export type ICreateAppInvitationFormData = z.infer<typeof createAppInvitationFormDataSchema>;
export type IAcceptAppInvitationFormData = z.infer<typeof acceptAppInvitationFormDataSchema>;
export type IDeclineAppInvitationFormData = z.infer<typeof declineAppInvitationFormDataSchema>;

