<script lang="ts">
	import noBranchesSvg from '$lib/assets/empty-state/no-branches.svg?raw';
	import BranchItem from './BranchItem.svelte';
	import ScrollableContainer from './ScrollableContainer.svelte';
	import { createEventDispatcher } from 'svelte';
	import TextBox from './TextBox.svelte';
	import BranchesHeader from './BranchesHeader.svelte';
	import { allBranches, defaultBranch, fetchingBranches } from '$lib/branch';
	import type { Repository } from '$lib/models/repository';
	import Spinner from '$lib/icons/Spinner.svelte';
	import { updatingRepositories } from '$lib/repository';
	import {
		groupBranches,
		mergeRemoteAndLocalBranches,
		type IFilterListGroup,
		type IBranchListItem
	} from '$lib/utils/branch';
	import { getRecentBranches } from '$lib/git/branch';

	export let repository: Repository;
	export const textFilter$ = '';

	let contents: HTMLElement;
	let viewport: HTMLDivElement;
	const dispatch = createEventDispatcher<{ scrollbarDragging: boolean }>();

	// $: branches = mergeRemoteAndLocalBranches($allBranches);
	let groups$: IFilterListGroup<IBranchListItem>[] = [];

	async function setBranches() {
		const branches = await allBranches.fetch(repository);
		const RecentBranchesLimit = 5;
		const recentBranches = await getRecentBranches(repository, RecentBranchesLimit + 1);
		const groups = groupBranches(
			$defaultBranch,
			mergeRemoteAndLocalBranches(branches),
			recentBranches
		);
		groups$ = groups;
		return;
	}

	$: ({ path } = repository);
	$: path && setBranches();

	$: filteredBranches$ = mergeRemoteAndLocalBranches($allBranches);
</script>

<div class="branch-list">
	<BranchesHeader count={filteredBranches$?.length ?? 0} filtersActive={true}>
		<!-- <FilterPopupMenu
      slot="context-menu"
      let:visible
      {visible}
      {includePrs}
      {includeRemote}
      {includeStashed}
      {hideBots}
      {hideInactive}
      showPrCheckbox={githubService.isEnabled}
      on:action
    /> -->
	</BranchesHeader>
	{#if $allBranches && $allBranches.length > 0}
		<ScrollableContainer
			bind:viewport
			showBorderWhenScrolled
			on:dragging={(e) => dispatch('scrollbarDragging', e.detail)}
			fillViewport={filteredBranches$?.length == 0}
		>
			<div class="scroll-container">
				<!-- on:input={(e) => textFilter$.next(e.detail)} -->
				<TextBox icon="search" placeholder="Search" />
				<div bind:this={contents} class="content">
					{#if $fetchingBranches && $updatingRepositories}
						<div class="flex justify-center"><Spinner size={22} opacity={0.5} /></div>
					{:else}
						{#each groups$ as group}
							<div class="group__header">
								<span class="capitalize text-base-12 text-semibold">{group.identifier}</span>
							</div>
							{#each group.items as item}
								<BranchItem {repository} branch={item.branch} />
							{/each}
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
	/* .resize-guard {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		justify-content: flex-end;
		position: relative;
		overflow-y: hidden;
	} */
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
		/* align-items: center; */
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
