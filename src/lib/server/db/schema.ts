import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, unique } from "drizzle-orm/sqlite-core";
import type { ScheduleTime } from "../schedule";

export const user = sqliteTable("user", {
	id: text("id").primaryKey(),
	username: text("username").notNull().unique(),
	avatar: text("avatar").notNull(),
	nickname: text("nickname").notNull(),
	access_token: text("access_token").notNull(),
	access_token_expires_at: integer("access_token_expires_at", { mode: "timestamp_ms" }).notNull(),
	refresh_token: text("refresh_token").notNull()
});

export const session = sqliteTable("session", {
	id: text("id").primaryKey(),
	user_id: text("user_id")
		.notNull()
		.references(() => user.id),
	expires_at: integer("expires_at", { mode: "timestamp" }).notNull()
});

export const schedule = sqliteTable("schedule", {
	id: text("id").primaryKey(),
	owner_id: text("user_id")
		.notNull()
		.references(() => user.id),
	title: text("title"),
	description: text("description"),
	created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
	updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull()
});
export const schedule_member = sqliteTable(
	"schedule_member",
	{
		id: integer("id").primaryKey(),
		schedule_id: text("schedule_id")
			.notNull()
			.references(() => schedule.id),
		user_id: text("user_id")
			.notNull()
			.references(() => user.id),
		created_at: integer("created_at", { mode: "timestamp_ms" }).notNull(),
		updated_at: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
		color: text("color").notNull(),
		nickname: text("nickname"),
		available_times: text("available_times", { mode: "json" })
			.$type<Array<ScheduleTime>>()
			.notNull()
	},
	(t) => ({
		unique: unique().on(t.schedule_id, t.user_id)
	})
);

export const user_relations = relations(user, ({ many }) => ({
	sessions: many(session),
	owned_schedules: many(schedule),
	schedules: many(schedule_member)
}));
export const session_relations = relations(session, ({ one }) => ({
	user: one(user, { fields: [session.user_id], references: [user.id] })
}));
export const schedule_relations = relations(schedule, ({ one, many }) => ({
	owner: one(user, { fields: [schedule.owner_id], references: [user.id] }),
	members: many(schedule_member)
}));
export const schedule_member_relations = relations(schedule_member, ({ one }) => ({
	schedule: one(schedule, { fields: [schedule_member.schedule_id], references: [schedule.id] }),
	user: one(user, { fields: [schedule_member.user_id], references: [user.id] })
}));

export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Schedule = typeof schedule.$inferSelect;
export type ScheduleMember = typeof schedule_member.$inferSelect;
