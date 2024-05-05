import { git, gitNetworkArguments } from '$lib/git/cli';
import { envForRemoteOperation } from '$lib/git/environment';
import { getSymbolicRef } from '$lib/git/refs';
import type { IGitAccount } from './git-account';
import type { Repository } from './repository';

/**
 * This is the magic remote name prefix
 * for when we add a remote on behalf of
 * the user.
 */
export const ForkedRemotePrefix = 'gitraffe-';

/** The name for a fork's upstream remote. */
export const UpstreamRemoteName = 'upstream';

export function forkPullRequestRemoteName(remoteName: string) {
	return `${ForkedRemotePrefix}${remoteName}`;
}

/** A remote as defined in Git. */
export interface IRemote {
	readonly name: string;
	readonly url: string;
}

/**
 * Gets a value indicating whether two remotes can be considered
 * structurally equivalent to each other.
 */
export function remoteEquals(x: IRemote | null, y: IRemote | null) {
	if (x === y) {
		return true;
	}

	if (x === null || y === null) {
		return false;
	}

	return x.name === y.name && x.url === y.url;
}

/**
 * Update the HEAD ref of the remote, which is the default branch.
 */
export async function updateRemoteHEAD(
	repository: Repository,
	account: IGitAccount | null,
	remote: IRemote
): Promise<void> {
	const options = {
		successExitCodes: new Set([0, 1, 128]),
		env: await envForRemoteOperation(account, remote.url)
	};

	await git(
		repository.path,
		[...gitNetworkArguments(), 'remote', 'set-head', '-a', remote.name],
		options
	);
}

export async function getRemoteHEAD(
	repository: Repository,
	remote: string
): Promise<string | null> {
	const remoteNamespace = `refs/remotes/${remote}/`;
	const match = await getSymbolicRef(repository, `${remoteNamespace}HEAD`);
	if (match != null && match.length > remoteNamespace.length && match.startsWith(remoteNamespace)) {
		// strip out everything related to the remote because this
		// is likely to be a tracked branch locally
		// e.g. `main`, `develop`, etc
		return match.substring(remoteNamespace.length);
	}

	return null;
}
