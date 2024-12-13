import { generateState } from "arctic";
import { discord } from "$lib/server/auth";
import type { RequestEvent } from "./$types";

export async function GET(event: RequestEvent): Promise<Response> {
	const state = generateState();
	const url = discord.createAuthorizationURL(state, ["identify", "connections"]);

	event.cookies.set("discord_oauth_state", state, {
		path: "/",
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: "lax"
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString()
		}
	});
}
