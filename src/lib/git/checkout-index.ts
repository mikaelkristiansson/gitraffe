import type { Repository } from '$lib/models/repository';
import { git } from './cli';

/**
 * Forcefully updates the working directory with information from the index
 * for a given set of files.
 *
 * This method is essentially the same as running `git checkout -- files`
 * except by using `checkout-index` we can pass the files we want updated
 * on stdin, avoiding all issues with too long arguments.
 *
 * Note that this function will not yield errors for paths that don't
 * exist in the index (-q).
 *
 * @param repository The repository in which to update the working directory
 *                   with information from the index
 *
 * @param paths      The relative paths in the working directory to update
 *                   with information from the index.
 */
export async function checkoutIndex(repository: Repository, paths: ReadonlyArray<string>) {
	if (!paths.length) {
		return;
	}

	const options = {
		successExitCodes: new Set([0, 1]),
		stdin: paths.join('\0')
	};

	await git(repository.path, ['checkout-index', '-f', '-u', '-q', '--stdin', '-z'], options);
}
