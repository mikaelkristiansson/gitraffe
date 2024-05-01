<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import FileStatusIcons from './FileStatusIcons.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { getVSIFileIcon } from '$lib/ext-icons';
	import type { Writable } from 'svelte/store';
	import { AppFileStatusKind, type ChangedFile } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';
	import { cn } from '$lib/utils';
	import Icon from '../Icon.svelte';
	import { join } from '@tauri-apps/api/path';
	import { open } from '@tauri-apps/api/shell';
	import { toast } from 'svelte-sonner';
	import DiscardChanges from './DiscardChanges.svelte';
	import type { SetSelected } from '$lib/types';

	export let repository: Repository | undefined;
	export let file: ChangedFile;
	export let selected: boolean;
	export let files: ChangedFile[];
	export let showCheckbox: boolean = false;
	export let selectedFiles: Writable<ChangedFile[]>;
	export let setSelected: SetSelected;

	let checked = false;
	let indeterminate = false;
	let dialogDiscardOpen = false;

	$: if (file) {
		const fileId = file.id;
		checked = $selectedFiles.some((f) => f.id == fileId);
	}

	function isDeleted(file: ChangedFile) {
		return file.status.kind === AppFileStatusKind.Deleted;
	}
</script>

<div class="list-item-wrapper w-full">
	{#if showCheckbox}
		<Checkbox
			small
			{checked}
			{indeterminate}
			on:change={(e) => {
				selectedFiles.update((selectedF) => {
					if (e.detail) selectedF.push(file);
					if (!e.detail) selectedF = selectedF.filter((f) => f.id != file.id);
					return selectedF;
				});
			}}
		/>
	{/if}
	<ContextMenu.Root>
		<ContextMenu.Trigger class="max-w-full flex flex-1 overflow-hidden">
			<div
				class={cn(
					'file-list-item hover:bg-muted/80',
					selected && 'bg-secondary/80 hover:bg-secondary'
				)}
				id={`file-${file.id}`}
				on:click
				on:keydown
				role="button"
				tabindex="0"
			>
				<div class="info-wrap">
					<div class="info">
						<img draggable="false" class="file-icon" src={getVSIFileIcon(file.path)} alt="js" />
						<span class="text-base-12 name">
							{file.path.split('/').pop()}
						</span>
						<span class="text-base-12 path">
							{file.path}
						</span>
					</div>
				</div>
				<FileStatusIcons {file} />
			</div>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item
				on:click={() => {
					dialogDiscardOpen = true;
				}}
				class="flex justify-between cursor-pointer gap-2"
			>
				<span>Discard changes</span>
				<Icon name="undo-small" />
			</ContextMenu.Item>
			<ContextMenu.Item
				on:click={async () => {
					try {
						if (!repository || !file) return;
						const absPath = await join(repository.path, file.path);
						navigator.clipboard.writeText(absPath);
					} catch (err) {
						console.error('Failed to copy path', err);
						toast.error('Failed to copy path');
					}
				}}
				class="flex justify-between cursor-pointer gap-2"
			>
				<span>Copy Path</span>
				<Icon name="copy" />
			</ContextMenu.Item>
			<ContextMenu.Item
				on:click={() => {
					try {
						if (!repository || !file) return;
						navigator.clipboard.writeText(file.path);
					} catch (err) {
						console.error('Failed to copy relative path', err);
						toast.error('Failed to copy relative path');
					}
				}}
				class="flex justify-between cursor-pointer gap-2"
			>
				<span>Copy Relative Path</span>
				<Icon name="copy" />
			</ContextMenu.Item>
			<ContextMenu.Item
				disabled={isDeleted(file)}
				on:click={async () => {
					try {
						if (!repository || !file) return;
						const absPath = await join(repository.path, file.path);
						open(`vscode://file${absPath}`);
					} catch {
						console.error('Failed to open in VSCode');
						toast.error('Failed to open in VSCode');
					}
				}}
				class="flex justify-between cursor-pointer gap-2"
			>
				<span>Open in VSCode</span>
				<Icon name="vscode" />
			</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
</div>
{#if repository}
	<DiscardChanges {file} {repository} {setSelected} bind:dialogDiscardOpen />
{/if}

<style lang="postcss">
	.list-item-wrapper {
		display: flex;
		align-items: center;
		gap: var(--size-8);
	}

	.file-list-item {
		flex: 1;
		display: flex;
		align-items: center;
		height: var(--size-28);
		padding: var(--size-4) var(--size-8);
		gap: var(--size-16);
		border-radius: var(--radius-s);
		max-width: 100%;
		overflow: hidden;
		text-align: left;
		user-select: none;
		outline: none;
		margin-bottom: var(--size-2);
	}

	.info-wrap {
		display: flex;
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		gap: var(--size-10);
		overflow: hidden;
	}
	.info {
		display: flex;
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		gap: var(--size-6);
		overflow: hidden;
	}

	.file-icon {
		width: var(--size-12);
	}
	.name {
		white-space: nowrap;
		flex-shrink: 0;
		text-overflow: ellipsis;
		overflow: hidden;
		line-height: 120%;
	}
	.path {
		line-height: 120%;
		flex-shrink: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		opacity: 0.3;
	}
</style>
