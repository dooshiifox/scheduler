<script lang="ts">
	import type { PageServerData } from "./$types";
	let { data }: { data: PageServerData } = $props();
</script>

{JSON.stringify(data)}

<img
	src="https://cdn.discordapp.com/avatars/{data.user.id}/{data.user.avatar}.png?size=64"
	alt="{data.user.nickname}'s profile icon"
/>
