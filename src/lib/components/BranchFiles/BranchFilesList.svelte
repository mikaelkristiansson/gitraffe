<script lang="ts">
	import FileListItem from './FileListItem.svelte';
	import type { Writable } from 'svelte/store';
	import type { ChangedFile } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';
	import type { SetSelected } from '$lib/types';

	export let repository: Repository | undefined;
	export let files: ChangedFile[];
	export let showCheckboxes = false;
	export let selectedFiles: Writable<ChangedFile[]>;
	export let selected: ChangedFile | undefined;
	export let setSelected: SetSelected;
</script>

{#each files as file (file.id)}
	<FileListItem
		{file}
		{selectedFiles}
		{repository}
		showCheckbox={showCheckboxes}
		selected={selected === file}
		{setSelected}
		on:click={() => setSelected(file)}
	/>
{/each}
