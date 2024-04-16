<script lang="ts">
	import Button from './Button.svelte';
	import HunkViewer from './HunkViewer.svelte';
	import { type DiffHunk, DiffType, type IDiff, DiffLineType } from '$lib/models/diff';

	export let filePath: string;
	export let diff: IDiff;
	// export let isUnapplied: boolean;
	export let selectable = false;
	export let readonly: boolean = false;

	function getGutterMinWidth(max: number) {
		if (max >= 10000) return 2.5;
		if (max >= 1000) return 2;
		if (max >= 100) return 1.5;
		if (max >= 10) return 1.25;
		return 1;
	}

	function computeAddedRemovedByHunk(hunk: DiffHunk) {
		let added = 0;
		let removed = 0;
		for (const line of hunk.lines) {
			if (line.type === DiffLineType.Add) added++;
			if (line.type === DiffLineType.Delete) removed++;
		}
		return { added, removed };
	}

	$: isBinary = diff.kind === DiffType.Binary;
	$: isLarge = diff.kind === DiffType.LargeText;
	$: hunks = diff.kind === DiffType.Text ? diff.hunks : [];
	$: maxLineNumber = diff.kind === DiffType.Text ? diff.maxLineNumber : 0;
	$: minWidth = getGutterMinWidth(maxLineNumber);

	let alwaysShow = false;
</script>

<div class="hunks">
	{#if isBinary}
		Binary content not shown
	{:else if isLarge}
		Diff too large to be shown
	{:else if diff.kind === DiffType.Text && diff.hunks.length > 50 && !alwaysShow}
		<div class="flex flex-col p-1">
			Change hidden as large numbers of diffs may slow down the UI
			<Button kind="outlined" color="neutral" on:click={() => (alwaysShow = true)}
				>show anyways</Button
			>
		</div>
	{:else}
		{#each hunks as section}
			{@const { added, removed } = computeAddedRemovedByHunk(section)}
			<div class="hunk-wrapper">
				<div class="indicators text-base-11">
					<span class="added">+{added}</span>
					<span class="removed">-{removed}</span>
				</div>
				<HunkViewer
					{filePath}
					{section}
					{selectable}
					{readonly}
					{minWidth}
					linesModified={added + removed}
				/>
			</div>
		{/each}
	{/if}
</div>

<style lang="postcss">
	.hunks {
		display: flex;
		flex-direction: column;
		position: relative;
		max-height: 100%;
		flex-shrink: 0;
		padding: var(--size-16);
		gap: var(--size-16);
	}
	.hunk-wrapper {
		display: flex;
		flex-direction: column;
		gap: var(--size-10);
	}
	.indicators {
		display: flex;
		align-items: center;
		gap: var(--size-2);
	}
	.added {
		color: #45b156;
	}
	.removed {
		color: #ff3e00;
	}
</style>