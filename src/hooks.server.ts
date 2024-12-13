import { sequence } from "@sveltejs/kit/hooks";
import { i18n } from "$lib/i18n";
import type { Handle } from "@sveltejs/kit";
import * as auth from "$lib/server/auth.js";

const handleAuth: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get(auth.SESSION_COOKIE_NAME);
	if (!sessionToken) {
		event.locals.user = null;
		event.locals.session = null;
		return resolve(event);
	}

	const { session, user } = await auth.validate_session_token(sessionToken);
	if (session) {
		auth.set_session_token_cookie(event, sessionToken, session.expiresAt);
	} else {
		auth.delete_session_token_cookie(event);
	}

	event.locals.user = user;
	event.locals.session = session;

	return resolve(event);
};

const handleParaglide: Handle = i18n.handle();
export const handle: Handle = sequence(handleAuth, handleParaglide);
