<script lang="ts">
	import {
		DiffHunk,
		DiffHunkExpansionType,
		DiffSelectionType,
		type DiffSelection,
		type ITextDiff
	} from '$lib/models/diff';
	import type { ChangedFile } from '$lib/models/status';
	import { onMount } from 'svelte';
	import { getLineFilters, highlightContents, type IFileContents } from './helper';
	import {
		getDiffRows,
		type CheckBoxIdentifier,
		type IRowSelectableGroupStaticData
	} from './side-by-side-diff-row';
	import { cn } from '$lib/utils';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import {
		DiffRowType,
		canSelect,
		isRowChanged,
		type IRowSelectableGroup,
		type SimplifiedDiffRow
	} from './diff-helper';
	import Row from './Row.svelte';
	import type { ITokens } from './types';
	import { expandTextDiffHunk, type DiffExpansionKind } from './text-diff-expansion';
	import { findInteractiveOriginalDiffRange } from './diff-explorer';

	export let file: ChangedFile;
	export let diff: ITextDiff;
	export let fileContents: IFileContents | null;
	// export let hideWhitespaceInDiff;
	export let showSideBySideDiff;
	// export let onIncludeChanged;
	// export let onDiscardChanges;
	// export let askForConfirmationOnDiscardChanges;
	// export let onHideWhitespaceInDiffChanged;
	export let showDiffCheckMarks;

	// let virtualListRef: HTMLDivElement;
	// let diffContainer: HTMLDivElement;
	let onDiffContainerRef: HTMLDivElement;
	let virtualListEl: HTMLDivElement;
	let virtualItemEls: HTMLDivElement[] = [];

	let activeDiff = diff;
	/** Diff to restore when "Collapse all expanded lines" option is used */
	let diffToRestore: ITextDiff | null = null;

	let textSelectionStartRow: number | undefined = undefined;
	let textSelectionEndRow: number | undefined = undefined;

	let renderedStartIndex: number = 0;
	let renderedStopIndex: number | undefined = undefined;

	let hunkExpansionRefs = new Map<string, HTMLButtonElement>();
	let combinedTokens: { afterTokens: ITokens; beforeTokens: ITokens } | null = null;
	let selectingTextInRow = 'before';
	let lastExpandedHunk = null;
	let hoveredHunk: number | undefined = undefined;

	const DefaultRowHeight = 20;

	/**
	 * Caches a group of selectable row's information that does not change on row
	 * rerender like line numbers using the row's hunkStartLline as the key.
	 */
	let rowSelectableGroupStaticDataCache = new Map<number, IRowSelectableGroupStaticData>();

	const initDiffSyntaxMode = async () => {
		const contents = fileContents;

		if (contents === null) {
			return;
		}

		const currentDiff = activeDiff;

		// Store the current props and state so that we can see if anything
		// changes from underneath us as we're making asynchronous
		// operations that makes our data stale or useless.
		// const propsSnapshot = this.props
		// const stateSnapshot = this.state

		const lineFilters = getLineFilters(currentDiff.hunks);
		const tabSize = 4;

		const tokens = await highlightContents(contents, tabSize, lineFilters);

		// if (
		//   !highlightParametersEqual(
		//     this.props,
		//     propsSnapshot,
		//     this.state,
		//     stateSnapshot
		//   )
		// ) {
		//   return
		// }

		combinedTokens = {
			beforeTokens: tokens.oldTokens,
			afterTokens: tokens.newTokens
		};
	};

	const canExpandDiff = () => {
		const contents = fileContents;
		return contents !== null && contents.canBeExpanded && contents.newContents.length > 0;
	};

	const getCurrentDiffRows = () => {
		const newDiffRows = getDiffRows(activeDiff, showSideBySideDiff, canExpandDiff());
		return newDiffRows;
	};

	const getSelection = (): DiffSelection | undefined => {
		return canSelect(file) ? file.selection : undefined;
	};

	/** Expand a selected hunk. */
	const expandHunk = (hunk: DiffHunk, kind: DiffExpansionKind) => {
		const contents = fileContents;

		if (contents === null || !canExpandDiff()) {
			return;
		}

		const updatedDiff = expandTextDiffHunk(activeDiff, hunk, kind, contents.newContents);

		if (updatedDiff === undefined) {
			return;
		}

		activeDiff = updatedDiff;

		// this.setState({ diff: updatedDiff })
	};

	const onExpandHunk = (hunkIndex: number, expansionType: DiffHunkExpansionType) => {
		if (hunkIndex === -1 || hunkIndex >= activeDiff.hunks.length) {
			return;
		}
		lastExpandedHunk = { hunkIndex, expansionType };
		// this.setState({ lastExpandedHunk: { hunkIndex, expansionType } })

		const kind = expansionType === DiffHunkExpansionType.Down ? 'down' : 'up';

		expandHunk(activeDiff.hunks[hunkIndex], kind);
	};

	const getSelectableGroupRowIndexRange = (
		hunkStartLine: number,
		rows: ReadonlyArray<SimplifiedDiffRow>
	) => {
		const diffRowStartIndex = rows.findIndex(
			(r) => isRowChanged(r) && r.hunkStartLine === hunkStartLine
		);

		let diffRowStopIndex = diffRowStartIndex;

		while (rows[diffRowStopIndex + 1] !== undefined && isRowChanged(rows[diffRowStopIndex + 1])) {
			diffRowStopIndex++;
		}

		return {
			diffRowStartIndex,
			diffRowStopIndex
		};
	};

	const getRowHeight = (row: { index: number }) => {
		return DefaultRowHeight;
		// return listRowsHeightCache.rowHeight(row) ?? DefaultRowHeight
	};

	const getSelectableGroupSelectionState = (
		hunks: ReadonlyArray<DiffHunk>,
		hunkStartLine: number
	): DiffSelectionType => {
		const selection = getSelection();
		if (selection === undefined) {
			return DiffSelectionType.None;
		}

		const range = findInteractiveOriginalDiffRange(hunks, hunkStartLine);
		if (range === null) {
			//Shouldn't happen, but if it does, we can't do anything with it
			return DiffSelectionType.None;
		}

		const { from, to } = range;

		return selection.isRangeSelected(from, to - from + 1);
	};

	const getRowSelectableGroupHeight = (from: number, to: number) => {
		const start = from > renderedStartIndex ? from : renderedStartIndex;

		const stop =
			renderedStopIndex !== undefined && to > renderedStopIndex + 10 ? renderedStopIndex + 10 : to;

		let height = 0;
		for (let i = start; i <= stop; i++) {
			height += getRowHeight({ index: i });
		}

		return height;
	};

	const getRowSelectableGroupStaticData = (
		hunkStartLine: number,
		rows: ReadonlyArray<SimplifiedDiffRow>
	): IRowSelectableGroupStaticData => {
		const cachedStaticData = rowSelectableGroupStaticDataCache.get(hunkStartLine);
		if (cachedStaticData !== undefined) {
			return cachedStaticData;
		}

		const { diffRowStartIndex, diffRowStopIndex } = getSelectableGroupRowIndexRange(
			hunkStartLine,
			rows
		);

		const lineNumbers = new Set<number>();
		let hasAfter = false;
		let hasBefore = false;

		const groupRows = rows.slice(diffRowStartIndex, diffRowStopIndex + 1);

		const lineNumbersIdentifiers: Array<CheckBoxIdentifier> = [];

		for (const r of groupRows) {
			if (r.type === DiffRowType.Added) {
				lineNumbers.add(r.data.lineNumber);
				hasAfter = true;
				lineNumbersIdentifiers.push(`${r.data.lineNumber}-after`);
			}

			if (r.type === DiffRowType.Deleted) {
				lineNumbers.add(r.data.lineNumber);
				hasBefore = true;
				lineNumbersIdentifiers.push(`${r.data.lineNumber}-before`);
			}

			if (r.type === DiffRowType.Modified) {
				hasAfter = true;
				hasBefore = true;
				lineNumbers.add(r.beforeData.lineNumber);
				lineNumbers.add(r.afterData.lineNumber);
				lineNumbersIdentifiers.push(
					`${r.beforeData.lineNumber}-before`,
					`${r.afterData.lineNumber}-after`
				);
			}
		}

		const diffType =
			hasAfter && hasBefore
				? DiffRowType.Modified
				: hasAfter
					? DiffRowType.Added
					: DiffRowType.Deleted;

		const data: IRowSelectableGroupStaticData = {
			diffRowStartIndex,
			diffRowStopIndex,
			diffType,
			lineNumbers: Array.from(lineNumbers).sort(),
			lineNumbersIdentifiers
		};

		rowSelectableGroupStaticDataCache.set(hunkStartLine, data);
		return data;
	};

	/**
	 * Gathers information about if the row is in a selectable group. This
	 * information is used to facilitate the use of check all feature for the
	 * selectable group.
	 *
	 * This will return null if the row is not in a selectable group. A group is
	 * more than one row.
	 */
	const getRowSelectableGroupDetails = (rowIndex: number): IRowSelectableGroup | null => {
		const thisRows = getDiffRows(activeDiff, showSideBySideDiff, canExpandDiff());
		const row = thisRows[rowIndex];

		if (row === undefined || !isRowChanged(row)) {
			return null;
		}

		const { hunkStartLine } = row;
		const staticData = getRowSelectableGroupStaticData(hunkStartLine, thisRows);
		const { diffRowStartIndex, diffRowStopIndex } = staticData;

		const isFirst = diffRowStartIndex === rowIndex;
		const isCheckAllRenderedInRow =
			isFirst || (diffRowStartIndex < renderedStartIndex && rowIndex === renderedStartIndex);

		return {
			isFirst,
			isCheckAllRenderedInRow,
			isHovered: hoveredHunk === hunkStartLine,
			selectionState: getSelectableGroupSelectionState(activeDiff.hunks, hunkStartLine),
			height: getRowSelectableGroupHeight(diffRowStartIndex, diffRowStopIndex),
			staticData
		};
	};

	onMount(() => {
		initDiffSyntaxMode();
	});

	let rows = getCurrentDiffRows();

	const containerClassName = cn(
		'side-by-side-diff-container overflow-hidden h-full rounded-sm bg-card',
		{
			'unified-diff': true,
			[`selecting-${selectingTextInRow}`]: showSideBySideDiff && selectingTextInRow !== undefined,
			editable: canSelect(file)
		}
	);

	$: {
		if (activeDiff) {
			rows = getCurrentDiffRows();
		}
	}

	$: virtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: rows.length,
		getScrollElement: () => virtualListEl,
		estimateSize: () => DefaultRowHeight,
		overscan: 100
	});

	$: items = $virtualizer.getVirtualItems();

	$: {
		if (virtualItemEls.length) virtualItemEls.forEach((el) => $virtualizer.measureElement(el));
	}
</script>

<div class={containerClassName}>
	<div class="side-by-side-diff cm-s-default overflow-hidden" bind:this={onDiffContainerRef}>
		{#if combinedTokens}
			<div
				class="list scroll-container z-10"
				style="height: {onDiffContainerRef?.clientHeight}px"
				bind:this={virtualListEl}
			>
				<div
					class="inner-scroll-container"
					style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;"
				>
					<div
						style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({items[0]
							? items[0].start
							: 0}px);"
					>
						{#each items as row, idx (row.index)}
							<div bind:this={virtualItemEls[idx]} data-index={row.index}>
								<Row
									numRow={row.index}
									row={rows[row.index]}
									nextRow={rows[row.index + 1]}
									prevRow={rows[row.index - 1]}
									diff={activeDiff}
									{showSideBySideDiff}
									{showDiffCheckMarks}
									isDiffSelectable={false}
									{getRowSelectableGroupDetails}
									{getSelection}
									afterTokens={combinedTokens.afterTokens}
									beforeTokens={combinedTokens.beforeTokens}
									{onExpandHunk}
								/>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.scroll-container {
		width: 100%;
		overflow-y: auto;
		contain: 'strict';
	}
</style>
