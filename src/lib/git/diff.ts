import {
	DiffType,
	Image,
	type IDiff,
	type IImageDiff,
	type IRawDiff,
	type LineEndingsChange
} from '$lib/models/diff';
import {
	AppFileStatusKind,
	FileChange,
	WorkingDirectoryFileChange,
	type SubmoduleStatus,
	CommittedFileChange,
	type ChangedFile
} from '$lib/models/status';
import { getCaptures } from '$lib/utils/regex';
import { extname, join } from '@tauri-apps/api/path';
import { getConfigValue } from './config';
import { forceUnwrap } from '$lib/fatal-error';
import { DiffParser } from './diff-parser';
import { readFile } from '@tauri-apps/plugin-fs';
import { getBlobContents } from './show';
import { getOldPathOrDefault } from './get-old-path';
import type { Repository } from '$lib/models/repository';
import type { GitResponse } from './type';
import { git } from './cli';

/**
 *  Defining the list of known extensions we can render inside the app
 */
const imageFileExtensions = new Set([
	'.png',
	'.jpg',
	'.jpeg',
	'.gif',
	'.ico',
	'.webp',
	'.bmp',
	'.avif'
]);

/**
 * Map a given file extension to the related data URL media type
 */
function getMediaType(extension: string) {
	if (extension === '.png') {
		return 'image/png';
	}
	if (extension === '.jpg' || extension === '.jpeg') {
		return 'image/jpg';
	}
	if (extension === '.gif') {
		return 'image/gif';
	}
	if (extension === '.ico') {
		return 'image/x-icon';
	}
	if (extension === '.webp') {
		return 'image/webp';
	}
	if (extension === '.bmp') {
		return 'image/bmp';
	}
	if (extension === '.avif') {
		return 'image/avif';
	}

	// fallback value as per the spec
	return 'text/plain';
}

/**
 * Render the difference between a file in the given commit and its parent
 *
 * @param commitish A commit SHA or some other identifier that ultimately dereferences
 *                  to a commit.
 */
export async function getCommitDiff(
	repository: Repository,
	file: FileChange,
	commitish: string,
	hideWhitespaceInDiff: boolean = false
): Promise<IDiff> {
	const args = [
		'log',
		commitish,
		...(hideWhitespaceInDiff ? ['-w'] : []),
		'-m',
		'-1',
		'--first-parent',
		'--patch-with-raw',
		'-z',
		'--no-color',
		'--',
		file.path
	];

	if (
		file.status.kind === AppFileStatusKind.Renamed ||
		file.status.kind === AppFileStatusKind.Copied
	) {
		args.push(file.status.oldPath);
	}

	// const { output } = await spawnAndComplete(
	//   args,
	//   repository.path,
	//   'getCommitDiff'
	// )
	const { stdout }: GitResponse = await git(repository.path, args);

	return buildDiff(stdout, repository, file, commitish);
}

/**
 * Retrieve the binary contents of a blob from the object database
 *
 * Returns an image object containing the base64 encoded string,
 * as <img> tags support the data URI scheme instead of
 * needing to reference a file:// URI
 *
 * https://en.wikipedia.org/wiki/Data_URI_scheme
 */
export async function getBlobImage(
	repository: Repository,
	path: string,
	commitish: string
): Promise<Image> {
	const extension = await extname(path);
	const contents = await getBlobContents(repository, commitish, path);
	return new Image(contents.toString(), getMediaType(extension), contents.length);
}

/**
 * Render the diff for a file within the repository working directory. The file will be
 * compared against HEAD if it's tracked, if not it'll be compared to an empty file meaning
 * that all content in the file will be treated as additions.
 */
export async function getWorkingDirectoryDiff(
	repository: Repository,
	file: ChangedFile,
	hideWhitespaceInDiff: boolean = false
): Promise<IDiff> {
	// `--no-ext-diff` should be provided wherever we invoke `git diff` so that any
	// diff.external program configured by the user is ignored
	const args = [
		'diff',
		...(hideWhitespaceInDiff ? ['-w'] : []),
		'--no-ext-diff',
		'--patch-with-raw',
		'-z',
		'--no-color'
	];
	const successExitCodes = new Set([0]);
	const isSubmodule = file.status.submoduleStatus !== undefined;

	// For added submodules, we'll use the "default" parameters, which are able
	// to output the submodule commit.
	if (
		!isSubmodule &&
		(file.status.kind === AppFileStatusKind.New || file.status.kind === AppFileStatusKind.Untracked)
	) {
		// `git diff --no-index` seems to emulate the exit codes from `diff` irrespective of
		// whether you set --exit-code
		//
		// this is the behavior:
		// - 0 if no changes found
		// - 1 if changes found
		// -   and error otherwise
		//
		// citation in source:
		// https://github.com/git/git/blob/1f66975deb8402131fbf7c14330d0c7cdebaeaa2/diff-no-index.c#L300
		successExitCodes.add(1);
		args.push('--no-index', '--', '/dev/null', file.path);
	} else if (file.status.kind === AppFileStatusKind.Renamed) {
		// NB: Technically this is incorrect, the best kind of incorrect.
		// In order to show exactly what will end up in the commit we should
		// perform a diff between the new file and the old file as it appears
		// in HEAD. By diffing against the index we won't show any changes
		// already staged to the renamed file which differs from our other diffs.
		// The closest I got to that was running hash-object and then using
		// git diff <blob> <blob> but that seems a bit excessive.
		args.push('--', file.path);
	} else {
		args.push('HEAD', '--', file.path);
	}

	// const { output, error } = await spawnAndComplete(
	//   args,
	//   repository.path,
	//   'getWorkingDirectoryDiff',
	//   successExitCodes
	// )
	const { stdout }: GitResponse = await git(repository.path, args, { successExitCodes });
	// const lineEndingsChange = parseLineEndingsWarning(error)

	return buildDiff(stdout, repository, file, 'HEAD');
}

async function buildSubmoduleDiff(
	diff: string,
	repository: Repository,
	file: FileChange,
	status: SubmoduleStatus
): Promise<IDiff> {
	const path = file.path;
	const fullPath = await join(repository.path, path);
	const url = await getConfigValue(repository, `submodule.${path}.url`, true);

	let oldSHA = null;
	let newSHA = null;

	if (
		status.commitChanged ||
		file.status.kind === AppFileStatusKind.New ||
		file.status.kind === AppFileStatusKind.Deleted
	) {
		const lines = diff.split('\n');
		const baseRegex = 'Subproject commit ([^-]+)(-dirty)?$';
		const oldSHARegex = new RegExp('-' + baseRegex);
		const newSHARegex = new RegExp('\\+' + baseRegex);
		const lineMatch = (regex: RegExp) =>
			lines
				.flatMap((line: string) => {
					const match = line.match(regex);
					return match ? match[1] : [];
				})
				.at(0) ?? null;

		oldSHA = lineMatch(oldSHARegex);
		newSHA = lineMatch(newSHARegex);
	}

	return {
		kind: DiffType.Submodule,
		fullPath,
		path,
		url,
		status,
		oldSHA,
		newSHA
	};
}

/**
 * Retrieve the binary contents of a blob from the working directory
 *
 * Returns an image object containing the base64 encoded string,
 * as <img> tags support the data URI scheme instead of
 * needing to reference a file:// URI
 *
 * https://en.wikipedia.org/wiki/Data_URI_scheme
 */
export async function getWorkingDirectoryImage(
	repository: Repository,
	file: FileChange
): Promise<Image> {
	const contents = await readFile(await join(repository.path, file.path));
	return new Image(contents.toString(), getMediaType(await extname(file.path)), contents.length);
}

/**
 * Utility function used by get(Commit|WorkingDirectory)Diff.
 *
 * Parses the output from a diff-like command that uses `--path-with-raw`
 */
function diffFromRawDiffOutput(output: string): IRawDiff {
	const pieces = output.split('\0');
	const parser = new DiffParser();
	return parser.parse(forceUnwrap(`Invalid diff output`, pieces.at(-1)));
}

async function getImageDiff(
	repository: Repository,
	file: FileChange,
	oldestCommitish: string
): Promise<IImageDiff> {
	let current: Image | undefined = undefined;
	let previous: Image | undefined = undefined;

	// Are we looking at a file in the working directory or a file in a commit?
	if (file instanceof WorkingDirectoryFileChange) {
		// No idea what to do about this, a conflicted binary (presumably) file.
		// Ideally we'd show all three versions and let the user pick but that's
		// a bit out of scope for now.
		if (file.status.kind === AppFileStatusKind.Conflicted) {
			return { kind: DiffType.Image };
		}

		// Does it even exist in the working directory?
		if (file.status.kind !== AppFileStatusKind.Deleted) {
			current = await getWorkingDirectoryImage(repository, file);
		}

		if (
			file.status.kind !== AppFileStatusKind.New &&
			file.status.kind !== AppFileStatusKind.Untracked
		) {
			// If we have file.oldPath that means it's a rename so we'll
			// look for that file.
			previous = await getBlobImage(repository, getOldPathOrDefault(file), 'HEAD');
		}
	} else {
		// File status can't be conflicted for a file in a commit
		if (file.status.kind !== AppFileStatusKind.Deleted) {
			current = await getBlobImage(repository, file.path, oldestCommitish);
		}

		// File status can't be conflicted for a file in a commit
		if (
			file.status.kind !== AppFileStatusKind.New &&
			file.status.kind !== AppFileStatusKind.Untracked &&
			file.status.kind !== AppFileStatusKind.Deleted
		) {
			// TODO: commitish^ won't work for the first commit
			//
			// If we have file.oldPath that means it's a rename so we'll
			// look for that file.
			previous = await getBlobImage(repository, getOldPathOrDefault(file), `${oldestCommitish}^`);
		}

		if (file instanceof CommittedFileChange && file.status.kind === AppFileStatusKind.Deleted) {
			previous = await getBlobImage(repository, getOldPathOrDefault(file), file.parentCommitish);
		}
	}

	return {
		kind: DiffType.Image,
		previous: previous,
		current: current
	};
}

export async function convertDiff(
	repository: Repository,
	file: FileChange,
	diff: IRawDiff,
	oldestCommitish: string,
	lineEndingsChange?: LineEndingsChange
): Promise<IDiff> {
	if (diff.isBinary) {
		const extensionName = await extname(file.path);
		const extension = extensionName?.toLowerCase();
		// some extension we don't know how to parse, never mind
		if (!imageFileExtensions.has(extension)) {
			return {
				kind: DiffType.Binary
			};
		} else {
			return getImageDiff(repository, file, oldestCommitish);
		}
	}

	return {
		kind: DiffType.Text,
		text: diff.contents,
		hunks: diff.hunks,
		lineEndingsChange,
		maxLineNumber: diff.maxLineNumber,
		hasHiddenBidiChars: diff.hasHiddenBidiChars
	};
}

async function buildDiff(
	buffer: string,
	repository: Repository,
	file: FileChange,
	oldestCommitish: string,
	lineEndingsChange?: LineEndingsChange
): Promise<IDiff> {
	if (file.status.submoduleStatus !== undefined) {
		return buildSubmoduleDiff(buffer, repository, file, file.status.submoduleStatus);
	}

	// if (!isValidBuffer(buffer)) {
	//   // the buffer's diff is too large to be renderable in the UI
	//   return { kind: DiffType.Unrenderable }
	// }

	const diff = diffFromRawDiffOutput(buffer);

	// if (isBufferTooLarge(buffer) || isDiffTooLarge(diff)) {
	//   // we don't want to render by default
	//   // but we keep it as an option by
	//   // passing in text and hunks
	//   const largeTextDiff: ILargeTextDiff = {
	//     kind: DiffType.LargeText,
	//     text: diff.contents,
	//     hunks: diff.hunks,
	//     lineEndingsChange,
	//     maxLineNumber: diff.maxLineNumber,
	//     hasHiddenBidiChars: diff.hasHiddenBidiChars,
	//   }

	//   return largeTextDiff
	// }

	return convertDiff(repository, file, diff, oldestCommitish, lineEndingsChange);
}

/**
 * List the modified binary files' paths in the given repository
 *
 * @param ref ref (sha, branch, etc) to compare the working index against
 *
 * if you're mid-merge pass `'MERGE_HEAD'` to ref to get a diff of `HEAD` vs `MERGE_HEAD`,
 * otherwise you should probably pass `'HEAD'` to get a diff of the working tree vs `HEAD`
 */
export async function getBinaryPaths(
	projectPath: string,
	ref: string
): Promise<ReadonlyArray<string>> {
	// const { output } = await spawnAndComplete(
	//   ['diff', '--numstat', '-z', ref],
	//   projectPath,
	//   'getBinaryPaths'
	// )
	const { stdout } = await git(projectPath, ['diff', '--numstat', '-z', ref]);
	const captures = getCaptures(stdout, binaryListRegex);
	if (captures.length === 0) {
		return [];
	}
	// flatten the list (only does one level deep)
	const flatCaptures = captures.reduce((acc, val) => acc.concat(val));
	return flatCaptures;
}

const binaryListRegex = /-\t-\t(?:\0.+\0)?([^\0]*)/gi;
