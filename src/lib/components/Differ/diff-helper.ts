import { assertNever, assertNonNullable, forceUnwrap } from '$lib/fatal-error';
import {
	DiffHunk,
	DiffHunkExpansionType,
	DiffLine,
	DiffLineType,
	DiffSelectionType
} from '$lib/models/diff';
import { WorkingDirectoryFileChange, type ChangedFile } from '$lib/models/status';
import { relativeChanges } from './changed-range';
import type { IRowSelectableGroupStaticData } from './side-by-side-diff-row';
import type { ILineTokens } from './types';
import { DiffSyntaxToken } from './diff-syntax-mode';

/**
 * DiffRowType defines the different types of
 * rows that a diff visualization can have.
 *
 * It contains similar values than DiffLineType
 * with the addition of `Modified`, which
 * corresponds to a line that has both deleted and
 * added content.
 */
export enum DiffRowType {
	Context = 'Context',
	Hunk = 'Hunk',
	Added = 'Added',
	Deleted = 'Deleted',
	Modified = 'Modified'
}

export enum DiffColumn {
	Before = 'before',
	After = 'after'
}

export type SimplifiedDiffRowData = Omit<IDiffRowData, 'isSelected'>;

export interface IDiffRowData {
	/**
	 * The actual contents of the diff line.
	 */
	readonly content: string;

	/**
	 * The line number on the source file.
	 */
	readonly lineNumber: number;

	/**
	 * The line number on the original diff (without expansion).
	 * This is used for discarding lines and for partial committing lines.
	 */
	readonly diffLineNumber: number | null;

	/**
	 * Flag to display that this diff line lacks a new line.
	 * This is used to display when a newline is
	 * added or removed to the last line of a file.
	 */
	readonly noNewLineIndicator: boolean;

	/**
	 * Whether the diff line has been selected for partial committing.
	 */
	readonly isSelected: boolean;

	/**
	 * Array of tokens to do syntax highlighting on the diff line.
	 */
	readonly tokens: ReadonlyArray<ILineTokens>;
}

/**
 * IDiffRowAdded represents a row that displays an added line.
 */
interface IDiffRowAdded<T = IDiffRowData> {
	readonly type: DiffRowType.Added;

	/**
	 * The data object contains information about that added line in the diff.
	 */
	readonly data: T;

	/**
	 * The start line of the hunk where this line belongs in the diff.
	 *
	 * In this context, a hunk is not exactly equivalent to a diff hunk, but
	 * instead marks a group of consecutive added/deleted lines (see hoveredHunk
	 * comment in the `<SideBySide />` component).
	 */
	readonly hunkStartLine: number;
}

/**
 * IDiffRowDeleted represents a row that displays a deleted line.
 */
interface IDiffRowDeleted<T = IDiffRowData> {
	readonly type: DiffRowType.Deleted;

	/**
	 * The data object contains information about that deleted line in the diff.
	 */
	readonly data: T;

	/**
	 * The start line of the hunk where this line belongs in the diff.
	 *
	 * In this context, a hunk is not exactly equivalent to a diff hunk, but
	 * instead marks a group of consecutive added/deleted lines (see hoveredHunk
	 * comment in the `<SideBySide />` component).
	 */
	readonly hunkStartLine: number;
}

/**
 * IDiffRowModified represents a row that displays both a deleted line inline
 * with an added line.
 */
interface IDiffRowModified<T = IDiffRowData> {
	readonly type: DiffRowType.Modified;

	/**
	 * The beforeData object contains information about the deleted line in the diff.
	 */
	readonly beforeData: T;

	/**
	 * The beforeData object contains information about the added line in the diff.
	 */
	readonly afterData: T;

	/**
	 * The start line of the hunk where this line belongs in the diff.
	 *
	 * In this context, a hunk is not exactly equivalent to a diff hunk, but
	 * instead marks a group of consecutive added/deleted lines (see hoveredHunk
	 * comment in the `<SideBySide />` component).
	 */
	readonly hunkStartLine: number;
}

/**
 * IDiffRowContext represents a row that contains non-modified
 * contextual lines around additions/deletions in a diff.
 */
interface IDiffRowContext {
	readonly type: DiffRowType.Context;

	/**
	 * The actual contents of the contextual line.
	 */
	readonly content: string;

	/**
	 * The line number of this row in the previous state source file.
	 */
	readonly beforeLineNumber: number;

	/**
	 * The line number of this row in the next state source file.
	 */
	readonly afterLineNumber: number;

	/**
	 * Tokens to use to syntax highlight the contents of the before version of the line.
	 */
	readonly beforeTokens: ReadonlyArray<ILineTokens>;

	/**
	 * Tokens to use to syntax highlight the contents of the after version of the line.
	 */
	readonly afterTokens: ReadonlyArray<ILineTokens>;
}

/**
 * IDiffRowContext represents a row that contains the header
 * of a diff hunk.
 */
interface IDiffRowHunk {
	readonly type: DiffRowType.Hunk;
	/**
	 * The actual contents of the line.
	 */
	readonly content: string;

	/** How the hunk can be expanded. */
	readonly expansionType: DiffHunkExpansionType;

	/** Index of the hunk in the diff. */
	readonly hunkIndex: number;
}

export type DiffRow =
	| IDiffRowAdded
	| IDiffRowDeleted
	| IDiffRowModified
	| IDiffRowContext
	| IDiffRowHunk;

export type SimplifiedDiffRow =
	| IDiffRowAdded<SimplifiedDiffRowData>
	| IDiffRowDeleted<SimplifiedDiffRowData>
	| IDiffRowModified<SimplifiedDiffRowData>
	| IDiffRowContext
	| IDiffRowHunk;

type ModifiedLine = { line: DiffLine; diffLineNumber: number };

/**
 * This interface is used to pass information about a continuous group of
 * selectable rows to the row component as it pertains to a given row.
 *
 * Primarily used for the styling of the row and it's check all control.
 */
export interface IRowSelectableGroup {
	/**
	 * Whether or not the row is the first in the selectable group
	 */
	isFirst: boolean;

	/**
	 * Whether or not the group is hovered by the mouse
	 */
	isHovered: boolean;

	/**
	 * Whether or not the check all handle is rendered in this row
	 */
	isCheckAllRenderedInRow: boolean;

	/**
	 * The selection state of the group - 'All', 'Partial', or 'None'
	 */
	selectionState: DiffSelectionType;

	/**
	 * The height of the number of rendered rows in the group
	 *
	 * Usually, this is the height of all the rows in the group, but if the group
	 * is partially scrolled out of view, it will be the height of the rendered
	 * row. The diff is a virtualized list, so a row may be rendered but out of
	 * view.
	 */
	height: number;

	/**
	 * The data that does not change on render
	 */
	staticData: IRowSelectableGroupStaticData;
}

/**
 * The longest line for which we'd try to calculate a line diff, this matches
 * GitHub.com's behavior.
 **/
export const MaxIntraLineDiffStringLength = 1024;

/**
 * Returns an array of rows with the needed data to render a side-by-side diff
 * with them.
 *
 * In some situations it will merge a deleted an added row into a single
 * modified row, in order to display them side by side (This happens when there
 * are consecutive added and deleted rows).
 *
 * @param hunk                The hunk to use to extract the rows data
 * @param showSideBySideDiff  Whether or not show the diff in side by side mode.
 */
export function getDiffRowsFromHunk(
	hunkIndex: number,
	hunk: DiffHunk,
	showSideBySideDiff: boolean,
	enableDiffExpansion: boolean
): ReadonlyArray<SimplifiedDiffRow> {
	const rows = new Array<SimplifiedDiffRow>();

	/**
	 * Array containing multiple consecutive added/deleted lines. This
	 * is used to be able to merge them into modified rows.
	 */
	let modifiedLines = new Array<ModifiedLine>();

	for (const [num, line] of hunk.lines.entries()) {
		const diffLineNumber = hunk.unifiedDiffStart + num;

		if (line.type === DiffLineType.Delete || line.type === DiffLineType.Add) {
			modifiedLines.push({ line, diffLineNumber });
			continue;
		}

		if (modifiedLines.length > 0) {
			// If the current line is not added/deleted and we have any added/deleted
			// line stored, we need to process them.
			for (const row of getModifiedRows(modifiedLines, showSideBySideDiff)) {
				rows.push(row);
			}
			modifiedLines = [];
		}

		if (line.type === DiffLineType.Hunk) {
			rows.push({
				type: DiffRowType.Hunk,
				content: line.text,
				expansionType: enableDiffExpansion ? hunk.expansionType : DiffHunkExpansionType.None,
				hunkIndex
			});
			continue;
		}

		if (line.type === DiffLineType.Context) {
			assertNonNullable(line.oldLineNumber, `No oldLineNumber for ${diffLineNumber}`);
			assertNonNullable(line.newLineNumber, `No newLineNumber for ${diffLineNumber}`);

			rows.push({
				type: DiffRowType.Context,
				content: line.content,
				beforeLineNumber: line.oldLineNumber,
				afterLineNumber: line.newLineNumber,
				beforeTokens: [],
				afterTokens: []
			});
			continue;
		}

		assertNever(line.type, `Invalid line type: ${line.type}`);
	}

	// Do one more pass to process the remaining list of modified lines.
	if (modifiedLines.length > 0) {
		for (const row of getModifiedRows(modifiedLines, showSideBySideDiff)) {
			rows.push(row);
		}
	}

	return rows;
}

function getModifiedRows(
	addedOrDeletedLines: ReadonlyArray<ModifiedLine>,
	showSideBySideDiff: boolean
): ReadonlyArray<SimplifiedDiffRow> {
	if (addedOrDeletedLines.length === 0) {
		return [];
	}
	const hunkStartLine = addedOrDeletedLines[0].diffLineNumber;
	const addedLines = new Array<ModifiedLine>();
	const deletedLines = new Array<ModifiedLine>();

	for (const line of addedOrDeletedLines) {
		if (line.line.type === DiffLineType.Add) {
			addedLines.push(line);
		} else if (line.line.type === DiffLineType.Delete) {
			deletedLines.push(line);
		}
	}

	const output = new Array<SimplifiedDiffRow>();

	const diffTokensBefore = new Array<ILineTokens | undefined>();
	const diffTokensAfter = new Array<ILineTokens | undefined>();

	// To match the behavior of github.com, we only highlight differences between
	// lines on hunks that have the same number of added and deleted lines.
	const shouldDisplayDiffInChunk = addedLines.length === deletedLines.length;

	if (shouldDisplayDiffInChunk) {
		for (let i = 0; i < deletedLines.length; i++) {
			const addedLine = addedLines[i];
			const deletedLine = deletedLines[i];

			if (
				addedLine.line.content.length < MaxIntraLineDiffStringLength &&
				deletedLine.line.content.length < MaxIntraLineDiffStringLength
			) {
				const { before, after } = getDiffTokens(deletedLine.line.content, addedLine.line.content);
				diffTokensBefore[i] = before;
				diffTokensAfter[i] = after;
			}
		}
	}

	let indexModifiedRow = 0;

	while (
		showSideBySideDiff &&
		indexModifiedRow < addedLines.length &&
		indexModifiedRow < deletedLines.length
	) {
		const addedLine = forceUnwrap('Unexpected null line', addedLines[indexModifiedRow]);
		const deletedLine = forceUnwrap('Unexpected null line', deletedLines[indexModifiedRow]);

		// Modified lines
		output.push({
			type: DiffRowType.Modified,
			beforeData: getDataFromLine(deletedLine, 'oldLineNumber', diffTokensBefore.shift()),
			afterData: getDataFromLine(addedLine, 'newLineNumber', diffTokensAfter.shift()),
			hunkStartLine
		});

		indexModifiedRow++;
	}

	for (let i = indexModifiedRow; i < deletedLines.length; i++) {
		const line = forceUnwrap('Unexpected null line', deletedLines[i]);

		output.push({
			type: DiffRowType.Deleted,
			data: getDataFromLine(line, 'oldLineNumber', diffTokensBefore.shift()),
			hunkStartLine
		});
	}

	for (let i = indexModifiedRow; i < addedLines.length; i++) {
		const line = forceUnwrap('Unexpected null line', addedLines[i]);

		// Added line
		output.push({
			type: DiffRowType.Added,
			data: getDataFromLine(line, 'newLineNumber', diffTokensAfter.shift()),
			hunkStartLine
		});
	}

	return output;
}

/**
 * Returns an object with two ILineTokens objects that can be used to highlight
 * the added and removed characters between two lines.
 *
 * The `before` object contains the tokens to be used against the `lineBefore` string
 * while the `after` object contains the tokens to use with the `lineAfter` string.
 *
 * This method can be used in conjunction with the `syntaxHighlightLine()` method to
 * get the difference between two lines highlighted:
 *
 * syntaxHighlightLine(
 *   lineBefore,
 *   getDiffTokens(lineBefore, lineAfter).before
 * )
 *
 * @param lineBefore    The first version of the line to compare.
 * @param lineAfter     The second version of the line to compare.
 */
export function getDiffTokens(
	lineBefore: string,
	lineAfter: string
): { before: ILineTokens; after: ILineTokens } {
	const changeRanges = relativeChanges(lineBefore, lineAfter);

	return {
		before: {
			[changeRanges.stringARange.location]: {
				token: 'diff-delete-inner',
				length: changeRanges.stringARange.length
			}
		},
		after: {
			[changeRanges.stringBRange.location]: {
				token: 'diff-add-inner',
				length: changeRanges.stringBRange.length
			}
		}
	};
}

function getDataFromLine(
	{ line, diffLineNumber }: { line: DiffLine; diffLineNumber: number },
	lineToUse: 'oldLineNumber' | 'newLineNumber',
	diffTokens: ILineTokens | undefined
): SimplifiedDiffRowData {
	const lineNumber = forceUnwrap(`Expecting ${lineToUse} value for ${line}`, line[lineToUse]);

	const tokens = new Array<ILineTokens>();

	if (diffTokens !== undefined) {
		tokens.push(diffTokens);
	}

	return {
		content: line.content,
		lineNumber,
		diffLineNumber: line.originalLineNumber,
		noNewLineIndicator: line.noTrailingNewLine,
		tokens
	};
}

/** Utility function for checking whether a file supports selection */
export function canSelect(file: ChangedFile): file is WorkingDirectoryFileChange {
	return file instanceof WorkingDirectoryFileChange;
}

/**
 * Used to obtain classes applied to style the row as first or last of a group
 * of added or deleted rows in the side-by-side diff.
 **/
export function getFirstAndLastClassesSideBySide(
	row: SimplifiedDiffRow,
	previousRow: SimplifiedDiffRow | undefined,
	nextRow: SimplifiedDiffRow | undefined,
	addedOrDeleted: DiffRowType.Added | DiffRowType.Deleted
): ReadonlyArray<string> {
	const classes = new Array<string>();
	const typesToCheck = [addedOrDeleted, DiffRowType.Modified];

	// Is the row of the type we are checking? No. Then can't be first or last.
	if (!typesToCheck.includes(row.type)) {
		return [];
	}

	// Is the previous row exist or is of the type we are checking?
	// No. Then this row must be the first of this type.
	if (previousRow === undefined || !typesToCheck.includes(previousRow.type)) {
		classes.push('is-first');
	}

	// Is the next row exist or is of the type we are checking?
	// No. Then this row must be last of this type.
	if (nextRow === undefined || !typesToCheck.includes(nextRow.type)) {
		classes.push('is-last');
	}

	return classes;
}

/**
 * Used to obtain classes applied to style the row if it is the first or last of
 * a group of added, deleted, or modified rows in the unified diff.
 **/
export function getFirstAndLastClassesUnified(
	token: DiffSyntaxToken,
	prevToken: DiffSyntaxToken | undefined,
	nextToken: DiffSyntaxToken | undefined
): string[] {
	const addedOrDeletedTokens = [DiffSyntaxToken.Add, DiffSyntaxToken.Delete];
	if (!addedOrDeletedTokens.includes(token)) {
		return [];
	}

	const classNames = [];

	if (prevToken !== token) {
		classNames.push('is-first');
	}

	if (nextToken !== token) {
		classNames.push('is-last');
	}

	return classNames;
}

/** Gets the width in pixels of the diff line number gutter based on the number of digits in the number */
export function getLineWidthFromDigitCount(digitAmount: number): number {
	return Math.max(digitAmount, 3) * 10 + 5;
}

/**
 * Whether the row is a type that represent a change (added, deleted, modified)
 * in the diff. This is useful for checking to see if a row type would have
 * something like 'hunkStartLine` on it.
 */
export function isRowChanged(
	row: DiffRow | SimplifiedDiffRow
): row is IDiffRowAdded | IDiffRowDeleted | IDiffRowModified {
	return (
		row.type === DiffRowType.Added ||
		row.type === DiffRowType.Deleted ||
		row.type === DiffRowType.Modified
	);
}

/**
 * Compares two maps for key reference equality.
 *
 * Two maps are considered equal if all their keys coincide, if they're
 * both empty or if they're the same object.
 */
export function mapKeysEqual<T>(x: Map<T, unknown>, y: Map<T, unknown>) {
	if (x === y) {
		return true;
	}

	if (x.size !== y.size) {
		return false;
	}

	for (const key of x.keys()) {
		if (!y.has(key)) {
			return false;
		}
	}

	return true;
}

/**
 * Returns an JSX element with syntax highlighting of the passed line using both
 * the syntaxTokens and diffTokens.
 *
 * @param line          The line to syntax highlight.
 * @param tokensArray   An array of ILineTokens objects that is used for syntax highlighting.
 */
export function syntaxHighlightLine(line: string, tokensArray: ReadonlyArray<ILineTokens>) {
	const elements = [];
	let currentElement = {
		content: '',
		tokens: new Map<string, number>()
	};

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const newTokens = new Map<string, number>();

		for (const [token, endPosition] of currentElement.tokens) {
			if (endPosition > i) {
				newTokens.set(token, endPosition);
			}
		}

		for (const tokens of tokensArray) {
			if (tokens[i] !== undefined && tokens[i].length > 0) {
				// ILineTokens can contain multiple tokens separated by spaces.
				// We split them to avoid creating unneeded HTML elements when
				// these tokens do not maintain the same order.
				const tokenNames = tokens[i].token.split(' ');
				const position = i + tokens[i].length;

				for (const name of tokenNames) {
					const existingTokenPosition = newTokens.get(name);

					// While it's rare, it's theoretically possible that the same
					// token exists for the same start position with different end
					// positions. If this happens, we choose the longest one.
					if (existingTokenPosition === undefined || position > existingTokenPosition) {
						newTokens.set(name, position);
					}
				}
			}
		}

		// If the calculated tokens for the character
		// are the same as the ones for the current element,
		// we can just append the character on that element contents.
		// Otherwise, we need to create a new element with the tokens
		// and "archive" the current element.
		if (mapKeysEqual(currentElement.tokens, newTokens)) {
			currentElement.content += char;
			currentElement.tokens = newTokens;
		} else {
			elements.push({
				tokens: currentElement.tokens,
				content: currentElement.content
			});

			currentElement = {
				content: char,
				tokens: newTokens
			};
		}
	}

	// Add the remaining current element to the list of elements.
	elements.push({
		tokens: currentElement.tokens,
		content: currentElement.content
	});

	return elements;

	// return (
	//   <>
	//     {elements.map((element, i) => {
	//       if (element.tokens.size === 0) {
	//         // If the element does not contain any token
	//         // we can skip creating a span.
	//         return element.content
	//       }
	//       return (
	//         <span
	//           key={i}
	//           className={classNames(
	//             [...element.tokens.keys()].map(name => `cm-${name}`)
	//           )}
	//         >
	//           {element.content}
	//         </span>
	//       )
	//     })}
	//   </>
	// )
}
