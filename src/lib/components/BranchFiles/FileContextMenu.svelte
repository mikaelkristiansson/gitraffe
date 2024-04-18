<script lang="ts">
	import Button from '../Button.svelte';
	import Modal from '../Modal.svelte';
	import PopupMenu from '$lib/components/PopupMenu.svelte';
	import ContextMenu from '$lib/components/contextmenu/ContextMenu.svelte';
	import ContextMenuItem from '$lib/components/contextmenu/ContextMenuItem.svelte';
	import ContextMenuSection from '$lib/components/contextmenu/ContextMenuSection.svelte';
	import * as toasts from '$lib/utils/toasts';
	import { join } from '@tauri-apps/api/path';
	import { open } from '@tauri-apps/api/shell';
	import type { Repository } from '$lib/models/repository';
	import { AppFileStatusKind, type WorkingDirectoryFileChange } from '$lib/models/status';
	import { discardChanges } from '$lib/git/discard';
	import { activeRepository } from '$lib/stores/repository';
	import { workingBranch } from '$lib/stores/branch';

	export let repository: Repository | undefined;

	let confirmationModal: Modal;
	let popupMenu: PopupMenu;

	function isDeleted(item: { file?: WorkingDirectoryFileChange }) {
		return item.file?.status.kind === AppFileStatusKind.Deleted;
	}

	export function openByMouse(e: MouseEvent, item: any) {
		popupMenu.openByMouse(e, item);
	}
</script>

<PopupMenu bind:this={popupMenu} let:item let:dismiss>
	<ContextMenu>
		<ContextMenuSection>
			{#if item.file !== undefined}
				<ContextMenuItem
					icon="undo-small"
					label="Discard changes"
					on:click={() => {
						confirmationModal.show(item);
						dismiss();
					}}
				/>
				<ContextMenuItem
					icon="copy"
					label="Copy Path"
					on:click={async () => {
						try {
							if (!repository || !item.file) return;
							const absPath = await join(repository.path, item.file.path);
							navigator.clipboard.writeText(absPath);
							dismiss();
						} catch (err) {
							console.error('Failed to copy path', err);
							toasts.error('Failed to copy path');
						}
					}}
				/>
				<ContextMenuItem
					icon="copy"
					label="Copy Relative Path"
					on:click={() => {
						try {
							if (!repository || !item.file) return;
							navigator.clipboard.writeText(item.file.path);
							dismiss();
						} catch (err) {
							console.error('Failed to copy relative path', err);
							toasts.error('Failed to copy relative path');
						}
					}}
				/>
				<ContextMenuItem
					disabled={isDeleted(item)}
					icon="vscode"
					label="Open in VSCode"
					on:click={async () => {
						try {
							if (!repository || !item.file) return;
							const absPath = await join(repository.path, item.file.path);
							open(`vscode://file${absPath}`);
							dismiss();
						} catch {
							console.error('Failed to open in VSCode');
							toasts.error('Failed to open in VSCode');
						}
					}}
				/>
			{/if}
		</ContextMenuSection>
	</ContextMenu>
</PopupMenu>

<Modal width="small" title="Discard changes" bind:this={confirmationModal} let:item>
	{#if item}
		<div>
			Discarding changes to the following files:
			<ul class="file-list">
				<li><pre class="whitespace-pre-wrap break-words">{item.file.path}</pre></li>
			</ul>
		</div>
	{/if}
	<svelte:fragment slot="controls" let:close let:item>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
		<Button
			color="error"
			on:click={async () => {
				if ($activeRepository && item) {
					try {
						await discardChanges([item.file], $activeRepository, false);
						// this will also close the modal since it updates the view
						await workingBranch.setWorking($activeRepository);
						item.setSelected(undefined);
						toasts.success(
							//@ts-ignore
							`Changes discarded for ${item.file.path}`
						);
					} catch (e) {
						console.error('Failed to discard changes', e);
						toasts.error('Failed to discard changes');
					} finally {
						confirmationModal?.close();
					}
				}
			}}
		>
			Confirm
		</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	.file-list {
		list-style: disc;
		padding-left: var(--size-20);
		padding-top: var(--size-6);
		background-color: var(--bg-card);
		border-radius: var(--radius-m);
	}
	.file-list li {
		padding: var(--size-2);
	}
</style>
