import { delete_session_token_cookie, invalidate_session } from "$lib/server/auth";
import { fail, redirect, type RequestEvent } from "@sveltejs/kit";

export async function GET(event: RequestEvent) {
	if (!event.locals.session) {
		return fail(401);
	}
	await invalidate_session(event.locals.session.id);
	delete_session_token_cookie(event);

	return redirect(302, "/login/discord");
}
