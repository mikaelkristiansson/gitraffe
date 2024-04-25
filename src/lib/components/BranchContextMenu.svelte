<script lang="ts">
	import PopupMenu from '$lib/components/PopupMenu.svelte';
	import ContextMenu from '$lib/components/contextmenu/ContextMenu.svelte';
	import ContextMenuItem from '$lib/components/contextmenu/ContextMenuItem.svelte';
	import ContextMenuSection from '$lib/components/contextmenu/ContextMenuSection.svelte';
	import * as toasts from '$lib/utils/toasts';
	import type { Repository } from '$lib/models/repository';
	import { activeBranch, allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import Modal from './Modal.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import { checkout } from '$lib/git/cli';
	import { deleteBranch } from '$lib/utils/branch';
	import InfoMessage from './InfoMessage.svelte';

	export let repository: Repository | undefined;

	let confirmationModal: Modal;
	let popupMenu: PopupMenu;

	export function openByMouse(e: MouseEvent, item: any) {
		popupMenu.openByMouse(e, item);
	}
</script>

<PopupMenu bind:this={popupMenu} let:item let:dismiss>
	<ContextMenu>
		<ContextMenuSection>
			<ContextMenuItem
				icon="idea"
				label="Rename branch"
				on:click={async () => {
					dismiss();
				}}
			/>
			<ContextMenuItem
				icon="removed-branch-small"
				label="Delete branch"
				on:click={() => {
					confirmationModal.show(item);
					dismiss();
				}}
			/>
		</ContextMenuSection>
	</ContextMenu>
</PopupMenu>

<Modal width="small" title="Delete Branch" bind:this={confirmationModal} let:item>
	<div class="flex flex-col gap-4">
		{#if item}
			<div class="flex items-center gap-4">
				<Icon name="warning" size={30} opacity={0.8} color="warn" />
				<div>
					Delete branch <span class="tag">{item.branch.name}</span> ? <br />
					This action cannot be undone
				</div>
			</div>
		{/if}
		{#if item.branch?.name === $workingBranch?.currentBranch && $workingBranch?.workingDirectory.files.length !== 0}
			<InfoMessage>
				You have changes on the branch that are not committed. Deleting this branch will bring these
				changes to next branch.
				<ul class="file-list">
					{#if $workingBranch?.workingDirectory}
						{#each $workingBranch?.workingDirectory.files as file}
							<li>
								<code class="whitespace-pre-wrap break-words">{file.path}</code>
							</li>
						{/each}
					{/if}
				</ul>
			</InfoMessage>
		{/if}
	</div>
	<svelte:fragment slot="controls" let:close let:item>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
		<Button
			color="error"
			on:click={async () => {
				if (repository && item) {
					try {
						if (item.branch.name === $defaultBranch.name) {
							toasts.error('Cannot delete default branch');
							return;
						}
						await deleteBranch(repository, item.branch, $activeBranch, $defaultBranch);
						confirmationModal.close();
						toasts.success(`Deleting branch ${item.branch.name}`);
						await allBranches.fetch(repository, {
							defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD'
						});
						if (item.branch.name === $workingBranch?.currentBranch) {
							await checkout(repository.path, $defaultBranch.name);
							activeBranch.setActive($defaultBranch);
							await workingBranch.setWorking(repository);
						}
					} catch (e) {
						console.error('Failed to delete branch', e);
						toasts.error('Failed to delete branch');
					}
					console.log('delete branch', item.branch.name);
				}
			}}
		>
			Confirm
		</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	.tag {
		height: var(--size-control-s);
		padding: var(--size-2) var(--size-4);
		border-radius: var(--radius-m);
		transition: background-color var(--transition-fast);
		color: var(--clr-theme-scale-warn-20);
		background: color-mix(in srgb, var(--clr-core-warn-50), transparent 80%);
		box-shadow: inset 0 0 0 1px var(--clr-theme-scale-warn-60);
	}

	.file-list {
		list-style: disc;
		padding-left: var(--size-26);
		background-color: var(--bg-card);
		border-radius: var(--radius-m);
	}
	.file-list li {
		padding: var(--size-2);
		padding-left: var(--size-1);
	}
</style>
