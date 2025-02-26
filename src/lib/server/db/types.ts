import { InferSelectModel } from "drizzle-orm";
import * as schema from "./schema";

export type TblUser = InferSelectModel<typeof schema.userTable>;
export type TblSession = InferSelectModel<typeof schema.sessionTable>;
export type TblPasswordResetSession = InferSelectModel<typeof schema.passwordResetSessionTable>;
export type TblEmailVerificationRequest = InferSelectModel<typeof schema.emailVerificationRequestTable>;
export type TblApp = InferSelectModel<typeof schema.appTable>;
export type TblUserApp = InferSelectModel<typeof schema.userAppTable>;
export type TblAppInvitation = InferSelectModel<typeof schema.appInvitationTable>;
