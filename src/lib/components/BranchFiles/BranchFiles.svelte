<script lang="ts">
	import BranchFilesHeader from './BranchFilesHeader.svelte';
	import BranchFilesList from './BranchFilesList.svelte';
	import FileTree from './FileTree.svelte';
	import type { Writable } from 'svelte/store';
	import { filesToFileTree } from './filetree';
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository;
	export let branchId: string;
	export let files: WorkingDirectoryFileChange[];
	export let isUnapplied: boolean;
	export let selectedFiles: Writable<WorkingDirectoryFileChange[]>;
	export let showCheckboxes = false;
	export let selected: WorkingDirectoryFileChange | undefined;
	export let setSelected: (
		file: WorkingDirectoryFileChange
	) => WorkingDirectoryFileChange | undefined;

	export let allowMultiple: boolean;
	export let readonly: boolean;

	let selectedListMode: string;
</script>

<div class="branch-files" class:isUnapplied>
	<div class="branch-files__header">
		<BranchFilesHeader {files} {showCheckboxes} bind:selectedListMode {selectedFiles} />
	</div>
	{#if files.length > 0}
		<div class="files-padding max-h-[12rem] overflow-x-scroll">
			{#if selectedListMode == 'list'}
				<BranchFilesList
					{allowMultiple}
					{readonly}
					{branchId}
					{files}
					{selectedFiles}
					{showCheckboxes}
					{isUnapplied}
					{repository}
					{selected}
					{setSelected}
				/>
			{:else}
				<FileTree
					node={filesToFileTree(files)}
					{allowMultiple}
					{readonly}
					{showCheckboxes}
					{branchId}
					isRoot={true}
					{selectedFiles}
					{isUnapplied}
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

		&.isUnapplied {
			border-radius: var(--radius-m);
		}
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
