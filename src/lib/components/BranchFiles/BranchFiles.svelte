<script lang="ts">
	import BranchFilesHeader from './BranchFilesHeader.svelte';
	import BranchFilesList from './BranchFilesList.svelte';
	import { writable, type Writable } from 'svelte/store';
	import type { ChangedFile } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';
	import type { SetSelected } from '$lib/types';

	export let repository: Repository;
	export let files: ChangedFile[];
	export let selectedFiles: Writable<ChangedFile[]> = writable([]);
	export let showCheckboxes = false;
	export let selected: ChangedFile | undefined;
	export let setSelected: SetSelected;
</script>

<div class="flex-1">
	<div class="branch-files__header">
		<BranchFilesHeader {files} {showCheckboxes} {selectedFiles} />
	</div>
	{#if files.length > 0}
		<div class="files-padding {$$props.class || ''}">
			<BranchFilesList
				{files}
				{selectedFiles}
				{showCheckboxes}
				{repository}
				{selected}
				{setSelected}
			/>
		</div>
	{/if}
</div>

<style lang="postcss">
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
