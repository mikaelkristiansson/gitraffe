// import type { WorkingDirectoryFileChange } from '$lib/models/status';
import type { Repository } from '$lib/models/repository';
import { AppFileStatusKind, type WorkingDirectoryFileChange } from '$lib/models/status';
import { GitResetMode, reset, unstageAll } from './reset';
import { stageFiles } from './update-index';
import type { Commit } from '$lib/models/commit';
import { getStatus } from './status';
import { checkoutPaths } from './checkout';
import { deleteRef } from './update-ref';
import { unstageAllFiles } from './rm';
import { git } from './cli';

/**
 * @param repository repository to execute merge in
 * @param message commit message
 * @param files files to commit
 * @returns the commit SHA
 */
export async function createCommit(
	repository: Repository,
	message: string,
	files: ReadonlyArray<WorkingDirectoryFileChange>,
	amend: boolean = false
): Promise<string> {
	// Clear the staging area, our diffs reflect the difference between the
	// working directory and the last commit (if any) so our commits should
	// do the same thing.
	try {
		await unstageAll(repository);
	} catch (e) {
		console.error('unstage: ', e);
	}

	try {
		await stageFiles(repository, files);
	} catch (e) {
		console.error('stageFiles: ', e);
	}

	const args = ['-F', '-'];

	if (amend) {
		args.push('--amend');
	}

	// const result = await git(
	//   ['commit', ...args],
	//   repository.path,
	//   'createCommit',
	//   {
	//     stdin: message,
	//   }
	// )
	try {
		const { stdout } = await git(repository.path, ['commit', ...args], message);
		return parseCommitSHA(stdout);
	} catch (e) {
		console.error('createCommit: ', e);
		throw e;
	}
}

/**
 * Returns the SHA of the passed in GitResponse
 */
export function parseCommitSHA(result: string): string {
	return result.split(']')[0].split(' ')[1];
}

async function undoFirstCommit(repository: Repository): Promise<true | undefined> {
	// What are we doing here?
	// The state of the working directory here is rather important, because we
	// want to ensure that any deleted files are restored to your working
	// directory for the next stage. Doing doing a `git checkout -- .` here
	// isn't suitable because we should preserve the other working directory
	// changes.

	const status = await getStatus(repository);

	if (status == null) {
		throw new Error(
			`Unable to undo commit because there are too many files in your repository's working directory.`
		);
	}

	const paths = status.workingDirectory.files;

	const deletedFiles = paths.filter((p) => p.status.kind === AppFileStatusKind.Deleted);
	const deletedFilePaths = deletedFiles.map((d) => d.path);

	await checkoutPaths(repository, deletedFilePaths);

	// Now that we have the working directory changes, as well the restored
	// deleted files, we can remove the HEAD ref to make the current branch
	// disappear
	await deleteRef(repository, 'HEAD', 'Reverting first commit');

	// Finally, ensure any changes in the index are unstaged. This ensures all
	// files in the repository will be untracked.
	await unstageAllFiles(repository);
	return true;
}

/**
 * Undo a specific commit for the current repository.
 *
 * @param commit - The commit to remove - should be the tip of the current branch.
 */
export async function undoCommit(
	commit: Commit,
	repository: Repository
): Promise<{ summary: string; body: string } | undefined> {
	// For an initial commit, just delete the reference but leave HEAD. This
	// will make the branch unborn again.
	const success = await (commit.parentSHAs.length === 0
		? undoFirstCommit(repository)
		: reset(repository, GitResetMode.Mixed, commit.parentSHAs[0]));

	if (success === undefined) {
		return;
	}

	// const coAuthorsRestored = await this.restoreCoAuthorsFromCommit(commit)
	// if (coAuthorsRestored) {
	//   return
	// }

	return {
		summary: commit.summary,
		body: commit.body
	};
}
