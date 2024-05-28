<script lang="ts">
	import {
		DiffHunk,
		DiffHunkExpansionType,
		DiffSelectionType,
		type DiffLine,
		type DiffSelection,
		type ITextDiff
	} from '$lib/models/diff';
	import { cn } from '$lib/utils';
	import Content from './Content.svelte';
	import ContentFromString from './ContentFromString.svelte';
	import HunkExpansionHandle from './HunkExpansionHandle.svelte';
	// import HunkHandle from './HunkHandle.svelte';
	import HunkHeaderGutter from './HunkHeaderGutter.svelte';
	import LineNumbers from './LineNumbers.svelte';
	import { findInteractiveOriginalDiffRange } from './diff-explorer';
	import {
		DiffColumn,
		DiffRowType,
		getFirstAndLastClassesSideBySide,
		getLineWidthFromDigitCount,
		isRowChanged,
		type DiffRow,
		type IDiffRowData,
		type IRowSelectableGroup,
		type SimplifiedDiffRow,
		type SimplifiedDiffRowData
	} from './diff-helper';
	import { getTokens } from './diff-syntax-mode';
	import { getNumberOfDigits } from './helper';
	import {
		getDiffRows,
		type CheckBoxIdentifier,
		type IRowSelectableGroupStaticData
	} from './side-by-side-diff-row';
	import { DiffRowPrefix, type ITokens } from './types';

	export let row: SimplifiedDiffRow;
	export let nextRow;
	export let prevRow;
	export let diff: ITextDiff;
	export let showSideBySideDiff: boolean;
	export let showDiffCheckMarks: boolean;
	export let isDiffSelectable: boolean;
	// export let canExpandDiff: () => boolean;
	export let getSelection: () => DiffSelection | undefined;
	export let afterTokens: ITokens;
	export let beforeTokens: ITokens;
	export let onExpandHunk: (hunkIndex: number, expansionType: DiffHunkExpansionType) => void;
	export let getRowSelectableGroupDetails: (rowIndex: number) => IRowSelectableGroup | null;
	export let numRow: number;

	export let style = '';
	export let index = 0;

	let temporarySelection: ISelection | undefined = undefined;
	// let hoveredHunk: number | undefined = undefined;
	let renderedStartIndex: number = 0;
	let renderedStopIndex: number | undefined = undefined;
	const DefaultRowHeight = 20;

	//   const listRowsHeightCache = new CellMeasurerCache({
	//   defaultHeight: DefaultRowHeight,
	//   fixedWidth: true,
	// })
	/**
	 * Caches a group of selectable row's information that does not change on row
	 * rerender like line numbers using the row's hunkStartLline as the key.
	 */
	const rowSelectableGroupStaticDataCache = new Map<number, IRowSelectableGroupStaticData>();

	interface ISelection {
		/// Initial diff line number in the selection
		readonly from: number;

		/// Last diff line number in the selection
		readonly to: number;

		readonly isSelected: boolean;
	}

	type SearchDirection = 'next' | 'previous';

	type ModifiedLine = { line: DiffLine; diffLineNumber: number };

	const isElement = (n: Node): n is Element => n.nodeType === Node.ELEMENT_NODE;
	const closestElement = (n: Node): Element | null => (isElement(n) ? n : n.parentElement);

	/**
	 * This method returns the width of a line gutter in pixels. For unified diffs
	 * the gutter contains the line number of both before and after sides, whereas
	 * for side-by-side diffs the gutter contains the line number of only one side.
	 */
	const getLineGutterWidth = () => {
		return (
			(showSideBySideDiff ? lineNumberWidth : lineNumberWidth * 2) +
			(isDiffSelectable && showDiffCheckMarks ? 20 : 0)
		);
	};

	// const closestRow = (n: Node, container: Element) => {
	// 	const row = closestElement(n)?.closest('div[role=row]');
	// 	if (row && container.contains(row)) {
	// 		const rowIndex = row.ariaRowIndex !== null ? parseInt(row.ariaRowIndex, 10) : NaN;
	// 		return isNaN(rowIndex) ? undefined : rowIndex;
	// 	}

	// 	return undefined;
	// };

	function isInTemporarySelection(
		diffLineNumber: number,
		selection: ISelection | undefined
	): selection is ISelection {
		if (selection === undefined) {
			return false;
		}

		if (
			diffLineNumber >= Math.min(selection.from, selection.to) &&
			diffLineNumber <= Math.max(selection.to, selection.from)
		) {
			return true;
		}

		return false;
	}

	function isInSelection(
		diffLineNumber: number,
		selection: DiffSelection | undefined,
		temporarySelection: ISelection | undefined
	) {
		const isInStoredSelection = selection?.isSelected(diffLineNumber) ?? false;

		if (temporarySelection === undefined) {
			return isInStoredSelection;
		}

		const isInTemporary = isInTemporarySelection(diffLineNumber, temporarySelection);

		if (temporarySelection.isSelected) {
			return isInStoredSelection || isInTemporary;
		} else {
			return isInStoredSelection && !isInTemporary;
		}
	}

	const getRowDataPopulated = (
		data: SimplifiedDiffRowData,
		row: number,
		column: DiffColumn,
		tokens: ITokens | undefined
	): IDiffRowData => {
		// const searchTokens = this.getSearchTokens(row, column)
		const lineTokens = getTokens(data.lineNumber, tokens);
		const finalTokens = [...data.tokens];

		// if (searchTokens !== undefined) {
		//   searchTokens.forEach(x => finalTokens.push(x))
		// }
		if (lineTokens !== null) {
			finalTokens.push(lineTokens);
		}

		return {
			...data,
			tokens: finalTokens,
			isSelected:
				data.diffLineNumber !== null &&
				isInSelection(data.diffLineNumber, getSelection(), temporarySelection)
		};
	};

	const createFullRow = (row: SimplifiedDiffRow, numRow: number): DiffRow => {
		if (row.type === DiffRowType.Added) {
			return {
				...row,
				data: getRowDataPopulated(row.data, numRow, DiffColumn.After, afterTokens)
			};
		}

		if (row.type === DiffRowType.Deleted) {
			return {
				...row,
				data: getRowDataPopulated(row.data, numRow, DiffColumn.Before, beforeTokens)
			};
		}

		if (row.type === DiffRowType.Modified) {
			return {
				...row,
				beforeData: getRowDataPopulated(row.beforeData, numRow, DiffColumn.Before, beforeTokens),
				afterData: getRowDataPopulated(row.afterData, numRow, DiffColumn.After, afterTokens)
			};
		}

		if (row.type === DiffRowType.Context) {
			const lineTokens =
				getTokens(row.beforeLineNumber, beforeTokens) ??
				getTokens(row.afterLineNumber, afterTokens);

			const internalBeforeTokens = [...row.beforeTokens];
			const internalAfterTokens = [...row.afterTokens];

			if (lineTokens !== null) {
				internalBeforeTokens.push(lineTokens);
				internalAfterTokens.push(lineTokens);
			}

			// const beforeSearchTokens = this.getSearchTokens(numRow, DiffColumn.Before)
			// if (beforeSearchTokens !== undefined) {
			//   beforeSearchTokens.forEach(x => internalBeforeTokens.push(x))
			// }

			// const afterSearchTokens = this.getSearchTokens(numRow, DiffColumn.After)
			// if (afterSearchTokens !== undefined) {
			//   afterSearchTokens.forEach(x => internalAfterTokens.push(x))
			// }

			return { ...row, beforeTokens: internalBeforeTokens, afterTokens: internalAfterTokens };
		}

		return row;
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

	// const getSelectableGroupSelectionState = (
	// 	hunks: ReadonlyArray<DiffHunk>,
	// 	hunkStartLine: number
	// ): DiffSelectionType => {
	// 	const selection = getSelection();
	// 	if (selection === undefined) {
	// 		return DiffSelectionType.None;
	// 	}

	// 	const range = findInteractiveOriginalDiffRange(hunks, hunkStartLine);
	// 	if (range === null) {
	// 		//Shouldn't happen, but if it does, we can't do anything with it
	// 		return DiffSelectionType.None;
	// 	}

	// 	const { from, to } = range;

	// 	return selection.isRangeSelected(from, to - from + 1);
	// };

	// const getRowSelectableGroupHeight = (from: number, to: number) => {
	// 	const start = from > renderedStartIndex ? from : renderedStartIndex;

	// 	const stop =
	// 		renderedStopIndex !== undefined && to > renderedStopIndex + 10 ? renderedStopIndex + 10 : to;

	// 	let height = 0;
	// 	for (let i = start; i <= stop; i++) {
	// 		height += getRowHeight({ index: i });
	// 	}

	// 	return height;
	// };

	// const getRowSelectableGroupStaticData = (
	// 	hunkStartLine: number,
	// 	rows: ReadonlyArray<SimplifiedDiffRow>
	// ): IRowSelectableGroupStaticData => {
	// 	const cachedStaticData = rowSelectableGroupStaticDataCache.get(hunkStartLine);
	// 	if (cachedStaticData !== undefined) {
	// 		return cachedStaticData;
	// 	}

	// 	const { diffRowStartIndex, diffRowStopIndex } = getSelectableGroupRowIndexRange(
	// 		hunkStartLine,
	// 		rows
	// 	);

	// 	const lineNumbers = new Set<number>();
	// 	let hasAfter = false;
	// 	let hasBefore = false;

	// 	const groupRows = rows.slice(diffRowStartIndex, diffRowStopIndex + 1);

	// 	const lineNumbersIdentifiers: Array<CheckBoxIdentifier> = [];

	// 	for (const r of groupRows) {
	// 		if (r.type === DiffRowType.Added) {
	// 			lineNumbers.add(r.data.lineNumber);
	// 			hasAfter = true;
	// 			lineNumbersIdentifiers.push(`${r.data.lineNumber}-after`);
	// 		}

	// 		if (r.type === DiffRowType.Deleted) {
	// 			lineNumbers.add(r.data.lineNumber);
	// 			hasBefore = true;
	// 			lineNumbersIdentifiers.push(`${r.data.lineNumber}-before`);
	// 		}

	// 		if (r.type === DiffRowType.Modified) {
	// 			hasAfter = true;
	// 			hasBefore = true;
	// 			lineNumbers.add(r.beforeData.lineNumber);
	// 			lineNumbers.add(r.afterData.lineNumber);
	// 			lineNumbersIdentifiers.push(
	// 				`${r.beforeData.lineNumber}-before`,
	// 				`${r.afterData.lineNumber}-after`
	// 			);
	// 		}
	// 	}

	// 	const diffType =
	// 		hasAfter && hasBefore
	// 			? DiffRowType.Modified
	// 			: hasAfter
	// 				? DiffRowType.Added
	// 				: DiffRowType.Deleted;

	// 	const data: IRowSelectableGroupStaticData = {
	// 		diffRowStartIndex,
	// 		diffRowStopIndex,
	// 		diffType,
	// 		lineNumbers: Array.from(lineNumbers).sort(),
	// 		lineNumbersIdentifiers
	// 	};

	// 	rowSelectableGroupStaticDataCache.set(hunkStartLine, data);
	// 	return data;
	// };

	// /**
	//  * Gathers information about if the row is in a selectable group. This
	//  * information is used to facilitate the use of check all feature for the
	//  * selectable group.
	//  *
	//  * This will return null if the row is not in a selectable group. A group is
	//  * more than one row.
	//  */
	// const getRowSelectableGroupDetails = (rowIndex: number): IRowSelectableGroup | null => {
	// 	const thisRows = getDiffRows(diff, showSideBySideDiff, canExpandDiff());
	// 	const row = thisRows[rowIndex];

	// 	if (row === undefined || !isRowChanged(row)) {
	// 		return null;
	// 	}

	// 	const { hunkStartLine } = row;
	// 	const staticData = getRowSelectableGroupStaticData(hunkStartLine, thisRows);
	// 	const { diffRowStartIndex, diffRowStopIndex } = staticData;

	// 	const isFirst = diffRowStartIndex === rowIndex;
	// 	const isCheckAllRenderedInRow =
	// 		isFirst || (diffRowStartIndex < renderedStartIndex && rowIndex === renderedStartIndex);

	// 	return {
	// 		isFirst,
	// 		isCheckAllRenderedInRow,
	// 		isHovered: hoveredHunk === hunkStartLine,
	// 		selectionState: getSelectableGroupSelectionState(diff.hunks, hunkStartLine),
	// 		height: getRowSelectableGroupHeight(diffRowStartIndex, diffRowStopIndex),
	// 		staticData
	// 	};
	// };

	const getLineNumbersContainerID = (column: DiffColumn) => {
		return `line-numbers-${numRow}-${column}`;
	};

	// const rows = getDiffRows(diff, showSideBySideDiff, canExpandDiff());
	// console.log('🚀 ~ rows:', rows);

	// // const row = rows[index];
	// // if (row === undefined) {
	// //   return null
	// // }

	// const prev = rows[index - 1];
	// console.log('🚀 ~ prev:', prev);
	// const next = rows[index + 1];
	// console.log('🚀 ~ next:', next);
	const rowWithTokens = createFullRow(row, index);

	const beforeClassNames = getFirstAndLastClassesSideBySide(
		rowWithTokens,
		prevRow,
		nextRow,
		DiffRowType.Deleted
	);
	const afterClassNames = getFirstAndLastClassesSideBySide(
		rowWithTokens,
		prevRow,
		nextRow,
		DiffRowType.Added
	);

	const lineNumberWidth = getLineWidthFromDigitCount(getNumberOfDigits(diff.maxLineNumber));

	const rowSelectableGroupDetails = getRowSelectableGroupDetails(index);

	const baseRowClasses = cn('row', {
		'has-check-all-control': showDiffCheckMarks && isDiffSelectable
	});
	const beforeClasses = cn('before', ...beforeClassNames);
	const afterClasses = cn('after', ...afterClassNames);
</script>

<div {style} role="row" aria-rowindex={index}>
	{#if rowWithTokens.type === DiffRowType.Hunk}
		<div
			class={cn('hunk-info', baseRowClasses, {
				'expandable-both': rowWithTokens.expansionType === DiffHunkExpansionType.Both
			})}
		>
			<HunkHeaderGutter
				{onExpandHunk}
				lineGutterWidth={getLineGutterWidth()}
				hunkIndex={rowWithTokens.hunkIndex}
				expansionType={rowWithTokens.expansionType}
			/>
			<ContentFromString content={rowWithTokens.content} />
		</div>
	{:else if rowWithTokens.type === DiffRowType.Context}
		<div class={cn('context', baseRowClasses)}>
			{#if !showSideBySideDiff}
				<div class="before">
					<LineNumbers
						lineNumbers={[rowWithTokens.beforeLineNumber, rowWithTokens.afterLineNumber]}
						column={DiffColumn.Before}
						{isDiffSelectable}
						rowSelectableGroup={rowSelectableGroupDetails}
						{getLineNumbersContainerID}
						lineGutterWidth={getLineGutterWidth()}
					/>
					<ContentFromString content={rowWithTokens.content} tokens={rowWithTokens.beforeTokens} />
				</div>
			{:else}
				side by side
				<!-- <div className="before">
				{this.renderLineNumber(beforeLineNumber, DiffColumn.Before)}
				{this.renderContentFromString(row.content, row.beforeTokens)}
			</div>
			<div className="after">
				{this.renderLineNumber(afterLineNumber, DiffColumn.After)}
				{this.renderContentFromString(row.content, row.afterTokens)}
			</div> -->
			{/if}
		</div>
	{:else if rowWithTokens.type === DiffRowType.Added}
		<div class={cn('added', baseRowClasses)}>
			{#if !showSideBySideDiff}
				<!-- <HunkHandle rowSelectableGroup={rowSelectableGroupDetails} /> -->
				<div class={afterClasses}>
					<LineNumbers
						lineNumbers={[undefined, rowWithTokens.data.lineNumber]}
						column={DiffColumn.After}
						rowSelectableGroup={rowSelectableGroupDetails}
						{getLineNumbersContainerID}
						lineGutterWidth={getLineGutterWidth()}
						isSelected={rowWithTokens.data.isSelected}
					/>
					<Content data={rowWithTokens.data} prefix={DiffRowPrefix.Added} />
					<!-- {this.renderWhitespaceHintPopover(DiffColumn.After)} -->
				</div>
			{:else}
				side by side
			{/if}
		</div>
	{:else if rowWithTokens.type === DiffRowType.Deleted}
		<div class={cn('deleted', baseRowClasses)}>
			{#if !showSideBySideDiff}
				<!-- <HunkHandle /> -->
				<div class={beforeClasses}>
					<LineNumbers
						lineNumbers={[rowWithTokens.data.lineNumber, undefined]}
						column={DiffColumn.Before}
						rowSelectableGroup={rowSelectableGroupDetails}
						{getLineNumbersContainerID}
						lineGutterWidth={getLineGutterWidth()}
						isSelected={rowWithTokens.data.isSelected}
					/>
					<Content data={rowWithTokens.data} prefix={DiffRowPrefix.Deleted} />
					<!-- {this.renderWhitespaceHintPopover(DiffColumn.Before)} -->
				</div>
			{:else}
				side by side
			{/if}
		</div>
	{:else if rowWithTokens.type === DiffRowType.Modified}
		<div class={cn('modified', baseRowClasses)}>
			<div class={beforeClasses}>
				<LineNumbers
					lineNumbers={[rowWithTokens.beforeData.lineNumber]}
					column={DiffColumn.Before}
					rowSelectableGroup={rowSelectableGroupDetails}
					{getLineNumbersContainerID}
					lineGutterWidth={getLineGutterWidth()}
					isSelected={rowWithTokens.beforeData.isSelected}
				/>
				<Content data={rowWithTokens.beforeData} prefix={DiffRowPrefix.Deleted} />
				<!-- {this.renderWhitespaceHintPopover(DiffColumn.Before)} -->
			</div>
			<!-- <HunkHandle /> -->
			<div class={afterClasses}>
				<LineNumbers
					lineNumbers={[rowWithTokens.afterData.lineNumber]}
					column={DiffColumn.After}
					rowSelectableGroup={rowSelectableGroupDetails}
					{getLineNumbersContainerID}
					lineGutterWidth={getLineGutterWidth()}
					isSelected={rowWithTokens.afterData.isSelected}
				/>
				<Content data={rowWithTokens.afterData} prefix={DiffRowPrefix.Added} />
				<!-- {this.renderWhitespaceHintPopover(DiffColumn.After)} -->
			</div>
		</div>
	{/if}
</div>
