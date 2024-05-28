<script lang="ts">
	import { DiffHunkExpansionType } from '$lib/models/diff';
	import { ArrowDownFromLine, ArrowUpFromLine, FoldVertical } from 'lucide-svelte';

	export let hunkIndex: number;
	export let expansionType: DiffHunkExpansionType;
	export let lineGutterWidth: number;
	export let onExpandHunk: (hunkIndex: number, expansionType: DiffHunkExpansionType) => void;
</script>

{#if expansionType === DiffHunkExpansionType.None}
	<div class="hunk-expansion-handle" style="width: {lineGutterWidth}px">
		<div class="hunk-expansion-placeholder" />
	</div>
{:else}
	<div class="hunk-expansion-handle selectable hoverable" style="width: {lineGutterWidth}px">
		<button on:click={() => onExpandHunk(hunkIndex, expansionType)}>
			{#if expansionType === DiffHunkExpansionType.Up}
				<!-- <ArrowUpFromLine class="h-3 w-3" /> -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
					><path
						d="M7.823 1.677 4.927 4.573A.25.25 0 0 0 5.104 5H7.25v3.236a.75.75 0 1 0 1.5 0V5h2.146a.25.25 0 0 0 .177-.427L8.177 1.677a.25.25 0 0 0-.354 0ZM13.75 11a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5Zm-3.75.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75ZM7.75 11a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5ZM4 11.75a.75.75 0 0 1 .75-.75h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1-.75-.75ZM1.75 11a.75.75 0 0 0 0 1.5h.5a.75.75 0 0 0 0-1.5h-.5Z"
					></path></svg
				>
			{:else if expansionType === DiffHunkExpansionType.Down}
				<!-- <ArrowDownFromLine class="h-3 w-3" /> -->
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"
					><path
						d="m8.177 14.323 2.896-2.896a.25.25 0 0 0-.177-.427H8.75V7.764a.75.75 0 1 0-1.5 0V11H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0ZM2.25 5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 4.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5a.75.75 0 0 1 .75.75ZM8.25 5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 4.25a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5a.75.75 0 0 1 .75.75Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z"
					></path></svg
				>
			{:else if expansionType === DiffHunkExpansionType.Short}
				<!-- <FoldVertical class="h-3 w-3" /> -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 16 16"
					width="16"
					height="16"
					class="fill-inherit"
					><path
						d="M10.896 2H8.75V.75a.75.75 0 0 0-1.5 0V2H5.104a.25.25 0 0 0-.177.427l2.896 2.896a.25.25 0 0 0 .354 0l2.896-2.896A.25.25 0 0 0 10.896 2ZM8.75 15.25a.75.75 0 0 1-1.5 0V14H5.104a.25.25 0 0 1-.177-.427l2.896-2.896a.25.25 0 0 1 .354 0l2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25Zm-6.5-6.5a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z"
					></path></svg
				>
			{/if}
		</button>
		<!-- <Button
          onClick={elementInfo.handler}
          onContextMenu={this.props.onContextMenuExpandHunk}
          tooltip={elementInfo.title}
          toolTipDirection={TooltipDirection.SOUTH}
          ariaLabel={elementInfo.title}
          onButtonRef={this.getOnHunkExpansionRef(hunkIndex, expansionType)}
        >
          <Octicon symbol={elementInfo.icon} />
        </Button> -->
	</div>
{/if}
