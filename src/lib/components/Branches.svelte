<script lang="ts">
	import noBranchesSvg from '$lib/assets/illu/big-dipper.svg?raw';
	import BranchItem from './BranchItem.svelte';
	import { onDestroy } from 'svelte';
	import BranchesHeader from './BranchesHeader.svelte';
	import { allBranches, defaultBranch, fetchingBranches, workingBranch } from '$lib/stores/branch';
	import type { Repository } from '$lib/models/repository';
	import Spinner from '$lib/icons/Spinner.svelte';
	import { updatingRepositories } from '$lib/stores/repository.svelte';
	import {
		groupBranches,
		mergeRemoteAndLocalBranches,
		type IFilterListGroup,
		type IBranchListItem
	} from '$lib/utils/branch';
	import { getRecentBranches } from '$lib/git/branch';
	import type { Branch } from '$lib/models/branch';
	import { Input, type FormInputEvent } from './ui/input';
	import { cn } from '$lib/utils';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';

	export let repository: Repository;
	export let isNavCollapsed: boolean;

	let groups$: IFilterListGroup<IBranchListItem>[] = [];
	let filteredGroups$: IFilterListGroup<IBranchListItem>[] = [];
	let filterValue = '';
	let isSearching = false;
	let recentBranches: string[] = [];
	const RecentBranchesLimit = 5;

	let timer;
	const debounce = (callback: Function) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			callback();
		}, 600);
	};

	const unsubscribeAllBranches = allBranches.subscribe((branches) => {
		setGroups(branches);
	});

	async function setBranches() {
		const branches = await allBranches.fetch(repository, {
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

	const onInputChange = (event: FormInputEvent) => {
		const value = (event.target as HTMLInputElement).value;
		debounce(() => filterBranches(value));
	};

	$: ({ path } = repository);
	$: path && $defaultBranch && setBranches();
	$: countFiltered = filteredGroups$.flatMap((group) => [...group.items])?.length;
	$: countAll = groups$.flatMap((group) => [...group.items])?.length;

	onDestroy(() => {
		unsubscribeAllBranches();
	});
</script>

<div
	class={cn(
		'flex flex-1 overflow-hidden relative flex-col border-t w-full',
		isNavCollapsed && 'w-0'
	)}
>
	<BranchesHeader
		{repository}
		count={isSearching ? `${countFiltered}/${countAll}` : countAll ?? 0}
	/>
	{#if groups$ && groups$.length > 0}
		<div class="flex flex-col gap-4 overflow-hidden w-full h-full pt-2">
			<div class="px-4">
				<Input
					type="search"
					value={filterValue}
					icon="search"
					placeholder="Search"
					on:input={onInputChange}
				/>
			</div>
			<div class="flex flex-col justify-center gap-0.5 overflow-hidden">
				{#if $fetchingBranches && $updatingRepositories}
					<div class="flex justify-center"><Spinner size={22} opacity={0.5} /></div>
				{:else}
					<ScrollArea orientation="vertical" class="h-full">
						<div class="px-4 pb-2">
							{#each filteredGroups$ as group}
								{#if group.items.length > 0}
									<div class="group__header">
										<span class="capitalize text-xs font-semibold">{group.identifier}</span>
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
						</div>
					</ScrollArea>
				{/if}
			</div>
		</div>
	{:else}
		<div class="flex flex-1 flex-col justify-center items-center gap-2">
			<div class="[&>svg]:w-40 [&>svg]:h-40 [&>svg>path]:fill-muted-foreground opacity-20">
				{@html noBranchesSvg}
			</div>
			<span class="text-center text-xs font-semibold text-gray-400 dark:text-gray-600"
				>You have no branches</span
			>
		</div>
	{/if}
</div>
