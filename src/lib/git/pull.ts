import { AuthenticationErrors } from './authentication';
// import { envForRemoteOperation } from './environment';
import { getConfigValue } from './config';
import type { Repository } from '$lib/models/repository';
import type { IGitAccount } from '$lib/models/git-account';
import type { IPullProgress } from '$lib/models/progress';
import {
	GitError,
	git,
	gitNetworkArguments,
	gitRebaseArguments,
	type IGitExecutionOptions
} from './cli';
import { enableRecurseSubmodulesFlag } from '$lib/feature-flags';
import type { IRemote } from '$lib/models/remote';
import { executionOptionsWithProgress } from '$lib/utils/progress/from-process';
import { PullProgressParser } from '$lib/utils/progress/pull';

async function getPullArgs(
	repository: Repository,
	remote: string,
	account: IGitAccount | null,
	progressCallback?: (progress: IPullProgress) => void
) {
	const divergentPathArgs = await getDefaultPullDivergentBranchArguments(repository);

	const args = [...gitNetworkArguments(), ...gitRebaseArguments(), 'pull', ...divergentPathArgs];

	if (enableRecurseSubmodulesFlag()) {
		args.push('--recurse-submodules');
	}

	if (progressCallback != null) {
		args.push('--progress');
	}

	args.push(remote);

	return args;
}

/**
 * Pull from the specified remote.
 *
 * @param repository - The repository in which the pull should take place
 *
 * @param remote     - The name of the remote that should be pulled from
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the pull operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git pull'.
 */
export async function pull(
	repository: Repository,
	account: IGitAccount | null,
	remote: IRemote,
	progressCallback?: (progress: IPullProgress) => void
): Promise<void> {
	let opts: IGitExecutionOptions = {
		// env: await envForRemoteOperation(account, remote.url),
		expectedErrors: AuthenticationErrors
	};

	if (progressCallback) {
		const title = `Pulling ${remote.name}`;
		const kind = 'pull';

		opts = await executionOptionsWithProgress(
			{ ...opts, trackLFSProgress: true },
			new PullProgressParser(),
			(progress) => {
				// In addition to progress output from the remote end and from
				// git itself, the stderr output from pull contains information
				// about ref updates. We don't need to bring those into the progress
				// stream so we'll just punt on anything we don't know about for now.
				if (progress.kind === 'context') {
					if (!progress.text.startsWith('remote: Counting objects')) {
						return;
					}
				}

				const description = progress.kind === 'progress' ? progress.details.text : progress.text;

				const value = progress.percent;

				progressCallback({
					kind,
					title,
					description,
					value,
					remote: remote.name
				});
			}
		);

		// Initial progress
		progressCallback({ kind, title, value: 0, remote: remote.name });
	}

	const args = await getPullArgs(repository, remote.name, account, progressCallback);
	const result = await git(repository.path, args, opts);

	if (result.gitErrorDescription) {
		throw new GitError(result, args);
	}
}

/**
 * Defaults the pull default for divergent paths to try to fast forward and if
 * not perform a merge. Aka uses the flag --ff
 *
 * It checks whether the user has a config set for this already, if so, no need for
 * default.
 */
async function getDefaultPullDivergentBranchArguments(
	repository: Repository
): Promise<ReadonlyArray<string>> {
	try {
		const pullFF = await getConfigValue(repository, 'pull.ff');
		return pullFF !== null ? [] : ['--ff'];
	} catch (e) {
		console.error("Couldn't read 'pull.ff' config", e);
	}

	// If there is a failure in checking the config, we still want to use any
	// config and not overwrite the user's set config behavior. This will show the
	// git error if no config is set.
	return [];
}
