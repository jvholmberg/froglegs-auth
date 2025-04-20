import { z } from "zod";

export const apiUserSchema = z.object({
  id: z.number(),
  externalPartitionId: z.number().default(0),
  externalOrganizationId: z.number().default(0),
  externalId: z.number().default(0),
  email: z.string(),
  role: z.enum(["super_admin", "admin", "manager", "user", "guest"]),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

export type EApiUser = z.infer<typeof apiUserSchema>;
