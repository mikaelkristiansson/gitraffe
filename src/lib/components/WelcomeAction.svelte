<script lang="ts">
	import Spinner from '$lib/icons/Spinner.svelte';

	export let title: string;
	export let loading = false;
</script>

<button
	class="relative overflow-hidden flex p-2 flex-row gap-6 items-center text-left rounded-lg border bg-card hover:bg-secondary focus:outline-0"
	class:loading
	on:click
	on:mousedown
	disabled={loading}
>
	<div
		class="rounded-lg border bg-accent [&>svg]:fill-primary-foreground dark:[&>svg]:fill-primary opacity-80 flex items-center justify-center flex-shrink-0 w-16 h-16 p-2"
	>
		<slot name="icon" />
	</div>
	<div class="action__content">
		<div class="text-lg text-bold">{title}</div>
		<div class="text-base max-w-[80%]">
			<slot name="message" />
		</div>
	</div>
	{#if loading}
		<div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
			<Spinner size={28} />
		</div>
	{/if}
</button>

<style lang="postcss">
	.loading {
		pointer-events: none;
		@apply bg-muted/50;
		border: 1px solid transparent;

		& .action__content {
			opacity: 0.3;
		}
	}

	.action__content {
		position: relative;
		z-index: 0;
		display: flex;
		flex-direction: column;
		gap: var(--size-10);
	}
</style>
