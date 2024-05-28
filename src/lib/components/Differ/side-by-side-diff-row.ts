import type { ITextDiff } from '$lib/models/diff';
import { getDiffRowsFromHunk, type DiffRowType, type SimplifiedDiffRow } from './diff-helper';

enum DiffRowPrefix {
	Added = '+',
	Deleted = '-',
	Nothing = '\u{A0}'
}

export type CheckBoxIdentifier = `${number}-${'after' | 'before'}`;

export interface IRowSelectableGroupStaticData {
	/**
	 * The group's rows starting index.
	 *
	 * Note: Since the array of diff rows includes hunk
	 * headeres, this does not equate to the line numbers.
	 */
	diffRowStartIndex: number;

	/**
	 * The group's rows ending index.
	 *
	 * Note: Since the array of diff rows includes hunk
	 * headers, this does not equate to the line numbers.
	 */
	diffRowStopIndex: number;

	/** The group's diff type, all 'added',  all 'deleted', or a mix = 'modified */
	diffType: DiffRowType;

	/**
	 * The line numbers associated with the group
	 */
	lineNumbers: ReadonlyArray<number>;

	/**
	 * The line numbers identifiers associated with the group.
	 *
	 * If the line numbers are [4, 5, 6] then the lineNumbersIdentifiers could be
	 * something like [`4-before`, `4-after`, `5-after`, `6-after`] as the line
	 * number is not unique without the "before" or "after" suffix
	 */
	lineNumbersIdentifiers: ReadonlyArray<CheckBoxIdentifier>;
}

/**
 * Memoized function to calculate the actual rows to display side by side
 * as a diff.
 *
 * @param diff                The diff to use to calculate the rows.
 * @param showSideBySideDiff  Whether or not show the diff in side by side mode.
 */
export const getDiffRows = (
	diff: ITextDiff,
	showSideBySideDiff: boolean,
	enableDiffExpansion: boolean
): ReadonlyArray<SimplifiedDiffRow> => {
	const outputRows = new Array<SimplifiedDiffRow>();

	diff.hunks.forEach((hunk, index) => {
		for (const row of getDiffRowsFromHunk(index, hunk, showSideBySideDiff, enableDiffExpansion)) {
			outputRows.push(row);
		}
	});

	return outputRows;
};
