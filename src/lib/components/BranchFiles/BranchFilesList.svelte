<script lang="ts">
	import FileListItem from './FileListItem.svelte';
	import type { Writable } from 'svelte/store';
	import { sortLikeFileTree } from './filetree';
	import type { ChangedFile } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository | undefined;
	export let files: ChangedFile[];
	export let showCheckboxes = false;
	export let selectedFiles: Writable<ChangedFile[]>;
	export let selected: ChangedFile | undefined;
	export let setSelected: (file: ChangedFile) => ChangedFile | undefined;

	$: sortedFiles = sortLikeFileTree(files);
</script>

{#each sortedFiles as file (file.id)}
	<FileListItem
		{file}
		{selectedFiles}
		{files}
		{repository}
		showCheckbox={showCheckboxes}
		selected={selected === file}
		{setSelected}
		on:click={() => setSelected(file)}
	/>
{/each}
