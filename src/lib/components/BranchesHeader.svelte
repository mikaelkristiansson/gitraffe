<script lang="ts">
	import { createBranch } from '$lib/git/branch';
	import type { Repository } from '$lib/models/repository';
	import { allBranches, defaultBranch } from '$lib/stores/branch';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import HandleBranchName from './HandleBranchName.svelte';
	import { Badge } from './ui/badge';

	export let count: number | string | undefined;
	export let repository: Repository;

	let dialogOpen = false;

	const createNewBranch = async (branchName: string) => {
		const promise = createBranch(repository, branchName, null)
			.then(async () => {
				await allBranches.fetch(repository);
			})
			.finally(() => {
				dialogOpen = false;
			});
		toast.promise(promise, {
			loading: 'Creating...',
			success: () => {
				return 'Created branch ' + branchName;
			},
			error: 'Error... :( Try again!'
		});
	};
</script>

<div class="header flex items-center justify-between w-full gap-2 px-4 pt-4 pb-3">
	<div class="flex items-center gap-1">
		<span class=" text-sm font-semibold">Branches</span>

		{#if count !== undefined}
			<Badge size="sm" variant="secondary">{count}</Badge>
		{/if}
	</div>
	<div class="relative">
		<Button variant="outline" icon="plus-small" on:click={() => (dialogOpen = true)}
			>Create branch</Button
		>
	</div>
</div>

<HandleBranchName bind:dialogOpen onSubmit={createNewBranch} submitText="Create" />
