import { shouldRedirectDueToUserRole } from "@/lib/server/utils";
import { redirect, RedirectType } from "next/navigation";


export default async function AdminPage() {
  // Prevent unauthorized users from accesing page 
  const shouldRedirect = await shouldRedirectDueToUserRole(["super_admin"]);
  if (shouldRedirect) { return redirect(shouldRedirect, RedirectType.replace); }
  return (
    <p>Admin</p>
  );
}
