<script lang="ts">
	import SyncButton from './SyncButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import Icon from '$lib/components/Icon.svelte';
	import { tooltip } from '$lib/utils/tooltip';
	import { defaultBranch } from '$lib/stores/branch';
	import type { Repository } from '$lib/models/repository';
	import type { Branch } from '$lib/models/branch';
	import { onDestroy } from 'svelte';

	export let repository: Repository;
	export let isNavCollapsed: boolean;

	let base: Branch | undefined = $defaultBranch;

	const unsubscribeDefaultBranch = defaultBranch.subscribe((branch) => {
		base = branch;
	});

	onDestroy(() => {
		unsubscribeDefaultBranch();
	});
</script>

<div use:tooltip={isNavCollapsed ? 'Base' : ''} class="relative flex rounded-md gap-2 p-2 pr-0">
	{#if isNavCollapsed}
		{#if (base?.aheadBehind.behind || 0) > 0}
			<Badge size="sm" variant="secondary"
				><span class="text-bold">{base?.aheadBehind.behind || 0}</span></Badge
			>
		{/if}
	{/if}
	<img class="icon" src="/images/domain-icons/trunk.svg" alt="" />

	{#if !isNavCollapsed}
		<div class="content">
			<div class="row_1">
				<div class="flex gap-1">
					<span class="text-base-14 text-semibold trunk-label">Base</span>
					{#if (base?.aheadBehind.behind || 0) > 0}
						<Badge size="sm" variant="secondary"
							><span class="text-bold">{base?.aheadBehind.behind || 0}</span></Badge
						>
					{/if}
				</div>
				<SyncButton {repository} />
			</div>
			<div class="row_2 text-base-12">
				<Icon name="branch" />
				{base?.upstream || base?.name}
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	.icon {
		border-radius: var(--radius-s);
		height: var(--size-20);
		width: var(--size-20);
		flex-shrink: 0;
	}
	.content {
		display: flex;
		flex-direction: column;
		gap: var(--size-8);
		flex-grow: 1;
	}

	.row_1 {
		display: flex;
		gap: var(--size-6);
		align-items: center;
		justify-content: space-between;
	}
	.row_2 {
		display: flex;
		align-items: center;
		gap: var(--size-4);
	}
</style>
