<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import FileCardHeader from './FileCardHeader.svelte';
	import FileDiff from './FileDiff.svelte';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';
	import type { ChangedFile, CommittedFileChange } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';
	import { DiffType, type IDiff } from '$lib/models/diff';
	import { getCommitDiff, getWorkingDirectoryDiff } from '$lib/git/diff';
	import { computeAddedRemovedByDiff } from '$lib/utils/metrics';

	export let file: ChangedFile;
	export let isCommitedFile: boolean = false;
	export let repository: Repository;
	export let readonly = false;
	let diff: IDiff | null = null;

	const setWorkingDirectoryDiff = async () => {
		let response = null;
		if (isCommitedFile) {
			response = await getCommitDiff(repository, file, (file as CommittedFileChange).commitish);
		} else {
			response = await getWorkingDirectoryDiff(repository, file);
		}
		diff = response;
	};

	$: file && setWorkingDirectoryDiff();
</script>

<Card.Root id={`file-${file.id}`} class="overflow-hidden flex flex-col max-h-full flex-grow">
	<FileCardHeader
		{file}
		fileStats={diff?.kind === DiffType.Text
			? computeAddedRemovedByDiff(diff)
			: { added: 0, removed: 0 }}
		on:close
	/>
	<ScrollableContainer wide>
		{#if diff}
			<FileDiff filePath={file.path} {readonly} {diff} />
		{/if}
	</ScrollableContainer>
</Card.Root>
