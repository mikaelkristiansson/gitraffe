<script lang="ts">
	import FileListItem from './FileListItem.svelte';
	import { maybeMoveSelection } from '$lib/utils/selection';
	// import { sortLikeFileTree } from '$lib/vbranches/filetree';
	import type { Writable } from 'svelte/store';
	import { sortLikeFileTree } from './filetree';
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository | undefined;
	export let branchId: string;
	export let files: WorkingDirectoryFileChange[];
	export let isUnapplied = false;
	export let showCheckboxes = false;
	export let selectedFiles: Writable<WorkingDirectoryFileChange[]>;
	export let allowMultiple = false;
	export let readonly = false;

	$: sortedFiles = sortLikeFileTree(files);
</script>

{#each sortedFiles as file (file.id)}
	<FileListItem
		{file}
		{readonly}
		{branchId}
		{isUnapplied}
		{selectedFiles}
		{repository}
		showCheckbox={showCheckboxes}
		selected={$selectedFiles.includes(file)}
		on:click={(e) => {
			const isAlreadySelected = $selectedFiles.includes(file);
			if (isAlreadySelected && e.shiftKey) {
				selectedFiles.update((fileIds) => fileIds.filter((f) => f.id != file.id));
			} else if (isAlreadySelected) {
				$selectedFiles = [];
			} else if (e.shiftKey && allowMultiple) {
				selectedFiles.update((files) => [file, ...files]);
			} else {
				$selectedFiles = [file];
			}
		}}
		on:keydown={(e) => {
			e.preventDefault();
			maybeMoveSelection(e.key, files, selectedFiles);
		}}
	/>
{/each}
