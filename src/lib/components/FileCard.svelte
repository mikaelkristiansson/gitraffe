<script lang="ts">
	import FileCardHeader from './FileCardHeader.svelte';
	import FileDiff from './FileDiff.svelte';
	import ScrollableContainer from '$lib/components/ScrollableContainer.svelte';
	import type { ChangedFile, CommittedFileChange } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';
	import { type IDiff } from '$lib/models/diff';
	import { getCommitDiff, getWorkingDirectoryDiff } from '$lib/git/diff';

	export let file: ChangedFile;
	export let isCommitedFile: boolean = false;
	export let repository: Repository;
	export let selectable = false;
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

<div id={`file-${file.id}`} class="file-card card">
	<FileCardHeader {file} on:close />
	<ScrollableContainer wide>
		{#if diff}
			<FileDiff filePath={file.path} {readonly} {diff} {selectable} />
		{/if}
	</ScrollableContainer>
</div>

<div class="divider-line"></div>

<style lang="postcss">
	.divider-line {
		position: absolute;
		top: 0;
		right: 0;
		width: 1px;
		height: 100%;

		/* background-color: red; */
		/* background-color: var(--clr-theme-container-outline-light); */

		&:after {
			pointer-events: none;
			content: '';
			position: absolute;
			top: 0;
			right: 50%;
			transform: translateX(50%);
			width: 1px;
			height: 100%;
		}
	}

	.file-card {
		background: var(--clr-theme-container-light);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		max-height: 100%;
		flex-grow: 1;
	}

	@keyframes wiggle {
		0% {
			transform: rotate(0deg);
		}
		40% {
			transform: rotate(0deg);
		}
		60% {
			transform: rotate(2deg);
		}
		80% {
			transform: rotate(-2deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}
	:global(.wiggle) {
		animation: wiggle 0.5s infinite;
	}
</style>
