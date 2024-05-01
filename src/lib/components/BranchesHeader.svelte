<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import { createBranch } from '$lib/git/branch';
	import type { Repository } from '$lib/models/repository';
	import { allBranches, defaultBranch } from '$lib/stores/branch';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import HandleBranchName from './HandleBranchName.svelte';

	export let count: number | string | undefined;
	export let repository: Repository;

	let dialogOpen = false;
	let form: HTMLFormElement;

	const createNewBranch = async (branchName: string) => {
		const promise = createBranch(repository, branchName, null)
			.then(async () => {
				await allBranches.fetch(repository, {
					defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD'
				});
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
		<span class="text-base-14 text-semibold">Branches</span>

		{#if count !== undefined}
			<Badge {count} />
		{/if}
	</div>
	<div class="relative">
		<Button variant="outline" icon="plus-small" on:click={() => (dialogOpen = true)}
			>Create branch</Button
		>
	</div>
</div>

<HandleBranchName bind:dialogOpen onSubmit={createNewBranch} submitText="Create" />
