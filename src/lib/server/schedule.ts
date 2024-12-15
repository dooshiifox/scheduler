import { db } from "./db";
import * as table from "$lib/server/db/schema";
import * as v from "valibot";
import { and, desc, eq } from "drizzle-orm";

const COLORS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#84cc16",
	"#06b6d4",
	"#6366f1",
	"#a855f7",
	"#e879f9"
];
function get_random_color() {
	return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function random_z_base_32(bits: number) {
	const TABLE = "ybndrfg8ejkmcpqxot1uwisza345h769";
	const length = Math.floor(bits / 5);
	const remainder = bits % 5;
	let str = "";
	for (let i = 0; i < length; i++) {
		str += TABLE[Math.floor(Math.random() * 32)];
	}
	if (remainder !== 0) {
		str += TABLE[Math.floor(Math.random() * 2 ** remainder)];
	}
	return str;
}

export async function create_schedule(user_id: string, title: string, description: string) {
	// Generate a random zbase32 string
	const schedule_id = random_z_base_32(64);
	await db.insert(table.schedule).values({
		id: schedule_id,
		title,
		description,
		owner_id: user_id,
		created_at: new Date(),
		updated_at: new Date()
	});
	await db.insert(table.schedule_member).values({
		schedule_id,
		user_id: user_id,
		available_times: [],
		color: get_random_color(),
		created_at: new Date(),
		updated_at: new Date()
	});
	return schedule_id;
}
/** Returns a boolean of whether it was successful. */
export async function update_schedule(schedule_id: string, title: string, description: string) {
	const updated = await db
		.update(table.schedule)
		.set({
			title,
			description,
			updated_at: new Date()
		})
		.where(eq(table.schedule.id, schedule_id));
	return updated.changes > 0;
}
export async function get_schedule(schedule_id: string) {
	const schedule = await db.query.schedule.findFirst({
		where: eq(table.schedule.id, schedule_id),
		columns: {
			id: true,
			title: true,
			description: true,
			created_at: true
		},
		with: {
			owner: {
				columns: {
					id: true,
					avatar: true,
					username: true,
					nickname: true
				},
				with: {
					schedules: {
						columns: {
							nickname: true
						},
						where: eq(table.schedule_member.schedule_id, schedule_id)
					}
				}
			},
			members: {
				columns: {
					nickname: true,
					color: true,
					available_times: true
				},
				with: {
					user: {
						columns: {
							id: true,
							avatar: true,
							username: true,
							nickname: true
						}
					}
				}
			}
		}
	});
	if (!schedule) return null;

	return {
		...schedule,
		owner: {
			id: schedule.owner.id,
			username: schedule.owner.username,
			avatar: schedule.owner.avatar,
			nickname: schedule.owner.schedules[0]?.nickname ?? schedule.owner.nickname
		},
		members: schedule.members.map((member) => ({
			id: member.user.id,
			username: member.user.username,
			avatar: member.user.avatar,
			nickname: member.nickname ?? member.user.nickname,
			available_times: member.available_times,
			color: member.color
		}))
	};
}
export async function join_schedule(schedule_id: string, user_id: string) {
	await db.insert(table.schedule_member).values({
		schedule_id,
		user_id,
		available_times: [],
		color: get_random_color(),
		created_at: new Date(),
		updated_at: new Date()
	});
}
export async function remove_from_schedule(schedule_id: string, user_id: string) {
	await db
		.delete(table.schedule_member)
		.where(
			and(
				eq(table.schedule_member.schedule_id, schedule_id),
				eq(table.schedule_member.user_id, user_id)
			)
		);
}
export async function all_schedules(user_id: string) {
	const r = await db.query.schedule_member.findMany({
		columns: {},
		orderBy: desc(table.schedule.updated_at),
		with: {
			schedule: {
				columns: {
					id: true,
					description: true,
					title: true,
					updated_at: true
				},
				with: {
					owner: {
						columns: {
							username: true,
							nickname: true,
							avatar: true
						},
						with: {
							schedules: {
								columns: {
									color: true,
									nickname: true
								},
								where: eq(table.schedule_member.user_id, table.schedule.owner_id)
							}
						}
					}
				}
			}
		},
		where: eq(table.schedule_member.user_id, user_id)
	});
	return r.map((c) => c.schedule);
}

export const v_schedule_time = v.object({
	start: v.date(),
	end: v.date(),
	// Whether the user knows they will be available or whether they assume it
	potentially_available: v.nullable(v.boolean(), false),
	note: v.nullable(v.pipe(v.string(), v.maxLength(200)))
});
export type ScheduleTime = v.InferOutput<typeof v_schedule_time>;

/** Returns a boolean of whether it was successful. */
export async function update_schedule_times(
	schedule_id: string,
	user_id: string,
	timeslots: Array<ScheduleTime>
) {
	const updated_at = new Date();
	const updated = await db
		.update(table.schedule_member)
		.set({
			available_times: timeslots,
			updated_at
		})
		.where(
			and(
				eq(table.schedule_member.schedule_id, schedule_id),
				eq(table.schedule_member.user_id, user_id)
			)
		);
	if (updated.changes === 0) return false;

	await db
		.update(table.schedule)
		.set({
			updated_at
		})
		.where(eq(table.schedule.id, schedule_id));
	return true;
}
/** Returns a boolean of whether it was successful. */
export async function update_schedule_name_and_color(
	schedule_id: string,
	user_id: string,
	nickname: string | null | undefined,
	color: string | undefined
) {
	const set: Partial<table.ScheduleMember> = {
		updated_at: new Date()
	};
	if (color !== undefined) {
		set.color = color;
	}
	if (nickname !== undefined) {
		set.nickname = nickname;
	}

	const updated = await db
		.update(table.schedule_member)
		.set(set)
		.where(
			and(
				eq(table.schedule_member.schedule_id, schedule_id),
				eq(table.schedule_member.user_id, user_id)
			)
		);
	if (updated.changes === 0) return false;

	await db
		.update(table.schedule)
		.set({
			updated_at: set.updated_at
		})
		.where(eq(table.schedule.id, schedule_id));
	return true;
}
