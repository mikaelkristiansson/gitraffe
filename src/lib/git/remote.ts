import { IGitError } from '$lib/models/git-errors';
import type { IRemote } from '$lib/models/remote';
import type { Repository } from '$lib/models/repository';
import { git } from './cli';
import { getSymbolicRef } from './refs';

/**
 * List the remotes, sorted alphabetically by `name`, for a repository.
 */
export async function getRemotes(repository: Repository): Promise<ReadonlyArray<IRemote>> {
	const result = await git(repository.path, ['remote', '-v'], {
		expectedErrors: new Set([IGitError.NotAGitRepository])
	});

	if (result.gitError === IGitError.NotAGitRepository) {
		return [];
	}

	const output = result.stdout;
	const lines = output.split('\n');
	const remotes = lines
		.filter((x) => /\(fetch\)( \[.+\])?$/.test(x))
		.map((x) => x.split(/\s+/))
		.map((x) => ({ name: x[0], url: x[1] }));

	return remotes;
}

/** Add a new remote with the given URL. */
export async function addRemote(
	repository: Repository,
	name: string,
	url: string
): Promise<IRemote> {
	await git(repository.path, ['remote', 'add', name, url]);

	return { url, name };
}

/** Removes an existing remote, or silently errors if it doesn't exist */
export async function removeRemote(repository: Repository, name: string): Promise<void> {
	await git(repository.path, ['remote', 'remove', name]);
}

/** Changes the URL for the remote that matches the given name  */
export async function setRemoteURL(
	repository: Repository,
	name: string,
	url: string
): Promise<true> {
	await git(repository.path, ['remote', 'set-url', name, url]);
	return true;
}

/**
 * Get the URL for the remote that matches the given name.
 *
 * Returns null if the remote could not be found
 */
export async function getRemoteURL(repository: Repository, name: string): Promise<string | null> {
	const result = await git(repository.path, ['remote', 'get-url', name]);

	if (result.status !== 0) {
		return null;
	}

	return result.stdout;
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
