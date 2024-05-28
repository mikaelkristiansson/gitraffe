<script lang="ts">
	import { DiffSelectionType } from '$lib/models/diff';
	import { cn } from '$lib/utils';
	import type { IRowSelectableGroup } from './diff-helper';

	export let rowSelectableGroup: IRowSelectableGroup | null = null;

	const isOnlyOneCheckInRow = rowSelectableGroup?.staticData.lineNumbersIdentifiers.length === 1;
	const style = { height: rowSelectableGroup?.height };
	const hunkHandleClassName = cn('hunk-handle', 'hoverable', {
		// selected is a class if any line in the group is selected
		selected: rowSelectableGroup?.selectionState !== DiffSelectionType.None
	});
	const checkAllId = rowSelectableGroup?.staticData.lineNumbersIdentifiers.join('-');
</script>

{#if rowSelectableGroup === null || !rowSelectableGroup?.isCheckAllRenderedInRow}
	<div
		class={cn('hunk-handle-place-holder', {
			selected: rowSelectableGroup?.selectionState !== DiffSelectionType.None
		})}
	></div>
{:else}
	hh
	<!-- <label
        htmlFor={checkAllId}
        onMouseEnter={this.onMouseEnterHunk}
        onMouseLeave={this.onMouseLeaveHunk}
        onContextMenu={this.onContextMenuHunk}
        className={hunkHandleClassName}
        style={style}
      >
        <span className="focus-handle">
          {(!enableGroupDiffCheckmarks() || !this.props.showDiffCheckMarks) && (
            <div className="increased-hover-surface" style={{ height }} />
          )}
          {!isOnlyOneCheckInRow &&
            this.getCheckAllOcticon(selectionState, isFirst)}
          {!isOnlyOneCheckInRow && (
            <span className="sr-only">
              {' '}
              Lines {lineNumbers.at(0)} to {lineNumbers.at(-1)}{' '}
              {diffType === DiffRowType.Added
                ? 'added'
                : diffType === DiffRowType.Deleted
                ? 'deleted'
                : 'modified'}
            </span>
          )}
        </span>
      </label> -->
{/if}
