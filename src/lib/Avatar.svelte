<script lang="ts">
	type Props = {
		user_id: string;
		avatar: string;
		size: 6 | 8 | 16;
	};
	let { user_id, avatar, size }: Props = $props();

	// Discord only allows `size` to be a power of 2
	let pngSize = $derived.by(() => {
		const sizePixels = size * 4;
		const closestPowerOf2Exponent = Math.ceil(Math.log2(sizePixels));
		return 2 ** closestPowerOf2Exponent;
	});
</script>

<img
	src="https://cdn.discordapp.com/avatars/{user_id}/{avatar}.png?size={pngSize}"
	alt=""
	class="rounded-full ring-2 ring-black/10"
	style="width: {size * 0.25}rem; height: {size * 0.25}rem"
/>
