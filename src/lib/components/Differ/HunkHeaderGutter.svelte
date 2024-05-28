<script lang="ts">
	import { DiffHunkExpansionType } from '$lib/models/diff';
	import HunkExpansionHandle from './HunkExpansionHandle.svelte';

	export let hunkIndex: number;
	export let expansionType: DiffHunkExpansionType;
	export let lineGutterWidth: number;
	export let onExpandHunk: (hunkIndex: number, expansionType: DiffHunkExpansionType) => void;
</script>

{#if expansionType === DiffHunkExpansionType.Both}
	<div>
		<HunkExpansionHandle
			{hunkIndex}
			expansionType={DiffHunkExpansionType.Down}
			{lineGutterWidth}
			{onExpandHunk}
		/>
		<HunkExpansionHandle
			{hunkIndex}
			expansionType={DiffHunkExpansionType.Up}
			{lineGutterWidth}
			{onExpandHunk}
		/>
	</div>
{:else}
	<HunkExpansionHandle {hunkIndex} {expansionType} {lineGutterWidth} {onExpandHunk} />
{/if}
