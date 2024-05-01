<script lang="ts">
	import { allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import { type Branch as BranchModel } from '$lib/models/branch';
	import type { Repository } from '$lib/models/repository';
	import * as ContextMenu from './ui/context-menu';
	import Icon from './Icon.svelte';
	import { Button } from './ui/button';
	import Branch from './Branch.svelte';
	import DeleteBranch from './DeleteBranch.svelte';
	import HandleBranchName from './HandleBranchName.svelte';
	import { renameBranch } from '$lib/git/branch';
	import { toast } from 'svelte-sonner';

	export let repository: Repository;
	export let branch: BranchModel;
	export let selected = false;
	let dialogDeleteOpen = false;
	let dialogChangeNameOpen = false;

	const changeName = async (newName: string) => {
		await renameBranch(repository, branch, newName);
		toast.success('Branch renamed to ' + newName);
		await allBranches.fetch(repository, {
			defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD'
		});
		if (branch.tip.sha === $workingBranch?.currentTip) {
			await workingBranch.setWorking(repository);
		}
		dialogChangeNameOpen = false;
	};

	$: href = `/${repository.id}/board/${branch.name}`;
</script>

{#if branch.ref === $defaultBranch.ref}
	<Branch {repository} {branch} {selected} {href} />
{:else}
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<Branch {repository} {branch} {selected} {href} />
		</ContextMenu.Trigger>
		<ContextMenu.Content class="w-40">
			<ContextMenu.Item
				on:click={() => (dialogChangeNameOpen = true)}
				class="flex justify-between items-center gap-4 cursor-pointer"
			>
				Rename branch
				<Icon name="idea" />
			</ContextMenu.Item>
			<ContextMenu.Item
				on:click={() => (dialogDeleteOpen = true)}
				class="flex justify-between items-center gap-4 cursor-pointer"
			>
				Delete branch
				<Icon name="removed-branch-small" />
			</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
{/if}

<DeleteBranch {repository} {branch} {dialogDeleteOpen} />
<HandleBranchName
	bind:dialogOpen={dialogChangeNameOpen}
	onSubmit={changeName}
	name={branch.name}
	submitText="Rename"
/>
