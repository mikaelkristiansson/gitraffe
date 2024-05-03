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
	<div class="px-3 pt-3 pb-2">
		<BranchFilesHeader {files} {showCheckboxes} {selectedFiles} />
	</div>
	{#if files.length > 0}
		<div class="pt-0 pb-2 px-3 {$$props.class || ''}">
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
