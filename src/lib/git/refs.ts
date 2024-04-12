import type { Repository } from '$lib/models/repository';
import { invoke } from '@tauri-apps/api/tauri';
import type { GitResponse } from './type';

/**
 * Read a symbolic ref from the repository.
 *
 * Symbolic refs are used to point to other refs, similar to how symlinks work
 * for files. Because refs can be removed easily from a Git repository,
 * symbolic refs should only be used when absolutely necessary.
 *
 * @param repository The repository to lookup
 * @param ref The symbolic ref to resolve
 *
 * @returns the canonical ref, if found, or `null` if `ref` cannot be found or
 *          is not a symbolic ref
 */
export async function getSymbolicRef(repository: Repository, ref: string): Promise<string | null> {
	// const result = await git(
	//   ['symbolic-ref', '-q', ref],
	//   repository.path,
	//   'getSymbolicRef',
	//   {
	//     //  - 1 is the exit code that Git throws in quiet mode when the ref is not a
	//     //    symbolic ref
	//     //  - 128 is the generic error code that Git returns when it can't find
	//     //    something
	//     successExitCodes: new Set([0, 1, 128]),
	//   }
	// )
	const { stdout }: GitResponse = await invoke('git', {
		path: repository.path,
		args: ['symbolic-ref', '-q', ref]
	});

	if (!stdout) {
		return null;
	}

	return stdout.trim();
}
