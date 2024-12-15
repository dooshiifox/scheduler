<script lang="ts">
	import { enhance } from "$app/forms";

	let title = $state("");
	let description = $state("");
</script>

<form
	method="POST"
	action="?/create"
	class="mx-auto mt-20 flex max-w-md flex-col gap-2"
	use:enhance
>
	<input
		name="title"
		bind:value={title}
		placeholder="Title"
		class="rounded border border-slate-400 bg-white px-4 py-1 text-black placeholder-slate-500"
		required
		maxlength="50"
	/>

	<textarea
		name="description"
		bind:value={description}
		placeholder="Description (optional)"
		class="rounded border border-slate-400 bg-white px-4 py-1 text-black placeholder-slate-500"
		maxlength="200"
	></textarea>

	<button type="submit" class="self-end rounded bg-amber-500 px-6 py-3 font-bold text-white"
		>Create Schedule</button
	>
</form>
