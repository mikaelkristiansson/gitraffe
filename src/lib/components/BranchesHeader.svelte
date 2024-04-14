<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';

	export let count: number | undefined;
</script>

<div class="header">
	<div class="branches-title">
		<span class="text-base-14 text-semibold">Branches</span>

		{#if count !== undefined}
			<Badge {count} />
		{/if}
	</div>
</div>

<style lang="postcss">
	.header {
		display: flex;
		color: var(--clr-theme-scale-ntrl-0);
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--size-14) var(--size-14) var(--size-12) var(--size-14);
		gap: var(--size-8);
		border-bottom: 1px solid transparent;
		transition: border-bottom var(--transition-fast);
		position: relative;
	}
	.branches-title {
		display: flex;
		align-items: center;
		gap: var(--size-4);
	}
</style>
