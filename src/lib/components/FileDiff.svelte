<script lang="ts">
	import HunkViewer from './HunkViewer.svelte';
	import { type DiffHunk, DiffType, type IDiff, DiffLineType } from '$lib/models/diff';
	import { Button } from './ui/button';
	import * as Alert from '$lib/components/ui/alert';
	import { computeAddedRemovedByDiff } from '$lib/utils/metrics';

	export let filePath: string;
	export let diff: IDiff;
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
	$: computed = diff.kind === DiffType.Text && computeAddedRemovedByDiff(diff);

	let alwaysShow = false;
</script>

<div class="hunks">
	{#if isBinary}
		Binary content not shown
	{:else if isLarge}
		Diff too large to be shown
	{:else if computed && computed.added + computed.removed > 1000 && !alwaysShow}
		<div class="flex flex-col p-1">
			Change hidden as large numbers of diffs may slow down the UI
			<Button variant="outline" on:click={() => (alwaysShow = true)}>show anyways</Button>
		</div>
	{:else}
		{#if diff.kind === DiffType.Text && diff.hunks.length === 0}
			<Alert.Root>
				<Alert.Title>No changes</Alert.Title>
				<Alert.Description>No changes in this file</Alert.Description>
			</Alert.Root>
		{/if}
		{#each hunks as section}
			{@const { added, removed } = computeAddedRemovedByHunk(section)}
			<div class="hunk-wrapper">
				<div class="indicators text-[0.6rem] leading-tight">
					<span class="added">+{added}</span>
					<span class="removed">-{removed}</span>
				</div>
				<HunkViewer {filePath} {section} {readonly} {minWidth} />
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
		@apply p-4 gap-4;
	}
	.hunk-wrapper {
		display: flex;
		flex-direction: column;
		@apply gap-2;
	}
	.indicators {
		display: flex;
		align-items: center;
		@apply gap-1;
	}
	.added {
		@apply text-green-500;
	}
	.removed {
		@apply text-red-500;
	}
</style>
