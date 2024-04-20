import { invoke } from '@tauri-apps/api/tauri';
import { getStatus, type IStatusResult } from './status';
import type { GitResponse } from './type';
import type { Branch } from '$lib/models/branch';
import type { Repository } from '$lib/models/repository';
import { GitErrorRegexes, IGitError } from '$lib/models/git-errors';
import { assertNever } from '$lib/fatal-error';
import { getFileFromExceedsError } from '$lib/utils/regex';

export async function git(
	path: string,
	args: string[],
	options?: IGitExecutionOptions
): Promise<IGitResult> {
	const defaultOptions: IGitExecutionOptions = {
		successExitCodes: new Set([0]),
		expectedErrors: new Set()
	};

	const opts = {
		...defaultOptions,
		...options
	};

	opts.env = { TERM: 'dumb', ...opts.env } as object;
	const result = await invoke<GitResponse>('git', { path, args, stdin: opts.stdin, env: opts.env });

	const exitCode = result.status;

	let gitError: IGitError | null = null;
	const acceptableExitCode = opts.successExitCodes ? opts.successExitCodes.has(exitCode) : false;
	if (!acceptableExitCode) {
		gitError = parseError(result.stderr);
		if (gitError === null) {
			gitError = parseError(result.stdout);
		}
	}

	const gitErrorDescription = gitError !== null ? getDescriptionForError(gitError) : null;
	//   gitError !== null ? getDescriptionForError(gitError, result.stderr) : null
	const gitResult = {
		...result,
		exitCode,
		gitError,
		gitErrorDescription,
		path
	};

	let acceptableError = true;
	if (gitError !== null && opts.expectedErrors) {
		acceptableError = opts.expectedErrors.has(gitError);
	}

	if ((gitError !== null && acceptableError) || acceptableExitCode) {
		return gitResult;
	}

	// The caller should either handle this error, or expect that exit code.
	const errorMessage = new Array<string>();
	errorMessage.push(`\`git ${args.join(' ')}\` exited with an unexpected code: ${exitCode}.`);

	if (result.stdout) {
		errorMessage.push('stdout:');
		errorMessage.push(result.stdout);
	}

	if (result.stderr) {
		errorMessage.push('stderr:');
		errorMessage.push(result.stderr);
	}

	if (gitError !== null) {
		errorMessage.push(`(The error was parsed as ${gitError}: ${gitErrorDescription})`);
	}

	console.error(errorMessage.join('\n'));

	if (gitError === IGitError.PushWithFileSizeExceedingLimit) {
		const result = getFileFromExceedsError(errorMessage.join());
		const files = result.join('\n');

		if (files !== '') {
			gitResult.gitErrorDescription += '\n\nFile causing error:\n\n' + files;
		}
	}

	throw new GitError(gitResult, args);
}

function parseError(stderr: string): IGitError | null {
	for (const [regex, error] of Object.entries(GitErrorRegexes)) {
		if (stderr.match(regex)) {
			return error;
		}
	}
	return null;
}

export async function fetchAll(path: string): Promise<string> {
	const args = ['fetch', '--all'];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function checkout(path: string, branch: string): Promise<string> {
	const args = ['checkout', branch];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function pullOrigin(path: string, branchName: Branch['name']): Promise<string> {
	const args = ['pull', 'origin', branchName];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function push(path: string): Promise<string> {
	const args = ['push'];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function getBranchStatus(repository: Repository): Promise<IStatusResult | null> {
	return await getStatus(repository);
}

export async function getCurrentBranchName(path: string): Promise<string> {
	const { stdout }: GitResponse = await invoke('git', {
		path,
		args: ['symbolic-ref', '--short', 'HEAD']
	});
	return stdout.trim();
}

function getDescriptionForError(
	error: IGitError
	// stderr: string
): string | null {
	// 	if (isAuthFailureError(error)) {
	// 	  const menuHint = __DARWIN__
	// 		? 'GitHub Desktop > Settings.'
	// 		: 'File > Options.'
	// 	  return `Authentication failed. Some common reasons include:

	//   - You are not logged in to your account: see ${menuHint}
	//   - You may need to log out and log back in to refresh your token.
	//   - You do not have permission to access this repository.
	//   - The repository is archived on GitHub. Check the repository settings to confirm you are still permitted to push commits.
	//   - If you use SSH authentication, check that your key is added to the ssh-agent and associated with your account.
	//   - If you use SSH authentication, ensure the host key verification passes for your repository hosting service.
	//   - If you used username / password authentication, you might need to use a Personal Access Token instead of your account password. Check the documentation of your repository hosting service.`
	// 	}

	switch (error) {
		//   case IGitError.BadConfigValue:
		// 	// const errorInfo = GitProcess.parseBadConfigValueErrorInfo(stderr)
		// 	// if (errorInfo === null) {
		// 	//   return 'Unsupported git configuration value.'
		// 	// }

		// 	return `Unsupported value '${errorInfo.value}' for git config key '${errorInfo.key}'`
		case IGitError.SSHKeyAuditUnverified:
			return 'The SSH key is unverified.';
		case IGitError.RemoteDisconnection:
			return 'The remote disconnected. Check your Internet connection and try again.';
		case IGitError.HostDown:
			return 'The host is down. Check your Internet connection and try again.';
		case IGitError.RebaseConflicts:
			return 'We found some conflicts while trying to rebase. Please resolve the conflicts before continuing.';
		case IGitError.MergeConflicts:
			return 'We found some conflicts while trying to merge. Please resolve the conflicts and commit the changes.';
		case IGitError.HTTPSRepositoryNotFound:
		case IGitError.SSHRepositoryNotFound:
			return 'The repository does not seem to exist anymore. You may not have access, or it may have been deleted or renamed.';
		case IGitError.PushNotFastForward:
			return 'The repository has been updated since you last pulled. Try pulling before pushing.';
		case IGitError.BranchDeletionFailed:
			return 'Could not delete the branch. It was probably already deleted.';
		case IGitError.DefaultBranchDeletionFailed:
			return `The branch is the repository's default branch and cannot be deleted.`;
		case IGitError.RevertConflicts:
			return 'To finish reverting, please merge and commit the changes.';
		case IGitError.EmptyRebasePatch:
			return 'There aren’t any changes left to apply.';
		case IGitError.NoMatchingRemoteBranch:
			return 'There aren’t any remote branches that match the current branch.';
		case IGitError.NothingToCommit:
			return 'There are no changes to commit.';
		case IGitError.NoSubmoduleMapping:
			return 'A submodule was removed from .gitmodules, but the folder still exists in the repository. Delete the folder, commit the change, then try again.';
		case IGitError.SubmoduleRepositoryDoesNotExist:
			return 'A submodule points to a location which does not exist.';
		case IGitError.InvalidSubmoduleSHA:
			return 'A submodule points to a commit which does not exist.';
		case IGitError.LocalPermissionDenied:
			return 'Permission denied.';
		case IGitError.InvalidMerge:
			return 'This is not something we can merge.';
		case IGitError.InvalidRebase:
			return 'This is not something we can rebase.';
		case IGitError.NonFastForwardMergeIntoEmptyHead:
			return 'The merge you attempted is not a fast-forward, so it cannot be performed on an empty branch.';
		case IGitError.PatchDoesNotApply:
			return 'The requested changes conflict with one or more files in the repository.';
		case IGitError.BranchAlreadyExists:
			return 'A branch with that name already exists.';
		case IGitError.BadRevision:
			return 'Bad revision.';
		case IGitError.NotAGitRepository:
			return 'This is not a git repository.';
		case IGitError.ProtectedBranchForcePush:
			return 'This branch is protected from force-push operations.';
		case IGitError.ProtectedBranchRequiresReview:
			return 'This branch is protected and any changes requires an approved review. Open a pull request with changes targeting this branch instead.';
		case IGitError.PushWithFileSizeExceedingLimit:
			return "The push operation includes a file which exceeds GitHub's file size restriction of 100MB. Please remove the file from history and try again.";
		case IGitError.HexBranchNameRejected:
			return 'The branch name cannot be a 40-character string of hexadecimal characters, as this is the format that Git uses for representing objects.';
		case IGitError.ForcePushRejected:
			return 'The force push has been rejected for the current branch.';
		case IGitError.InvalidRefLength:
			return 'A ref cannot be longer than 255 characters.';
		case IGitError.CannotMergeUnrelatedHistories:
			return 'Unable to merge unrelated histories in this repository.';
		case IGitError.PushWithPrivateEmail:
			return 'Cannot push these commits as they contain an email address marked as private on GitHub. To push anyway, visit https://github.com/settings/emails, uncheck "Keep my email address private", then switch back to GitHub Desktop to push your commits. You can then enable the setting again.';
		case IGitError.LFSAttributeDoesNotMatch:
			return 'Git LFS attribute found in global Git configuration does not match expected value.';
		case IGitError.ProtectedBranchDeleteRejected:
			return 'This branch cannot be deleted from the remote repository because it is marked as protected.';
		case IGitError.ProtectedBranchRequiredStatus:
			return 'The push was rejected by the remote server because a required status check has not been satisfied.';
		case IGitError.BranchRenameFailed:
			return 'The branch could not be renamed.';
		case IGitError.PathDoesNotExist:
			return 'The path does not exist on disk.';
		case IGitError.InvalidObjectName:
			return 'The object was not found in the Git repository.';
		case IGitError.OutsideRepository:
			return 'This path is not a valid path inside the repository.';
		case IGitError.LockFileAlreadyExists:
			return 'A lock file already exists in the repository, which blocks this operation from completing.';
		case IGitError.NoMergeToAbort:
			return 'There is no merge in progress, so there is nothing to abort.';
		case IGitError.NoExistingRemoteBranch:
			return 'The remote branch does not exist.';
		case IGitError.LocalChangesOverwritten:
			return 'Unable to switch branches as there are working directory changes which would be overwritten. Please commit or stash your changes.';
		case IGitError.UnresolvedConflicts:
			return 'There are unresolved conflicts in the working directory.';
		case IGitError.ConfigLockFileAlreadyExists:
			// Added in dugite 1.88.0 (https://github.com/desktop/dugite/pull/386)
			// in support of https://github.com/desktop/desktop/issues/8675 but we're
			// not using it yet. Returning a null message here means the stderr will
			// be used as the error message (or stdout if stderr is empty), i.e. the
			// same behavior as before the ConfigLockFileAlreadyExists was added
			return null;
		case IGitError.RemoteAlreadyExists:
			return null;
		case IGitError.TagAlreadyExists:
			return 'A tag with that name already exists';
		case IGitError.MergeWithLocalChanges:
		case IGitError.RebaseWithLocalChanges:
		case IGitError.GPGFailedToSignData:
		case IGitError.ConflictModifyDeletedInBranch:
		case IGitError.MergeCommitNoMainlineOption:
		case IGitError.UnsafeDirectory:
		case IGitError.PathExistsButNotInRef:
			return null;
		default:
			return assertNever(error as never, `Unknown error: ${error}`);
	}
}

export class GitError extends Error {
	/** The result from the failed command. */
	public readonly result: IGitResult;

	/** The args for the failed command. */
	public readonly args: ReadonlyArray<string>;

	/**
	 * Whether or not the error message is just the raw output of the git command.
	 */
	public readonly isRawMessage: boolean;

	public constructor(result: IGitResult, args: ReadonlyArray<string>) {
		let rawMessage = true;
		let message;

		if (result.stderr.length) {
			message = result.stderr;
		} else if (result.stdout.length) {
			message = result.stdout;
		} else {
			message = 'Unknown error';
			rawMessage = false;
		}

		super(message);

		this.name = 'GitError';
		this.result = result;
		this.args = args;
		this.isRawMessage = rawMessage;
	}
}

export interface IGitResult {
	/** The standard output from git. */
	readonly stdout: string;
	/** The standard error output from git. */
	readonly stderr: string;
	/** The exit code of the git process. */
	readonly status: number;
	/** The exit code of the git process. */
	readonly exitCode: number;
	/**
	 * The parsed git error. This will be null when the exit code is included in
	 * the `successExitCodes`, or when dugite was unable to parse the
	 * error.
	 */
	readonly gitError: IGitError | null;

	/** The human-readable error description, based on `gitError`. */
	readonly gitErrorDescription: string | null;

	/**
	 * The path that the Git command was executed from, i.e. the
	 * process working directory (not to be confused with the Git
	 * working directory which is... super confusing, I know)
	 */
	readonly path: string;
}

interface ExecutionOptions {
	/**
	 * An optional collection of key-value pairs which will be
	 * set as environment variables before executing the git
	 * process.
	 */
	readonly env?: object;
	/**
	 * An optional string or buffer which will be written to
	 * the child process stdin stream immediately immediately
	 * after spawning the process.
	 */
	readonly stdin?: string;
}

/**
 * An extension of the execution options in dugite that
 * allows us to piggy-back our own configuration options in the
 * same object.
 */
export interface IGitExecutionOptions extends ExecutionOptions {
	/**
	 * The exit codes which indicate success to the
	 * caller. Unexpected exit codes will be logged and an
	 * error thrown. Defaults to 0 if undefined.
	 */
	readonly successExitCodes?: ReadonlySet<number>;

	/**
	 * The git errors which are expected by the caller. Unexpected errors will
	 * be logged and an error thrown.
	 */
	readonly expectedErrors?: ReadonlySet<IGitError>;

	/** Should it track & report LFS progress? */
	readonly trackLFSProgress?: boolean;
}

/**
 * Return an array of command line arguments for network operation that override
 * the default git configuration values provided by local, global, or system
 * level git configs.
 *
 * These arguments should be inserted before the subcommand, i.e in the case of
 * `git pull` these arguments needs to go before the `pull` argument.
 */
export const gitNetworkArguments = () => [
	// Explicitly unset any defined credential helper, we rely on our
	// own askpass for authentication.
	'-c',
	'credential.helper='
];
