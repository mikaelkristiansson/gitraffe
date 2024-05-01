<script lang="ts">
	import { defaultBranch } from '$lib/stores/branch';
	import { type Branch as BranchModel } from '$lib/models/branch';
	import type { Repository } from '$lib/models/repository';
	import * as ContextMenu from './ui/context-menu';
	import Icon from './Icon.svelte';
	import { Button } from './ui/button';
	import Branch from './Branch.svelte';
	import DeleteBranch from './DeleteBranch.svelte';

	export let repository: Repository;
	export let branch: BranchModel;
	export let selected = false;
	let dialogDeleteOpen = false;

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
			<ContextMenu.Item>
				<Button variant="ghost" class="flex justify-between items-center gap-4 w-full p-0">
					Rename branch
					<Icon name="idea" />
				</Button>
			</ContextMenu.Item>
			<ContextMenu.Item on:click={() => (dialogDeleteOpen = true)}>
				<Button variant="ghost" class="flex justify-between items-center gap-4 w-full p-0">
					Delete branch
					<Icon name="removed-branch-small" />
				</Button>
			</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
{/if}

<DeleteBranch {repository} {branch} {dialogDeleteOpen} />
