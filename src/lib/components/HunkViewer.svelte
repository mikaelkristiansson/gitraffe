<script lang="ts">
	import type { DiffHunk } from '$lib/models/diff';
	import HunkLine from './HunkLine.svelte';
	import ScrollArea from './ui/scroll-area/scroll-area.svelte';

	export let filePath: string;
	export let section: DiffHunk;
	export let minWidth: number;
	export let readonly: boolean = false;
</script>

<div
	tabindex="0"
	role="cell"
	on:contextmenu|preventDefault
	class="hunk bg-muted/40 border"
	class:readonly
>
	<ScrollArea orientation="both" class="w-full">
		<div class="hunk__bg-stretch">
			{#each section.lines as line}
				<HunkLine {line} sectionType={line.type} {filePath} {readonly} {minWidth} />
			{/each}
		</div>
	</ScrollArea>
</div>

<style lang="postcss">
	.hunk {
		display: flex;
		flex-direction: column;
		user-select: text;
		@apply rounded-sm border bg-card;
	}

	.hunk__bg-stretch {
		width: 100%;
		min-width: max-content;
	}
</style>
