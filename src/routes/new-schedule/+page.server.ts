import { SESSION_COOKIE_NAME, validate_session_token } from "$lib/server/auth";
import { create_schedule } from "$lib/server/schedule.js";
import { error, redirect } from "@sveltejs/kit";

export const actions = {
	create: async ({ cookies, request }) => {
		const session_token = cookies.get(SESSION_COOKIE_NAME);
		if (!session_token) {
			redirect(302, "/login/discord");
		}
		const { session, user } = await validate_session_token(session_token);
		if (!session || !user) {
			redirect(302, "/login/discord");
		}

		const form_data = await request.formData();
		const title = form_data.get("title")?.toString();
		const description = form_data.get("description")?.toString();
		if (!title || title.length > 50 || (description && description.length > 200)) {
			error(400);
		}

		const id = await create_schedule(user.id, title, description ?? "");
		redirect(302, "/schedule/" + id);
	}
};
