import type { Repository } from '$lib/models/repository';
import { git } from './cli';

/**
 * Retrieve the binary contents of a blob from the repository at a given
 * reference, commit, or tree.
 *
 * Returns a promise that will produce a Buffer instance containing
 * the binary contents of the blob or an error if the file doesn't
 * exists in the given revision.
 *
 * @param repository - The repository from where to read the blob
 *
 * @param commitish  - A commit SHA or some other identifier that
 *                     ultimately dereferences to a commit/tree.
 *
 * @param path       - The file path, relative to the repository
 *                     root from where to read the blob contents
 */
export async function getBlobContents(
	repository: Repository,
	commitish: string,
	path: string
): Promise<string> {
	const successExitCodes = new Set([0, 1]);
	// const setBinaryEncoding: (process: GitResponse) => void = cb => {
	//   // If Node.js encounters a synchronous runtime error while spawning
	//   // `stdout` will be undefined and the error will be emitted asynchronously
	//   if (cb.stdout) {
	//     cb.stdout.setEncoding('binary')
	//   }
	// }

	const args = ['show', `${commitish}:${path}`];
	const opts = {
		successExitCodes
		//   processCallback: setBinaryEncoding,
	};

	const blobContents = await git(repository.path, args, opts);

	return blobContents.stdout;

	// return Buffer.from(blobContents.stdout, 'binary')
}
