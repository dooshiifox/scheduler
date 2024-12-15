<script lang="ts">
	import { i18n } from "$lib/i18n";
	import { ParaglideJS } from "@inlang/paraglide-sveltekit";
	import "../app.css";
	import Avatar from "$lib/Avatar.svelte";
	import type { Snippet } from "svelte";
	import type { LayoutServerData } from "./$types";

	let { children, data }: { data: LayoutServerData; children: Snippet } = $props();
</script>

<ParaglideJS {i18n}>
	<div class="min-h-dvh bg-slate-200">
		<nav class="mb-12 flex h-14 flex-row justify-between border-b border-b-slate-300">
			<a class="flex h-full items-center px-6 text-xl font-bold text-slate-900" href="/">
				<span class="text-sky-600">Sch</span>edule
			</a>

			<div class="flex flex-row items-center gap-4 px-6 text-slate-900">
				<Avatar user_id={data.user.id} avatar={data.user.avatar} size={8} />
				<p class="text-xl font-bold">{data.user.nickname}</p>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 20 20"
					fill="currentColor"
					class="size-5"
				>
					<path
						fill-rule="evenodd"
						d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
						clip-rule="evenodd"
					/>
				</svg>
			</div>
		</nav>

		{@render children()}
	</div>
</ParaglideJS>
