import type { Repository } from '$lib/models/repository';
import { git, gitNetworkArguments, type IGitExecutionOptions } from './cli';
import type { IGitAccount } from '$lib/models/git-account';
import { BranchType, type Branch } from '$lib/models/branch';
import { enableRecurseSubmodulesFlag } from '$lib/feature-flags';
import type { ICheckoutProgress } from '$lib/models/progress';
import { executionOptionsWithProgress } from '$lib/utils/progress/from-process';
import { envForRemoteOperation, getFallbackUrlForProxyResolve } from './environment';
import { AuthenticationErrors } from './authentication';
import { CheckoutProgressParser } from '$lib/utils/progress/checkout';
import { platform } from '@tauri-apps/api/os';

/** Check out the paths at HEAD. */
export async function checkoutPaths(
	repository: Repository,
	paths: ReadonlyArray<string>
): Promise<void> {
	await git(repository.path, ['checkout', 'HEAD', '--', ...paths]);
}

export type ProgressCallback = (progress: ICheckoutProgress) => void;

function getCheckoutArgs(progressCallback?: ProgressCallback) {
	return progressCallback != null
		? [...gitNetworkArguments(), 'checkout', '--progress']
		: [...gitNetworkArguments(), 'checkout'];
}

async function getBranchCheckoutArgs(branch: Branch) {
	const baseArgs: ReadonlyArray<string> = [];
	if (enableRecurseSubmodulesFlag()) {
		return branch.type === BranchType.Remote
			? baseArgs.concat(branch.name, '-b', branch.nameWithoutRemote, '--recurse-submodules', '--')
			: baseArgs.concat(branch.name, '--recurse-submodules', '--');
	}

	return branch.type === BranchType.Remote
		? baseArgs.concat(branch.name, '-b', branch.nameWithoutRemote, '--')
		: baseArgs.concat(branch.name, '--');
}

async function getCheckoutOpts(
	repository: Repository,
	account: IGitAccount | null,
	title: string,
	target: string,
	progressCallback?: ProgressCallback,
	initialDescription?: string
): Promise<IGitExecutionOptions> {
	const opts: IGitExecutionOptions = {
		env: await envForRemoteOperation(account, getFallbackUrlForProxyResolve(account, repository)),
		expectedErrors: AuthenticationErrors
	};

	if (!progressCallback) {
		return opts;
	}

	const kind = 'checkout';

	// Initial progress
	progressCallback({
		kind,
		title,
		description: initialDescription ?? title,
		value: 0,
		target
	});

	return await executionOptionsWithProgress(
		{ ...opts, trackLFSProgress: true },
		new CheckoutProgressParser(),
		(progress) => {
			if (progress.kind === 'progress') {
				const description = progress.details.text;
				const value = progress.percent;

				progressCallback({
					kind,
					title,
					description,
					value,
					target
				});
			}
		}
	);
}

/**
 * Check out the given branch.
 *
 * @param repository - The repository in which the branch checkout should
 *                     take place
 *
 * @param branch     - The branch name that should be checked out
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the checkout operation. When provided this
 *                           enables the '--progress' command line flag for
 *                           'git checkout'.
 */
export async function checkoutBranch(
	repository: Repository,
	account: IGitAccount | null,
	branch: Branch,
	progressCallback?: ProgressCallback
): Promise<true> {
	const platformName = await platform();
	const opts = await getCheckoutOpts(
		repository,
		account,
		`Checking out branch ${branch.name}`,
		branch.name,
		progressCallback,
		`Switching to ${platformName === 'darwin' ? 'Branch' : 'branch'}`
	);

	const baseArgs = getCheckoutArgs(progressCallback);
	const args = [...baseArgs, ...(await getBranchCheckoutArgs(branch))];

	await git(repository.path, args, opts);
	return true;
}
