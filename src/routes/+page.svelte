<script lang="ts">
	import type { PageServerData } from "./$types";
	import Avatar from "$lib/Avatar.svelte";
	let { data }: { data: PageServerData } = $props();
</script>

<!-- {JSON.stringify(data)} -->

<div class="min-h-dvh bg-slate-200">
	<div class="flex flex-row gap-4 p-4">
		<Avatar user_id={data.user.id} avatar={data.user.avatar} size={8} />
		<p class="text-xl font-bold">{data.user.nickname ?? data.user.username}</p>
	</div>

	<ul
		class="mx-auto grid max-w-7xl grow grid-cols-[repeat(auto-fit,minmax(24px,1fr))] items-center justify-center gap-2"
	>
		<li><a href="/new-schedule">New Schedule</a></li>
		{#each data.schedules as schedule (schedule.id)}
			<li><a href="/schedule/{schedule.id}">{schedule.title}</a></li>
		{/each}
	</ul>
</div>
