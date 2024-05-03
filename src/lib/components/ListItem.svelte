<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { createEventDispatcher } from 'svelte';
	import type iconsJson from '$lib/icons/icons.json';

	export let icon: keyof typeof iconsJson | undefined = undefined;
	export let selected = false;
	export let loading = false;

	const dispatch = createEventDispatcher<{ click: void }>();
</script>

<button disabled={selected} class="button" class:selected on:click={() => dispatch('click')}>
	<div class="text-ellipsis overflow-hidden text-sm font-semibold">
		<slot />
	</div>
	{#if icon || selected}
		<div class="icon">
			{#if icon}
				<Icon name={loading ? 'spinner' : icon} />
			{:else}
				<Icon name="tick" />
			{/if}
		</div>
	{/if}
</button>

<style lang="postcss">
	.button {
		display: flex;
		align-items: center;
		font-weight: 700;
		@apply p-2 rounded-md;
		justify-content: space-between;
		width: 100%;
		transition: background-color 0.3s;

		&:hover:enabled,
		&:focus:enabled {
			@apply bg-muted;
			& .icon {
				@apply text-secondary-foreground;
			}
		}
		&:disabled {
			@apply bg-muted;
			@apply text-muted-foreground;
		}
		& .icon {
			display: flex;
			@apply text-muted-foreground;
		}
	}
</style>
