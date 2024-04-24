import { fetch } from '$lib/git/fetch';
import { getRemoteURL } from '$lib/git/remote';
import type { IGitAccount } from '$lib/models/git-account';
import type { IFetchProgress } from '$lib/models/progress';
import { updateRemoteHEAD, type IRemote } from '$lib/models/remote';
import type { Repository } from '$lib/models/repository';
import { RetryActionType, type RetryAction } from '$lib/models/retry-actions';
import { performFailableOperation } from './failable-operation';

export async function setRepositoryURL(repository: Repository) {
	return getRemoteURL(repository, 'origin').then((url) => {
		if (url) {
			const regex = /(git@[\w.]+):(.*?)(\.git)(\/?|#[-\d\w._]+?)$/;
			const match = String(url.trim()).match(regex)?.slice(1);
			const [gitURL, repo] = match as string[];
			const extractUrl = gitURL.replace('git@', 'https://');
			const link = `${extractUrl}/${repo}`;
			return { link, repo, gitURL };
		}
		return null;
	});
}

/**
 * Fetch a remote, using the given account for authentication.
 *
 * @param account          - The account to use for authentication if needed.
 * @param remote           - The name of the remote to fetch from.
 * @param backgroundTask   - Was the fetch done as part of a background task?
 * @param progressCallback - A function that's called with information about
 *                           the overall fetch progress.
 */
export async function fetchRemote(
	account: IGitAccount | null,
	repository: Repository,
	remote: IRemote,
	backgroundTask: boolean,
	progressCallback?: (fetchProgress: IFetchProgress) => void
): Promise<void> {
	const retryAction: RetryAction = {
		type: RetryActionType.Fetch,
		repository: repository
	};
	await performFailableOperation(
		() => fetch(repository, account, remote, progressCallback),
		repository,
		{ backgroundTask, retryAction }
	);

	await updateRemoteHEAD(repository, account, remote);
}
