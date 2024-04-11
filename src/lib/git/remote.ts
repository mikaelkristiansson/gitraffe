import type { Repository } from '$lib/models/repository';
import { getSymbolicRef } from './refs';

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
