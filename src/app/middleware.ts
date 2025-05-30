import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// TODO: Control CORS from here instead of next.config.js due to the increased control we can achieve here.
// const allowedOrigins = [
//   "https://admin.centrumappen.se",
//   "https://minasidor.fanhults.se",
//   "https://minasidor.entremattan.se",
// ];

// const corsOptions = {
//   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
//   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
// }


export async function middleware(request: NextRequest): Promise<NextResponse> {
	if (request.method === "GET") {
		const response = NextResponse.next();
		const token = request.cookies.get("session")?.value ?? null;
		if (token !== null) {
			// Only extend cookie expiration on GET requests since we can be sure
			// a new session wasn't set when handling the request.
			response.cookies.set("session", token, {
				path: "/",
				maxAge: 60 * 60 * 24 * 30,
				sameSite: "lax",
				httpOnly: true,
				secure: process.env.NODE_ENV === "production"
			});
		}
		return response;
	}

	// CSRF protection
  const originHeader = request.headers.get("Origin");
	const hostHeader = request.headers.get("X-Forwarded-Host");

	if (originHeader === null || hostHeader === null) {
		return new NextResponse(null, {
			status: 403
		});
	}
	let origin: URL;
	try {
		origin = new URL(originHeader);
	} catch {
		return new NextResponse(null, {
			status: 403
		});
	}
	if (origin.host !== hostHeader) {
		return new NextResponse(null, {
			status: 403
		});
	}
	return NextResponse.next();
}
