import {
	create_session,
	create_user,
	discord,
	generate_session_token,
	get_user_details_from_discord,
	get_user_from_discord_user_id,
	set_session_token_cookie
} from "$lib/server/auth";
import type { OAuth2Tokens } from "arctic";
import type { RequestEvent } from "../$types";

export async function GET(event: RequestEvent): Promise<Response> {
	const code = event.url.searchParams.get("code");
	const state = event.url.searchParams.get("state");
	const storedState = event.cookies.get("discord_oauth_state") ?? null;

	if (code === null || state === null || storedState === null) {
		return new Response("Missing parameters", {
			status: 400
		});
	}
	if (state !== storedState) {
		return new Response("`discord_oauth_state` does not match `state`", {
			status: 400
		});
	}

	let tokens: OAuth2Tokens;
	try {
		tokens = await discord.validateAuthorizationCode(code);
	} catch (_) {
		// Invalid code or client credentials
		return new Response("Invalid authorization code", {
			status: 400
		});
	}
	const accessToken = tokens.accessToken();
	const accessTokenExpiresAt = tokens.accessTokenExpiresAt();
	const refreshToken = tokens.refreshToken();
	console.log(accessToken, accessTokenExpiresAt, refreshToken);

	const discordUserDetails = await get_user_details_from_discord(accessToken);
	const existingUser = await get_user_from_discord_user_id(discordUserDetails.id);
	if (existingUser === null) {
		await create_user({
			id: discordUserDetails.id,
			username: discordUserDetails.username,
			avatar: discordUserDetails.avatar,
			nickname: discordUserDetails.global_name,
			access_token: accessToken,
			access_token_expires_at: accessTokenExpiresAt,
			refresh_token: refreshToken
		});
	}

	const sessionToken = generate_session_token();
	const session = await create_session(sessionToken, discordUserDetails.id);
	set_session_token_cookie(event, sessionToken, session.expiresAt);
	return new Response(null, {
		status: 302,
		headers: {
			Location: "/"
		}
	});
}
