<script lang="ts">
	import type { PageServerData } from "./$types";

	let { schedule }: { schedule: PageServerData["schedule"] } = $props();

	function getNext7Days() {
		const today = new Date(new Date().toDateString());
		const dates = [today];
		for (let i = 1; i < 7; i++) {
			const newDate = new Date(today);
			newDate.setDate(newDate.getDate() + i);
			dates.push(newDate);
		}
		return dates;
	}

	let displayedDates = $state(getNext7Days());

	/*
    Members
    View
    Share
    */
</script>

<div class="flex-col">
	{#each displayedDates as date}
		<div class="flex flex-row"></div>
	{/each}
</div>
