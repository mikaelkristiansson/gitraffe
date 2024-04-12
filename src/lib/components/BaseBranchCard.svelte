<script lang="ts">
	import SyncButton from './SyncButton.svelte';
	import Badge from './Badge.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { tooltip } from '$lib/utils/tooltip';
	import { defaultBranch } from '$lib/branch';
	import type { Repository } from '$lib/models/repository';
	import type { Branch } from '$lib/models/branch';

	export let repository: Repository;
	export let isNavCollapsed: boolean;

	let base: Branch | undefined = $defaultBranch;

	defaultBranch.subscribe((branch) => {
		base = branch;
	});
</script>

<div use:tooltip={isNavCollapsed ? 'Base' : ''} class="base-branch-card">
	{#if isNavCollapsed}
		{#if (base?.aheadBehind.behind || 0) > 0}
			<div class="small-count-badge">
				<span class="text-base-9 text-bold">{base?.aheadBehind.behind || 0}</span>
			</div>
		{/if}
	{/if}
	<img class="icon" src="/images/domain-icons/trunk.svg" alt="" />

	{#if !isNavCollapsed}
		<div class="content">
			<div class="row_1">
				<div class="flex gap-1">
					<span class="text-base-14 text-semibold trunk-label">Base</span>
					{#if (base?.aheadBehind.behind || 0) > 0}
						<Badge count={base?.aheadBehind.behind || 0} help="Unmerged upstream commits" />
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
	.base-branch-card {
		position: relative;
		display: flex;
		gap: var(--size-10);
		padding: var(--size-10);
		border-radius: var(--radius-m);
		transition: background-color var(--transition-fast);
	}

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
	.trunk-label {
		color: var(--clr-theme-scale-ntrl-0);
	}
	.row_1 {
		display: flex;
		gap: var(--size-6);
		align-items: center;
		justify-content: space-between;
		color: var(--clr-theme-scale-ntrl-10);
	}
	.row_2 {
		display: flex;
		align-items: center;
		gap: var(--size-4);
		color: var(--clr-theme-scale-ntrl-40);
	}
	.small-count-badge {
		position: absolute;
		top: 10%;
		right: 10%;

		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--size-2);
		min-width: var(--size-14);
		background-color: var(--clr-theme-err-element);
		color: var(--clr-theme-scale-ntrl-100);
		border-radius: var(--radius-m);
	}
</style>
