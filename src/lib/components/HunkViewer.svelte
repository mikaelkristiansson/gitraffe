<script lang="ts">
	import type { DiffHunk } from '$lib/models/diff';
	import Button from './Button.svelte';
	import HunkLine from './HunkLine.svelte';
	import Scrollbar from './Scrollbar.svelte';

	export let viewport: HTMLDivElement | undefined = undefined;
	export let contents: HTMLDivElement | undefined = undefined;
	export let filePath: string;
	export let section: DiffHunk;
	export let minWidth: number;
	export let readonly: boolean = false;
	export let linesModified: number;

	let alwaysShow = false;
</script>

<div class="scrollable">
	<div
		bind:this={viewport}
		tabindex="0"
		role="cell"
		on:contextmenu|preventDefault
		class="hunk bg-muted/40 border hide-native-scrollbar"
		class:readonly
	>
		<div bind:this={contents} class="hunk__bg-stretch">
			{#if linesModified > 1000 && !alwaysShow}
				<div class="flex flex-col p-1">
					Change hidden as large diffs may slow down the UI
					<Button kind="outlined" color="neutral" on:click={() => (alwaysShow = true)}
						>show anyways</Button
					>
				</div>
			{:else}
				{@const hunk = section}
				{#each hunk.lines as line}
					<HunkLine {line} sectionType={line.type} {filePath} {readonly} {minWidth} />
				{/each}
			{/if}
		</div>
	</div>
	<Scrollbar {viewport} {contents} horz />
</div>

<style lang="postcss">
	.scrollable {
		display: flex;
		flex-direction: column;
		position: relative;
		border-radius: var(--radius-s);
		overflow: hidden;
	}

	.hunk {
		display: flex;
		flex-direction: column;
		overflow-x: auto;
		user-select: text;

		/* background: var(--clr-theme-container-light); */
		border-radius: var(--radius-s);
		/* border: 1px solid var(--clr-theme-container-outline-light); */
		/* transition: border-color var(--transition-fast); */
	}

	.hunk__bg-stretch {
		width: 100%;
		min-width: max-content;
	}
</style>
