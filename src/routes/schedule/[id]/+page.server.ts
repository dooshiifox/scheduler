import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { get_schedule } from "$lib/server/schedule";

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, "/login/discord");
	}

	const schedule = await get_schedule(event.params.id);
	return { user: event.locals.user, schedule };
};
