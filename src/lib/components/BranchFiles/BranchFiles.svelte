<script lang="ts">
	import BranchFilesHeader from './BranchFilesHeader.svelte';
	import BranchFilesList from './BranchFilesList.svelte';
	import FileTree from './FileTree.svelte';
	import { writable, type Writable } from 'svelte/store';
	import { filesToFileTree } from './filetree';
	import type { ChangedFile } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository;
	export let files: ChangedFile[];
	export let selectedFiles: Writable<ChangedFile[]> = writable([]);
	export let showCheckboxes = false;
	export let selected: ChangedFile | undefined;
	export let setSelected: (file: ChangedFile) => ChangedFile | undefined;

	let selectedListMode: string;
</script>

<div class="branch-files">
	<div class="branch-files__header">
		<BranchFilesHeader {files} {showCheckboxes} bind:selectedListMode {selectedFiles} />
	</div>
	{#if files.length > 0}
		<div class="files-padding {$$props.class}">
			{#if selectedListMode == 'list'}
				<BranchFilesList
					{files}
					{selectedFiles}
					{showCheckboxes}
					{repository}
					{selected}
					{setSelected}
				/>
			{:else}
				<FileTree
					node={filesToFileTree(files)}
					{showCheckboxes}
					isRoot={true}
					{selectedFiles}
					{files}
					{repository}
					{selected}
					{setSelected}
				/>
			{/if}
		</div>
	{/if}
</div>

<style lang="postcss">
	.branch-files {
		flex: 1;
		background: var(--clr-theme-container-light);
		border-radius: var(--radius-m) var(--radius-m) 0 0;
	}
	.branch-files__header {
		padding-top: var(--size-14);
		padding-bottom: var(--size-12);
		padding-left: var(--size-14);
		padding-right: var(--size-14);
	}
	.files-padding {
		padding-top: 0;
		padding-bottom: var(--size-12);
		padding-left: var(--size-14);
		padding-right: var(--size-14);
	}
</style>
