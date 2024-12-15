<script lang="ts">
	import type { PageServerData } from "./$types";
	import Avatar from "$lib/Avatar.svelte";
	import * as m from "$lib/paraglide/messages";
	import Calendar from "./Calendar.svelte";
	import { copyText } from "albtc";
	import { page } from "$app/stores";
	import { popup } from "$lib/popup.svelte";

	let { data }: { data: PageServerData } = $props();
	let { schedule } = $derived(data);

	const copyUrlPopup = popup({
		event: "custom",
		placement: "bottom"
	});
</script>

{#if !schedule}
	<div class="flex flex-col items-center justify-center px-6">
		<p class="text-9xl font-bold text-slate-300">?</p>
		<p class="text-2xl">{m.schedule_not_found()}</p>
		<p class="mt-4 text-center text-lg">
			{m.schedule_not_found_subtext()}<a
				href="/new-schedule"
				class="text-blue-600 hover:text-blue-500 focus-visible:text-blue-500 active:text-blue-500"
				>{m.schedule_not_found_create()}</a
			>
		</p>
	</div>
{:else}
	<div class="mx-auto flex max-w-lg flex-col gap-2 px-6">
		<div class="flex flex-row items-center justify-between gap-6">
			<h2 class="text-3xl font-bold">{schedule.title}</h2>

			<div class="relative">
				<button
					class="rounded p-2 text-slate-500 ring-2 ring-transparent transition-colors duration-75 hover:bg-slate-300 hover:text-slate-800 focus:outline-none focus-visible:ring-blue-500 active:bg-slate-300 active:text-slate-800"
					onclick={() => {
						copyText($page.url.toString());
						copyUrlPopup.trigger();
					}}
					use:copyUrlPopup.button
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-6"
					>
						<title>Copy link</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
						/>
					</svg>
				</button>
				<div class="z-20 shadow" data-popup use:copyUrlPopup.popup>
					<div class="w-max rounded-md bg-white px-4 py-2">
						<p class="text-lg text-slate-900">URL copied</p>
					</div>
					<div class="-z-10 bg-white" use:copyUrlPopup.arrow></div>
				</div>
			</div>
		</div>
		<p class="text-lg text-gray-800">{schedule.description}</p>

		<div class="flex flex-row gap-4 text-gray-600">
			<p>
				{m.schedule_member_count({
					memberCount: schedule.members.length
				})}
			</p>
			<p>·</p>
			<p>Organized by</p>
			<Avatar user_id={schedule.owner.id} avatar={schedule.owner.avatar} size={6} />
			<p class="-ml-1 text-base">
				{schedule.owner.nickname ?? schedule.owner.username}
			</p>
		</div>
	</div>

	<!-- <Calendar {schedule} /> -->
{/if}
