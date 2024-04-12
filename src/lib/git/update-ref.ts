import type { Repository } from '$lib/models/repository';
import { git } from './cli';

/**
 * Remove a ref.
 *
 * @param repository - The repository in which the ref exists.
 * @param ref        - The ref to remove. Should be fully qualified, but may also be 'HEAD'.
 * @param reason     - The reflog entry (optional). Note that this is only useful when
 *                     deleting the HEAD reference as deleting any other reference will
 *                     implicitly delete the reflog file for that reference as well.
 */
export async function deleteRef(repository: Repository, ref: string, reason?: string) {
	const args = ['update-ref', '-d', ref];

	if (reason !== undefined) {
		args.push('-m', reason);
	}

	await git(repository.path, args);
}
