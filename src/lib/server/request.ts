/***** IMPORTANT! ***************************************************************/
import "server-only";
/********************************************************************************/

import { headers } from "next/headers";
import { RefillingTokenBucket } from "@/lib/server/rate-limit";

export const globalBucket = new RefillingTokenBucket<string>(100, 1);

export async function globalGETRateLimit() {
  const headerStore = await headers();
	let clientIP = headerStore.get("X-Forwarded-For");

  // So that we may test rate-limiting during development
  if (process.env.development === "development") {
    clientIP = "localhost";
  }

	if (clientIP === null) {
		return true;
	}
	return globalBucket.consume(clientIP, 1);
}

export async function globalPOSTRateLimit() {
  const headerStore = await headers();
	let clientIP = headerStore.get("X-Forwarded-For");

  // So that we may test rate-limiting during development
  if (process.env.development === "development") {
    clientIP = "localhost";
  }

	if (clientIP === null) {
		return true;
	}
	return globalBucket.consume(clientIP, 3);
}
