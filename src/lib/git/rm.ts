import type { Repository } from '$lib/models/repository';
import { git } from './cli';

/**
 * Remove all files from the index
 *
 * @param repository the repository to update
 */
export async function unstageAllFiles(repository: Repository): Promise<void> {
	await git(
		repository.path,
		// these flags are important:
		// --cached to only remove files from the index
		// -r       to recursively remove files, in case files are in folders
		// -f       to ignore differences between working directory and index
		//          which will block this
		['rm', '--cached', '-r', '-f', '.']
	);
}
