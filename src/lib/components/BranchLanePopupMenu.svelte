<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ContextMenu from '$lib/components/contextmenu/ContextMenu.svelte';
	import ContextMenuItem from '$lib/components/contextmenu/ContextMenuItem.svelte';
	import ContextMenuSection from '$lib/components/contextmenu/ContextMenuSection.svelte';
	import { deleteLocalBranch } from '$lib/git/branch';
	import { checkout } from '$lib/git/cli';
	import type { IStatusResult } from '$lib/git/status';
	import type { Commit } from '$lib/models/commit';
	import { activeBranch, allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import { activeRepository } from '$lib/stores/repository';
	import * as toasts from '$lib/utils/toasts';
	import Icon from './Icon.svelte';

	export let branch: IStatusResult;
	export let commits: ReadonlyArray<Commit>;
	export let visible: boolean;

	let deleteBranchModal: Modal;

	$: commits = commits;
</script>

{#if visible}
	<ContextMenu>
		<ContextMenuSection>
			<ContextMenuItem
				label="Delete branch"
				icon="bin-small"
				on:click={async () => {
					if (commits.length === 0 && branch.workingDirectory.files?.length === 0) {
						deleteBranchModal.show(branch);
					} else {
						// TODO: add confirmation dialog
					}
					visible = false;
				}}
			/>
		</ContextMenuSection>
	</ContextMenu>
{/if}

<Modal width="small" title="Delete branch" bind:this={deleteBranchModal} let:item={branch}>
	<div class="flex items-center gap-4">
		<Icon name="warning" size={30} opacity={0.8} color="warn" />
		<div>
			Delete branch <span class="tag">{branch.currentBranch}</span> ? <br />
			This action cannot be undone
		</div>
	</div>
	<svelte:fragment slot="controls" let:close let:item={branch}>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
		<Button
			color="error"
			on:click={async () => {
				if ($activeRepository && branch) {
					try {
						await deleteLocalBranch($activeRepository, branch.currentBranch);
						deleteBranchModal.close();
						toasts.success(`Deleting branch ${branch.currentBranch}`);
						await allBranches.fetch($activeRepository, {
							defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD'
						});
						if (branch.currentBranch === $workingBranch?.currentBranch) {
							await checkout($activeRepository.path, $defaultBranch.name);
							activeBranch.setActive($defaultBranch);
							await workingBranch.setWorking($activeRepository);
						}
					} catch (e) {
						console.error('Failed to delete branch', e);
						toasts.error('Failed to delete branch');
					}
					console.log('delete branch', branch.currentBranch);
				}
			}}
		>
			Confirm
		</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
</style>
