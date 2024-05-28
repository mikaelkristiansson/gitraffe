import { getOldPathOrDefault } from '$lib/git/get-old-path';
import type { Repository } from '$lib/models/repository';
import {
	AppFileStatusKind,
	CommittedFileChange,
	WorkingDirectoryFileChange
} from '$lib/models/status';
import { basename, extname, join } from '@tauri-apps/api/path';
import { assertNever } from '../../../lib/fatal-error';
import type { ITokens } from './types';
import { readTextFile } from '@tauri-apps/api/fs';
import { invoke } from '@tauri-apps/api/tauri';
import { DiffLineType, type DiffHunk, type DiffLine } from '$lib/models/diff';
import { getPartialBlobContents } from '$lib/git/show';
import { DiffSyntaxToken } from './diff-syntax-mode';
import { highlight } from './internal-highlight';
// import { highlight } from './worker';

/** The maximum number of bytes we'll process for highlighting. */
const MaxHighlightContentLength = 256 * 1024;

// There is no good way to get the actual length of the old/new contents,
// since we're directly truncating the git output to up to MaxHighlightContentLength
// characters. Therefore, when we try to limit diff expansion, we can't know if
// a file is exactly MaxHighlightContentLength characters long or longer, so
// we'll look for exactly that amount of characters minus 1.
const MaxDiffExpansionNewContentLength = MaxHighlightContentLength - 1;

type ChangedFile = WorkingDirectoryFileChange | CommittedFileChange;

interface ILineFilters {
	readonly oldLineFilter: Array<number>;
	readonly newLineFilter: Array<number>;
}

export interface IFileContents {
	readonly file: ChangedFile;
	readonly oldContents: ReadonlyArray<string>;
	readonly newContents: ReadonlyArray<string>;
	readonly canBeExpanded: boolean;
}

interface IFileTokens {
	readonly oldTokens: ITokens;
	readonly newTokens: ITokens;
}

function generateUUID() {
	// Public Domain/MIT
	var d = new Date().getTime(); //Timestamp
	var d2 = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0; //Time in microseconds since page-load or 0 if unsupported
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = Math.random() * 16; //random number between 0 and 16
		if (d > 0) {
			//Use timestamp until depleted
			r = (d + r) % 16 | 0;
			d = Math.floor(d / 16);
		} else {
			//Use microseconds since page-load if supported
			r = (d2 + r) % 16 | 0;
			d2 = Math.floor(d2 / 16);
		}
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
}

// This is a custom version of the no-newline octicon that's exactly as
// tall as it needs to be (8px) which helps with aligning it on the line.
export const narrowNoNewlineSymbol = {
	w: 16,
	h: 8,
	p: [
		'm 16,1 0,3 c 0,0.55 -0.45,1 -1,1 l -3,0 0,2 -3,-3 3,-3 0,2 2,0 0,-2 2,0 z M 8,4 C 8,6.2 6.2,8 4,8 1.8,8 0,6.2 0,4 0,1.8 1.8,0 4,0 6.2,0 8,1.8 8,4 Z M 1.5,5.66 5.66,1.5 C 5.18,1.19 4.61,1 4,1 2.34,1 1,2.34 1,4 1,4.61 1.19,5.17 1.5,5.66 Z M 7,4 C 7,3.39 6.81,2.83 6.5,2.34 L 2.34,6.5 C 2.82,6.81 3.39,7 4,7 5.66,7 7,5.66 7,4 Z'
	]
};

export function createNoNewlineIndicatorWidget() {
	const widget = document.createElement('span');
	const titleId = generateUUID();

	const { w, h, p } = narrowNoNewlineSymbol;

	const xmlns = 'http://www.w3.org/2000/svg';
	const svgElem = document.createElementNS(xmlns, 'svg');
	svgElem.setAttribute('version', '1.1');
	svgElem.setAttribute('viewBox', `0 0 ${w} ${h}`);
	svgElem.setAttribute('role', 'img');
	svgElem.setAttribute('aria-labelledby', titleId);
	svgElem.classList.add('no-newline');

	const titleElem = document.createElementNS(xmlns, 'title');
	titleElem.setAttribute('id', titleId);
	titleElem.setAttribute('lang', 'en');
	titleElem.textContent = 'No newline at end of file';
	svgElem.appendChild(titleElem);

	const pathElem = document.createElementNS(xmlns, 'path');
	pathElem.setAttribute('role', 'presentation');
	pathElem.setAttribute('d', p[0]);
	pathElem.textContent = 'No newline at end of file';
	svgElem.appendChild(pathElem);

	widget.appendChild(svgElem);
	return widget;
}

export function getNumberOfDigits(val: number): number {
	return (Math.log(val) * Math.LOG10E + 1) | 0;
}

/** Gets the width in pixels of the diff line number gutter based on the number of digits in the number */
export function getLineWidthFromDigitCount(digitAmount: number): number {
	return Math.max(digitAmount, 3) * 10 + 5;
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

async function getOldFileContent(
	repository: Repository,
	file: ChangedFile
): Promise<string | null> {
	if (
		file.status.kind === AppFileStatusKind.New ||
		file.status.kind === AppFileStatusKind.Untracked
	) {
		return null;
	}

	let commitish;

	if (file instanceof WorkingDirectoryFileChange) {
		// If we pass an empty string here we get the contents
		// that are in the index. But since we call diff with
		// --no-index (see diff.ts) we need to look at what's
		// actually committed to get the appropriate content.
		commitish = 'HEAD';
	} else if (file instanceof CommittedFileChange) {
		commitish = file.parentCommitish;
	} else {
		return assertNever(file, 'Unknown file change type');
	}

	return getPartialBlobContents(
		repository,
		commitish,
		getOldPathOrDefault(file),
		MaxHighlightContentLength
	);
}

async function getNewFileContent(
	repository: Repository,
	file: ChangedFile
): Promise<string | null> {
	if (file.status.kind === AppFileStatusKind.Deleted) {
		return null;
	}

	if (file instanceof WorkingDirectoryFileChange) {
		const filePath = await join(repository.path, file.path);
		await invoke('expand_scope', { folderPath: filePath });
		const readFile = await readTextFile(filePath);
		return readFile;
		// return readPartialFile(
		//   Path.join(repository.path, file.path),
		//   0,
		//   MaxHighlightContentLength - 1
		// )
	} else if (file instanceof CommittedFileChange) {
		return getPartialBlobContents(repository, file.commitish, file.path, MaxHighlightContentLength);
	}

	return assertNever(file, 'Unknown file change type');
}

export async function getFileContents(repo: Repository, file: ChangedFile): Promise<IFileContents> {
	const [oldContents, newContents] = await Promise.all([
		getOldFileContent(repo, file).catch((e) => {
			console.error('Could not load old contents for syntax highlighting', e);
			return null;
		}),
		getNewFileContent(repo, file).catch((e) => {
			console.error('Could not load new contents for syntax highlighting', e);
			return null;
		})
	]);

	return {
		file,
		oldContents: oldContents?.toString().split(/\r?\n/) ?? [],
		newContents: newContents?.toString().split(/\r?\n/) ?? [],
		canBeExpanded: newContents !== null && newContents.length <= MaxDiffExpansionNewContentLength
	};
}

/**
 * Figure out which lines we need to have tokenized in
 * both the old and new version of the file.
 */
export function getLineFilters(hunks: ReadonlyArray<DiffHunk>): ILineFilters {
	const oldLineFilter = new Array<number>();
	const newLineFilter = new Array<number>();

	const diffLines = new Array<DiffLine>();

	let anyAdded = false;
	let anyDeleted = false;

	for (const hunk of hunks) {
		for (const line of hunk.lines) {
			anyAdded = anyAdded || line.type === DiffLineType.Add;
			anyDeleted = anyDeleted || line.type === DiffLineType.Delete;
			diffLines.push(line);
		}
	}

	for (const line of diffLines) {
		// So this might need a little explaining. What we're trying
		// to achieve here is if the diff contains only additions or
		// only deletions we'll source all the highlighted lines from
		// either the before or after file. That way we can completely
		// disregard highlighting, the other version.
		if (line.oldLineNumber !== null && line.newLineNumber !== null) {
			if (anyAdded && !anyDeleted) {
				newLineFilter.push(line.newLineNumber - 1);
			} else {
				oldLineFilter.push(line.oldLineNumber - 1);
			}
		} else {
			// If there's a mix (meaning we'll have to read from both
			// anyway) we'll prioritize the old version since
			// that's immutable and less likely to be the subject of a
			// race condition when someone rapidly modifies the file on
			// disk.
			if (line.oldLineNumber !== null) {
				oldLineFilter.push(line.oldLineNumber - 1);
			} else if (line.newLineNumber !== null) {
				newLineFilter.push(line.newLineNumber - 1);
			}
		}
	}

	return { oldLineFilter, newLineFilter };
}

export async function highlightContents(
	contents: IFileContents,
	tabSize: number,
	lineFilters: ILineFilters
): Promise<IFileTokens> {
	const { file, oldContents, newContents } = contents;

	const oldPath = getOldPathOrDefault(file);
	const oldPathBaseName = await basename(oldPath);
	const oldPathExtName = await extname(oldPath);
	const newPathBaseName = await basename(file.path);
	const newPathExtName = await extname(file.path);

	const [oldTokens, newTokens] = await Promise.all([
		oldContents === null
			? {}
			: highlight(
					oldContents,
					oldPathBaseName,
					oldPathExtName,
					tabSize,
					lineFilters.oldLineFilter
				).catch((e) => {
					console.error('Highlighter worked failed for old contents', e);
					return {};
				}),
		newContents === null
			? {}
			: highlight(
					newContents,
					newPathBaseName,
					newPathExtName,
					tabSize,
					lineFilters.newLineFilter
				).catch((e) => {
					console.error('Highlighter worked failed for new contents', e);
					return {};
				})
	]);

	return { oldTokens, newTokens };
}
