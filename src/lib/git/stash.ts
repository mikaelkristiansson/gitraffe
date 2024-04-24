import { stageFiles } from './update-index';
import { createLogParser } from './git-delimiter-parser';
import {
	StashedChangesLoadStates,
	type IStashEntry,
	type StashedFileChanges
} from '$lib/models/stash-entry';
import type { Repository } from '$lib/models/repository';
import { git } from './cli';
import type { Branch } from '$lib/models/branch';
import type { CommittedFileChange, WorkingDirectoryFileChange } from '$lib/models/status';
import { parseRawLogWithNumstat } from './log';
import { IGitError } from '$lib/models/git-errors';

export const GitfoxStashEntryMarker = '!!gitfox';

/**
 * RegEx for determining if a stash entry is created by Gitfox
 *
 * This is done by looking for a magic string with the following
 * format: `!!gitfox<branch>`
 */
const gitfoxStashEntryMessageRe = /!!gitfox<(.+)>$/;

type StashResult = {
	/** The stash entries created by Gitfox */
	readonly gitfoxEntries: ReadonlyArray<IStashEntry>;

	/**
	 * The total amount of stash entries,
	 * i.e. stash entries created both by Gitfox and outside of Gitfox
	 */
	readonly stashEntryCount: number;
};

/**
 * Get the list of stash entries created by Gitfox in the current repository
 * using the default ordering of refs (which is LIFO ordering),
 * as well as the total amount of stash entries.
 */
export async function getStashes(repository: Repository): Promise<StashResult> {
	const { formatArgs, parse } = createLogParser({
		name: '%gD',
		stashSha: '%H',
		message: '%gs',
		tree: '%T',
		parents: '%P'
	});

	const result = await git(repository.path, ['log', '-g', ...formatArgs, 'refs/stash'], {
		successExitCodes: new Set([0, 128])
	});

	// There's no refs/stashes reflog in the repository or it's not
	// even a repository. In either case we don't care
	if (result.exitCode === 128) {
		return { gitfoxEntries: [], stashEntryCount: 0 };
	}

	const gitfoxEntries: Array<IStashEntry> = [];
	const files: StashedFileChanges = { kind: StashedChangesLoadStates.NotLoaded };

	const entries = parse(result.stdout);

	for (const { name, message, stashSha, tree, parents } of entries) {
		const branchName = extractBranchFromMessage(message);

		if (branchName !== null) {
			gitfoxEntries.push({
				name,
				stashSha,
				branchName,
				tree,
				parents: parents.length > 0 ? parents.split(' ') : [],
				files
			});
		}
	}

	return { gitfoxEntries, stashEntryCount: entries.length - 1 };
}

/**
 * Moves a stash entry to a different branch by means of creating
 * a new stash entry associated with the new branch and dropping the old
 * stash entry.
 */
export async function moveStashEntry(
	repository: Repository,
	{ stashSha, parents, tree }: IStashEntry,
	branchName: string
) {
	const message = `On ${branchName}: ${createGitfoxStashMessage(branchName)}`;
	const parentArgs = parents.flatMap((p) => ['-p', p]);

	const { stdout: commitId } = await git(repository.path, [
		'commit-tree',
		...parentArgs,
		'-m',
		message,
		'--no-gpg-sign',
		tree
	]);

	await git(repository.path, ['stash', 'store', '-m', message, commitId.trim()]);

	await dropGitfoxStashEntry(repository, stashSha);
}

/**
 * Returns the last Gitfox created stash entry for the given branch
 */
export async function getLastGitfoxStashEntryForBranch(
	repository: Repository,
	branch: Branch | string
) {
	const stash = await getStashes(repository);
	const branchName = typeof branch === 'string' ? branch : branch.name;

	// Since stash objects are returned in a LIFO manner, the first
	// entry found is guaranteed to be the last entry created
	return stash.gitfoxEntries.find((stash) => stash.branchName === branchName) || null;
}

/** Creates a stash entry message that indicates the entry was created by Gitfox */
export function createGitfoxStashMessage(branchName: string) {
	return `${GitfoxStashEntryMarker}<${branchName}>`;
}

/**
 * Stash the working directory changes for the current branch
 */
export async function createGitfoxStashEntry(
	repository: Repository,
	branch: Branch | string,
	untrackedFilesToStage: ReadonlyArray<WorkingDirectoryFileChange>
): Promise<boolean> {
	// We must ensure that no untracked files are present before stashing
	// See https://github.com/desktop/desktop/pull/8085
	// First ensure that all changes in file are selected
	// (in case the user has not explicitly checked the checkboxes for the untracked files)
	const fullySelectedUntrackedFiles = untrackedFilesToStage.map((x) => x.withIncludeAll(true));
	await stageFiles(repository, fullySelectedUntrackedFiles);

	const branchName = typeof branch === 'string' ? branch : branch.name;
	const message = createGitfoxStashMessage(branchName);
	const args = ['stash', 'push', '-m', message];

	const result = await git(repository.path, args, {
		successExitCodes: new Set<number>([0, 1])
	});

	if (result.exitCode === 1) {
		// search for any line starting with `error:` -  /m here to ensure this is
		// applied to each line, without needing to split the text
		const errorPrefixRe = /^error: /m;

		const matches = errorPrefixRe.exec(result.stderr);
		if (matches !== null && matches.length > 0) {
			// rethrow, because these messages should prevent the stash from being created
			throw new Error(result.stderr);
		}

		// if no error messages were emitted by Git, we should log but continue because
		// a valid stash was created and this should not interfere with the checkout

		console.info(
			`[createGitfoxStashEntry] a stash was created successfully but exit code ${result.status} reported. stderr: ${result.stderr}`
		);
	}

	// Stash doesn't consider it an error that there aren't any local changes to save.
	if (result.stdout === 'No local changes to save\n') {
		return false;
	}

	return true;
}

async function getStashEntryMatchingSha(repository: Repository, sha: string) {
	const stash = await getStashes(repository);
	return stash.gitfoxEntries.find((e) => e.stashSha === sha) || null;
}

/**
 * Removes the given stash entry if it exists
 *
 * @param stashSha the SHA that identifies the stash entry
 */
export async function dropGitfoxStashEntry(repository: Repository, stashSha: string) {
	const entryToDelete = await getStashEntryMatchingSha(repository, stashSha);

	if (entryToDelete !== null) {
		const args = ['stash', 'drop', entryToDelete.name];
		await git(repository.path, args);
	}
}

/**
 * Pops the stash entry identified by matching `stashSha` to its commit hash.
 *
 * To see the commit hash of stash entry, run
 * `git log -g refs/stash --pretty="%nentry: %gd%nsubject: %gs%nhash: %H%n"`
 * in a repo with some stash entries.
 */
export async function popStashEntry(repository: Repository, stashSha: string): Promise<void> {
	// ignoring these git errors for now, this will change when we start
	// implementing the stash conflict flow
	const expectedErrors = new Set<IGitError>([IGitError.MergeConflicts]);
	const successExitCodes = new Set<number>([0, 1]);
	const stashToPop = await getStashEntryMatchingSha(repository, stashSha);

	if (stashToPop !== null) {
		const args = ['stash', 'pop', '--quiet', `${stashToPop.name}`];
		const result = await git(repository.path, args, {
			expectedErrors,
			successExitCodes
		});

		// popping a stashes that create conflicts in the working directory
		// report an exit code of `1` and are not dropped after being applied.
		// so, we check for this case and drop them manually
		if (result.exitCode === 1) {
			if (result.stderr.length > 0) {
				// rethrow, because anything in stderr should prevent the stash from being popped
				throw new Error(result.stderr);
			}

			console.info(
				`[popStashEntry] a stash was popped successfully but exit code ${result.status} reported.`
			);
			// bye bye
			await dropGitfoxStashEntry(repository, stashSha);
		}
	}
}

function extractBranchFromMessage(message: string): string | null {
	const match = gitfoxStashEntryMessageRe.exec(message);
	return match === null || match[1].length === 0 ? null : match[1];
}

/** Get the files that were changed in the given stash commit */
export async function getStashedFiles(
	repository: Repository,
	stashSha: string
): Promise<Array<CommittedFileChange>> {
	const args = [
		'stash',
		'show',
		stashSha,
		'--raw',
		'--numstat',
		'-z',
		'--format=format:',
		'--no-show-signature',
		'--'
	];

	const { stdout } = await git(repository.path, args);

	return parseRawLogWithNumstat(stdout, stashSha, `${stashSha}^`).files;
}
