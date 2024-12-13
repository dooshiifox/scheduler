import type { RequestEvent } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "$lib/server/db";
import * as table from "$lib/server/db/schema";
import { Discord } from "arctic";
import {
	DISCORD_CLIENT_ID,
	DISCORD_CLIENT_SECRET,
	DISCORD_REDIRECT_URL
} from "$env/static/private";
import { ms } from "albtc";

export const discord = new Discord(DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URL);

const DAY_IN_MS = 1000 * 60 * 60 * 24;
export const SESSION_COOKIE_NAME = "auth-session";

export function generate_session_token() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function create_session(session_token: string, user_id: string) {
	const session_id = encodeHexLowerCase(sha256(new TextEncoder().encode(session_token)));
	const session: table.Session = {
		id: session_id,
		user_id,
		expires_at: new Date(Date.now() + DAY_IN_MS * 30)
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validate_session_token(session_token: string) {
	const session_id = encodeHexLowerCase(sha256(new TextEncoder().encode(session_token)));
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: {
				id: table.user.id,
				username: table.user.username,
				avatar: table.user.avatar,
				nickname: table.user.nickname
			},
			session: table.session
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.user_id, table.user.id))
		.where(eq(table.session.id, session_id));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const is_session_expired = Date.now() >= session.expires_at.getTime();
	if (is_session_expired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const should_renew_session = Date.now() >= session.expires_at.getTime() - DAY_IN_MS * 15;
	if (should_renew_session) {
		session.expires_at = new Date(Date.now() + DAY_IN_MS * 30);
		await db
			.update(table.session)
			.set({ expires_at: session.expires_at })
			.where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validate_session_token>>;

export async function invalidate_session(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}

export function set_session_token_cookie(event: RequestEvent, token: string, expires_at: Date) {
	event.cookies.set(SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		expires: expires_at,
		path: "/"
	});
}

export function delete_session_token_cookie(event: RequestEvent) {
	event.cookies.delete(SESSION_COOKIE_NAME, {
		path: "/"
	});
}

export async function get_user_details_from_discord(access_token: string): Promise<{
	id: string;
	username: string;
	avatar: string;
	global_name: string;
}> {
	const response = await fetch("https://discord.com/api/users/@me", {
		headers: {
			Authorization: `Bearer ${access_token}`
		}
	});
	return await response.json();
}

export async function get_user_from_discord_user_id(discord_user_id: string) {
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			id: table.user.id,
			username: table.user.username,
			avatar: table.user.avatar,
			nickname: table.user.nickname
		})
		.from(table.user)
		.where(eq(table.user.id, discord_user_id));

	if (!result) return null;
	return result;
}

export async function create_user(details: {
	id: string;
	username: string;
	avatar: string;
	nickname: string;
	access_token: string;
	access_token_expires_at: Date;
	refresh_token: string;
}) {
	await db.insert(table.user).values(details);
}

export async function get_discord_access_token(discord_user_id: string) {
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			access_token: table.user.access_token,
			access_token_expires_at: table.user.access_token_expires_at,
			refresh_token: table.user.refresh_token
		})
		.from(table.user)
		.where(eq(table.user.id, discord_user_id));
	if (!result) return null;

	// If the access token is expired, or will expire in < 5 minutes,
	// get a new one
	// (This is the inverse check)
	if (result.access_token_expires_at.getTime() > Date.now() + ms("5m")) {
		return result.access_token;
	}

	const tokens = await discord.refreshAccessToken(result.refresh_token);
	const access_token = tokens.accessToken();
	await db
		.update(table.user)
		.set({
			access_token,
			access_token_expires_at: tokens.accessTokenExpiresAt(),
			refresh_token: tokens.refreshToken()
		})
		.where(eq(table.user.id, discord_user_id));
	return access_token;
}
