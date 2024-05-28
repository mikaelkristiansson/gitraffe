<script lang="ts">
	import { cn } from '$lib/utils';
	import { DiffColumn, type IRowSelectableGroup } from './diff-helper';
	import type { CheckBoxIdentifier } from './side-by-side-diff-row';

	export let lineNumbers: Array<number | undefined>;
	export let column: DiffColumn | undefined;
	export let isSelected: boolean = false;
	export let isDiffSelectable: boolean = false;
	export let rowSelectableGroup: IRowSelectableGroup | null;
	export let getLineNumbersContainerID: (column: DiffColumn) => string;
	export let lineGutterWidth: number = 0;

	const wrapperID = column === undefined ? undefined : getLineNumbersContainerID(column);
	const isSelectable = isDiffSelectable && isSelected !== undefined;
	const classes = cn('line-number', {
		selectable: isSelectable,
		hoverable: isSelectable,
		'line-selected': isSelected,
		hover: rowSelectableGroup?.isHovered
	});

	const firstDefinedLineNumber = lineNumbers.filter((ln) => ln !== undefined).at(0);
	// if (firstDefinedLineNumber === undefined) {
	//   // This shouldn't be possible. If there are no line numbers, we shouldn't
	//   // be rendering this component.
	//   return null
	// }

	// Note: This id is used by the check all aria-controls attribute,
	// modification of this should be reflected there.
	const checkboxId: CheckBoxIdentifier | string = firstDefinedLineNumber
		? `${firstDefinedLineNumber}-${column === DiffColumn.After ? 'after' : 'before'}`
		: '';
</script>

<!-- on:mousedown={onMouseDownLineNumber}
on:contextmenu={onContextMenuLineNumber} -->
<div id={wrapperID} class={classes} style="width: {lineGutterWidth}px">
	{#if isSelectable}
		<!-- on:change={onLineNumberCheckboxChange} -->
		<input id={checkboxId} class="sr-only" type="checkbox" checked={isSelected} />
	{/if}
	<label for={checkboxId}>
		{#if isDiffSelectable}
			<div class="line-number-check">
				<!-- {isSelected ? <Octicon symbol={diffCheck} /> : null} -->
			</div>
		{/if}
		{#each lineNumbers as lineNumber, index}
			<span>
				{#if lineNumber}
					<span class="sr-only">Line </span>
					{lineNumber}
					<span class="sr-only">
						{#if column === DiffColumn.After}
							added
						{:else}
							deleted
						{/if}
					</span>
				{/if}
			</span>
		{/each}
	</label>
</div>
