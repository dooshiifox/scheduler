import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { all_schedules } from "$lib/server/schedule";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, "/login/discord");
	}

	const schedules = await all_schedules(event.locals.user.id);
	return { user: event.locals.user, schedules };
};
