<script lang="ts">
	import noBranchesSvg from '$lib/assets/empty-state/no-branches.svg?raw';
	import BranchItem from './BranchItem.svelte';
	import ScrollableContainer from './ScrollableContainer.svelte';
	import { createEventDispatcher, onDestroy } from 'svelte';
	import BranchesHeader from './BranchesHeader.svelte';
	import { allBranches, defaultBranch, fetchingBranches, workingBranch } from '$lib/stores/branch';
	import type { Repository } from '$lib/models/repository';
	import Spinner from '$lib/icons/Spinner.svelte';
	import { updatingRepositories } from '$lib/stores/repository';
	import {
		groupBranches,
		mergeRemoteAndLocalBranches,
		type IFilterListGroup,
		type IBranchListItem
	} from '$lib/utils/branch';
	import { getRecentBranches } from '$lib/git/branch';
	import TextBox from './TextBox.svelte';
	import type { Branch } from '$lib/models/branch';

	export let repository: Repository;

	let viewport: HTMLDivElement;
	const dispatch = createEventDispatcher<{ scrollbarDragging: boolean }>();

	let groups$: IFilterListGroup<IBranchListItem>[] = [];
	let filteredGroups$: IFilterListGroup<IBranchListItem>[] = [];
	let filterValue = '';
	let isSearching = false;
	let recentBranches: string[] = [];
	const RecentBranchesLimit = 5;

	const unsubscribeAllBranches = allBranches.subscribe((branches) => {
		setGroups(branches);
	});

	async function setBranches() {
		const branches = await allBranches.fetch(repository, {
			defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD',
			prevBranches: $allBranches
		});
		recentBranches = await getRecentBranches(repository, RecentBranchesLimit + 1);
		setGroups(branches);
		filterValue = '';
		isSearching = false;
		return;
	}

	function setGroups(branches: Branch[]) {
		const merged = mergeRemoteAndLocalBranches(branches);
		const groups = groupBranches($defaultBranch, merged, recentBranches);
		groups$ = groups;
		filteredGroups$ = groups;
	}

	function filterBranches(value: string) {
		if (value === '') {
			filteredGroups$ = groups$;
			isSearching = false;
			return;
		}
		filterValue = value;
		isSearching = true;
		const updated = groups$.map((group) => {
			const items = group.items.filter((item) =>
				item.branch.name.toLowerCase().includes(value.toLowerCase())
			);
			return { ...group, items };
		});
		filteredGroups$ = updated;
	}

	$: ({ path } = repository);
	$: path && $defaultBranch && setBranches();
	$: countFiltered = filteredGroups$.flatMap((group) => [...group.items])?.length;
	$: countAll = groups$.flatMap((group) => [...group.items])?.length;

	onDestroy(() => {
		unsubscribeAllBranches();
	});
</script>

<div class="branch-list">
	<BranchesHeader
		{repository}
		count={isSearching ? `${countFiltered}/${countAll}` : countAll ?? 0}
	/>
	{#if groups$ && groups$.length > 0}
		<ScrollableContainer
			bind:viewport
			showBorderWhenScrolled
			on:dragging={(e) => dispatch('scrollbarDragging', e.detail)}
			fillViewport={groups$?.length == 0}
		>
			<div class="scroll-container">
				<TextBox
					value={filterValue}
					icon="search"
					placeholder="Search"
					on:input={(e) => filterBranches(e.detail)}
				/>
				<div class="content">
					{#if $fetchingBranches && $updatingRepositories}
						<div class="flex justify-center"><Spinner size={22} opacity={0.5} /></div>
					{:else}
						{#each filteredGroups$ as group}
							{#if group.items.length > 0}
								<div class="group__header">
									<span class="capitalize text-base-12 text-semibold">{group.identifier}</span>
								</div>
								{#each group.items as item}
									<BranchItem
										{repository}
										selected={$workingBranch?.currentBranch === item.branch.name}
										branch={item.branch}
									/>
								{/each}
							{/if}
						{/each}
					{/if}
				</div>
			</div>
		</ScrollableContainer>
	{:else}
		<div class="branch-list__empty-state">
			<div class="branch-list__empty-state__image">
				{@html noBranchesSvg}
			</div>
			<span class="branch-list__empty-state__caption text-base-body-14 text-semibold"
				>You have no branches</span
			>
		</div>
	{/if}
</div>

<style lang="postcss">
	.scroll-container {
		display: flex;
		flex-direction: column;
		gap: var(--size-12);
		width: 100%;
		height: 100%;
		padding-top: var(--size-6);
		padding-bottom: var(--size-16);
		padding-left: var(--size-14);
		padding-right: var(--size-14);
	}
	.branch-list {
		flex: 1;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--clr-theme-container-outline-light);
	}
	.content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--size-2);
	}

	/* EMPTY STATE */
	.branch-list__empty-state {
		flex: 1;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: var(--size-10);
	}

	.branch-list__empty-state__image {
		width: 8.125rem;
	}

	.branch-list__empty-state__caption {
		color: var(--clr-theme-scale-ntrl-60);
		text-align: center;
		max-width: 10rem;
	}
</style>
