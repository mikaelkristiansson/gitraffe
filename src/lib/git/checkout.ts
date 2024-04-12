import type { Repository } from '$lib/models/repository';
import { git } from './cli';

/** Check out the paths at HEAD. */
export async function checkoutPaths(
	repository: Repository,
	paths: ReadonlyArray<string>
): Promise<void> {
	await git(repository.path, ['checkout', 'HEAD', '--', ...paths]);
}
