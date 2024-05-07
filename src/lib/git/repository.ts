import { exists } from '@tauri-apps/plugin-fs';
import { resolve } from '@tauri-apps/api/path';
import { git } from './cli';

export type RepositoryType =
	| { kind: 'bare' }
	| { kind: 'regular'; topLevelWorkingDirectory: string }
	| { kind: 'missing' }
	| { kind: 'unsafe'; path: string };
/**
 * Attempts to fulfill the work of isGitRepository and isBareRepository while
 * requiring only one Git process to be spawned.
 *
 * Returns 'bare', 'regular', or 'missing' if the repository couldn't be
 * found.
 */
export async function getRepositoryType(path: string): Promise<RepositoryType> {
	if (!(await exists(path))) {
		return { kind: 'missing' };
	}

	try {
		//   const result = await git(
		//     ['rev-parse', '--is-bare-repository', '--show-cdup'],
		//     path,
		//     'getRepositoryType',
		//     { successExitCodes: new Set([0, 128]) }
		//   )
		const { stdout, exitCode } = await git(
			path,
			['rev-parse', '--is-bare-repository', '--show-cdup'],
			{ successExitCodes: new Set([0, 128]) }
		);

		if (exitCode === 0) {
			const [isBare, cdup] = stdout.split('\n', 2);

			return isBare === 'true'
				? { kind: 'bare' }
				: { kind: 'regular', topLevelWorkingDirectory: await resolve(path, cdup) };
		}

		const unsafeMatch = /fatal: detected dubious ownership in repository at '(.+)'/.exec(stdout);
		if (unsafeMatch) {
			return { kind: 'unsafe', path: unsafeMatch[1] };
		}

		return { kind: 'missing' };
	} catch (err) {
		const error = err as {
			code: string;
		};
		// This could theoretically mean that the Git executable didn't exist but
		// in reality it's almost always going to be that the process couldn't be
		// launched inside of `path` meaning it didn't exist. This would constitute
		// a race condition given that we stat the path before executing Git.
		if (error.code === 'ENOENT') {
			return { kind: 'missing' };
		}
		throw err;
	}
}
