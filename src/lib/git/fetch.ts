import { enableRecurseSubmodulesFlag } from '$lib/feature-flags';
import type { ITrackingBranch } from '$lib/models/branch';
import type { IGitAccount } from '$lib/models/git-account';
import type { IFetchProgress } from '$lib/models/progress';
import type { IRemote } from '$lib/models/remote';
import type { Repository } from '$lib/models/repository';
import { FetchProgressParser } from '$lib/utils/progress/fetch';
import { executionOptionsWithProgress } from '$lib/utils/progress/from-process';
import { git, gitNetworkArguments, type IGitExecutionOptions } from './cli';
import { envForRemoteOperation } from './environment';

function getFetchArgs(
	remote: string,
	progressCallback?: (progress: IFetchProgress) => void
): string[] {
	// we only want the origin part of the remote name
	const origin = remote.split('/').shift();
	if (enableRecurseSubmodulesFlag()) {
		return progressCallback != null
			? ([
					...gitNetworkArguments(),
					'fetch',
					'--progress',
					'--prune',
					'--recurse-submodules=on-demand',
					origin
				] as string[])
			: ([
					...gitNetworkArguments(),
					'fetch',
					'--prune',
					'--recurse-submodules=on-demand',
					origin
				] as string[]);
	} else {
		return progressCallback != null
			? ([...gitNetworkArguments(), 'fetch', '--progress', '--prune', origin] as string[])
			: ([...gitNetworkArguments(), 'fetch', '--prune', origin] as string[]);
	}
}

/**
 * Fetch from the given remote.
 *
 * @param repository - The repository to fetch into
 *
 * @param account    - The account to use when authenticating with the remote
 *
 * @param remote     - The remote to fetch from
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the fetch operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git fetch'.
 */
export async function fetch(
	repository: Repository,
	account: IGitAccount | null,
	remote: IRemote,
	progressCallback?: (progress: IFetchProgress) => void
): Promise<void> {
	let opts: IGitExecutionOptions = {
		successExitCodes: new Set([0]),
		env: await envForRemoteOperation(account, remote.url)
	};

	if (progressCallback) {
		const title = `Fetching ${remote.name}`;
		const kind = 'fetch';

		opts = await executionOptionsWithProgress(
			{ ...opts, trackLFSProgress: true },
			new FetchProgressParser(),
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

	const args = getFetchArgs(remote.name, progressCallback);

	await git(repository.path, args, opts);
}

/** Fetch a given refspec from the given remote. */
export async function fetchRefspec(
	repository: Repository,
	account: IGitAccount | null,
	remote: IRemote,
	refspec: string
): Promise<void> {
	await git(repository.path, [...gitNetworkArguments(), 'fetch', remote.name, refspec], {
		successExitCodes: new Set([0, 128]),
		env: await envForRemoteOperation(account, remote.url)
	});
}

export async function fastForwardBranches(
	repository: Repository,
	branches: ReadonlyArray<ITrackingBranch>
): Promise<void> {
	if (branches.length === 0) {
		return;
	}

	const refPairs = branches.map((branch) => `${branch.upstreamRef}:${branch.ref}`);

	const opts: IGitExecutionOptions = {
		// Fetch exits with an exit code of 1 if one or more refs failed to update
		// which is what we expect will happen
		successExitCodes: new Set([0, 1]),
		env: {
			// This will make sure the reflog entries are correct after
			// fast-forwarding the branches.
			GIT_REFLOG_ACTION: 'pull'
		},
		stdin: refPairs.join('\n')
	};

	await git(
		repository.path,
		[
			'fetch',
			'.',
			// Make sure we don't try to update branches that can't be fast-forwarded
			// even if the user disabled this via the git config option
			// `fetch.showForcedUpdates`
			'--show-forced-updates',
			// Prevent `git fetch` from touching the `FETCH_HEAD`
			'--no-write-fetch-head',
			// Take branch refs from stdin to circumvent shell max line length
			// limitations (mainly on Windows)
			'--stdin'
		],
		opts
	);
}
