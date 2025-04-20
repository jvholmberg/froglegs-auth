import { z } from "zod";

export const updateUserAppFormDataSchema = z.object({
  partitionId: z.number(),
  organizationId: z.number().optional(),
  accountId: z.number().optional(),
});

export type IUpdateUserAppFormData = z.infer<typeof updateUserAppFormDataSchema>;
