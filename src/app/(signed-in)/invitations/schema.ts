import { z } from "zod";

export const createAppInvitationFormDataSchema = z.object({
  appSlug: z.string(),
  partitionId: z.number().nullable().optional(),
  organizationId: z.number().nullable().optional(),
  email: z.string().email(),
  roleSlug: z.enum(["super_admin", "admin", "manager", "user", "guest"]).nullable(),
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

