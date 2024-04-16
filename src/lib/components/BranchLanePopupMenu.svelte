<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ContextMenu from '$lib/components/contextmenu/ContextMenu.svelte';
	import ContextMenuItem from '$lib/components/contextmenu/ContextMenuItem.svelte';
	import ContextMenuSection from '$lib/components/contextmenu/ContextMenuSection.svelte';
	import type { IStatusResult } from '$lib/git/status';
	import type { Commit } from '$lib/models/commit';

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
					if (commits.length == 0 && branch.workingDirectory.files?.length == 0) {
						// await branchController.deleteBranch(branch.id);
					} else {
						deleteBranchModal.show(branch);
					}
					visible = false;
				}}
			/>
		</ContextMenuSection>
	</ContextMenu>
{/if}

<Modal width="small" title="Delete branch" bind:this={deleteBranchModal} let:item={branch}>
	<div>
		Deleting <code>{branch.currentBranch}</code> cannot be undone.
	</div>
	<svelte:fragment slot="controls" let:close let:item={branch}>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
		<Button
			color="error"
			on:click={async () => {
				// await branchController.deleteBranch(branch.id);
				visible = false;
			}}
		>
			Delete branch
		</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
</style>
