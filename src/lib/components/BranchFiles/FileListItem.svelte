<script lang="ts">
	import * as ContextMenu from '$lib/components/ui/context-menu';
	import FileStatusIcons from './FileStatusIcons.svelte';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { getVSIFileIcon } from '$lib/ext-icons';
	import type { Writable } from 'svelte/store';
	import { AppFileStatusKind, type ChangedFile } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';
	import { cn } from '$lib/utils';
	import Icon from '../Icon.svelte';
	import { join } from '@tauri-apps/api/path';
	import { open } from '@tauri-apps/plugin-shell';
	import { toast } from 'svelte-sonner';
	import DiscardChanges from './DiscardChanges.svelte';
	import type { SetSelected } from '$lib/types';

	export let repository: Repository | undefined;
	export let file: ChangedFile;
	export let selected: boolean;
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

<div class="flex items-center gap-2 w-full">
	{#if showCheckbox}
		<Checkbox
			size="sm"
			checked={indeterminate ? 'indeterminate' : checked}
			onCheckedChange={(v) => {
				selectedFiles.update((selectedF) => {
					if (v) selectedF.push(file);
					if (!v) selectedF = selectedF.filter((f) => f.id != file.id);
					return selectedF;
				});
			}}
		/>
	{/if}
	<ContextMenu.Root>
		<ContextMenu.Trigger class="max-w-full flex flex-1 overflow-hidden">
			<div
				class={cn(
					'flex flex-1 items-center rounded-sm h-7 py-1 px-2 gap-4 max-w-full overflow-hidden text-left select-none outline-none mb-[0.1rem] hover:bg-muted/80',
					selected && 'bg-muted hover:bg-muted/80'
				)}
				id={`file-${file.id}`}
				on:click
				on:keydown
				role="button"
				tabindex="0"
			>
				<div class="flex items-center flex-grow flex-shrink overflow-hidden gap-3">
					<div class="flex items-center flex-grow flex-shrink overflow-hidden gap-[0.4rem]">
						<img draggable="false" class="w-3" src={getVSIFileIcon(file.path)} alt="js" />
						<span
							class="text-xs whitespace-nowrap flex-shrink-0 text-ellipsis overflow-hidden leading-[120%]"
						>
							{file.path.split('/').pop()}
						</span>
						<span
							class="text-xs leading-[120%] flex-shrink whitespace-nowrap text-ellipsis overflow-hidden opacity-30"
						>
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
