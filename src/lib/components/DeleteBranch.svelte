<script lang="ts">
	import { activeBranch, allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import { checkout } from '$lib/git/cli';
	import { type Branch as BranchModel } from '$lib/models/branch';
	import type { Repository } from '$lib/models/repository';
	import Icon from './Icon.svelte';
	import * as Dialog from './ui/dialog';
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from './ui/button';
	import { deleteBranch } from '$lib/utils/branch';
	import { toast } from 'svelte-sonner';

	export let repository: Repository;
	export let branch: BranchModel;
	export let dialogDeleteOpen = false;
</script>

<Dialog.Root bind:open={dialogDeleteOpen}>
	<Dialog.Content size="sm">
		<Dialog.Header>
			<Dialog.Title>Delete Branch</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col gap-4">
			<div class="flex items-center gap-4">
				<Icon name="warning" size={30} opacity={0.8} color="warn" />
				<div>
					Delete branch <span
						class="text-orange-600 bg-orange-200 border-orange-300 border rounded-md px-1 py-0.5"
						>{branch.name}</span
					>
					? <br />
					This action cannot be undone
				</div>
			</div>
			{#if branch?.name === $workingBranch?.currentBranch && $workingBranch?.workingDirectory.files.length !== 0}
				<Alert.Root>
					<Alert.Title>Uncommitted changes</Alert.Title>
					<Alert.Description
						>You have changes on the branch that are not committed. Deleting this branch will bring
						these changes to next branch.
						<ul class="file-list">
							{#if $workingBranch?.workingDirectory}
								{#each $workingBranch?.workingDirectory.files as file}
									<li>
										<code class="whitespace-pre-wrap break-words">{file.path}</code>
									</li>
								{/each}
							{/if}
						</ul></Alert.Description
					>
				</Alert.Root>
			{/if}
		</div>
		<Dialog.Footer>
			<Button variant="outline" on:click={() => (dialogDeleteOpen = false)}>Cancel</Button>
			<Button
				variant="secondary"
				on:click={async () => {
					if (repository) {
						try {
							if (branch.name === $defaultBranch.name) {
								toast.error('Cannot delete default branch');
								return;
							}
							await deleteBranch(repository, branch, $activeBranch, $defaultBranch);
							dialogDeleteOpen = false;
							toast.success(`Deleted branch ${branch.name}`);
							await allBranches.fetch(repository, {
								defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD'
							});
							if (branch.name === $workingBranch?.currentBranch) {
								await checkout(repository.path, $defaultBranch.name);
								activeBranch.setActive($defaultBranch);
								await workingBranch.setWorking(repository);
							}
						} catch (e) {
							console.error('Failed to delete branch', e);
							toast.error('Failed to delete branch');
						}
						console.log('delete branch', branch.name);
					}
				}}
			>
				Confirm
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
