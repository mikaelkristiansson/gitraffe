<script lang="ts">
	import FileListItem from './FileListItem.svelte';
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
	export let selected: WorkingDirectoryFileChange | undefined;
	export let setSelected: (
		file: WorkingDirectoryFileChange
	) => WorkingDirectoryFileChange | undefined;

	$: sortedFiles = sortLikeFileTree(files);
</script>

{#each sortedFiles as file (file.id)}
	<FileListItem
		{file}
		{readonly}
		{branchId}
		{isUnapplied}
		{selectedFiles}
		{files}
		{repository}
		showCheckbox={showCheckboxes}
		selected={selected === file}
		{setSelected}
		on:click={() => setSelected(file)}
	/>
{/each}
