<script lang="ts">
	import type { Repository } from '$lib/models/repository';
	import type { ChangedFile } from '$lib/models/status';
	import noSelectSvg from '$lib/assets/empty-state/lane-new.svg?raw';
	import { slide } from 'svelte/transition';
	import FileCard from './FileCard.svelte';
	import { quintOut } from 'svelte/easing';
	import type { SetSelected } from '$lib/types';

	export let selected: ChangedFile | undefined;
	export let setSelected: SetSelected;
	export let repository: Repository;
</script>

<div class="preview-wrapper">
	{#if selected}
		<div class="file-preview" in:slide={{ duration: 180, easing: quintOut, axis: 'x' }}>
			<FileCard
				file={selected}
				isCommitedFile={true}
				{repository}
				readonly={selected.status.kind !== 'Conflicted'}
				on:close={() => {
					selected = undefined;
					setSelected(undefined);
				}}
			/>
		</div>
	{:else}
		<div class="no-selected text-card-foreground/30">
			{@html noSelectSvg}
			<h2 class="text-base-body-13">No selected file</h2>
		</div>
	{/if}
</div>

<style lang="postcss">
	.preview-wrapper {
		padding: 0 var(--size-8);
		overflow: scroll;
	}
	.no-selected {
		user-select: none;
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		align-items: center;
		text-align: center;
		justify-content: center;
		height: 100%;
		cursor: default;
	}

	.file-preview {
		display: flex;
		position: relative;
		height: 100%;
		width: 100%;
		overflow: hidden;
		align-items: self-start;
		max-height: 25rem;
	}
</style>
