import { invoke } from '@tauri-apps/api/tauri';
import { getStatus, type IStatusResult } from './status';
import type { GitResponse } from './type';
import type { Branch } from '$lib/models/branch';
import type { Repository } from '$lib/models/repository';

export async function git(path: string, args: string[], stdin?: string): Promise<GitResponse> {
	return await invoke('git', { path, args, stdin });
}

export async function fetchAll(path: string): Promise<string> {
	const args = ['fetch', '--all'];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function checkout(path: string, branch: string): Promise<string> {
	const args = ['checkout', branch];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function pullOrigin(path: string, branchName: Branch['name']): Promise<string> {
	const args = ['pull', 'origin', branchName];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function push(path: string): Promise<string> {
	const args = ['push'];
	const { stderr, stdout } = await git(path, args);
	if (stderr) {
		throw new Error(stderr);
	}
	return stdout;
}

export async function getBranchStatus(repository: Repository): Promise<IStatusResult | null> {
	return await getStatus(repository);
}

export async function getCurrentBranchName(path: string): Promise<string> {
	const { stdout }: GitResponse = await invoke('git', {
		path,
		args: ['symbolic-ref', '--short', 'HEAD']
	});
	return stdout.trim();
}

export class GitError extends Error {
	/** The result from the failed command. */
	public readonly result: GitResponse;

	/** The args for the failed command. */
	public readonly args: ReadonlyArray<string>;

	/**
	 * Whether or not the error message is just the raw output of the git command.
	 */
	public readonly isRawMessage: boolean;

	public constructor(result: GitResponse, args: ReadonlyArray<string>) {
		let rawMessage = true;
		let message;

		if (result.stderr.length) {
			message = result.stderr;
		} else if (result.stdout.length) {
			message = result.stdout;
		} else {
			message = 'Unknown error';
			rawMessage = false;
		}

		super(message);

		this.name = 'GitError';
		this.result = result;
		this.args = args;
		this.isRawMessage = rawMessage;
	}
}

/**
 * An extension of the execution options in dugite that
 * allows us to piggy-back our own configuration options in the
 * same object.
 */
export interface IGitExecutionOptions {
	/**
	 * The exit codes which indicate success to the
	 * caller. Unexpected exit codes will be logged and an
	 * error thrown. Defaults to 0 if undefined.
	 */
	readonly successExitCodes?: ReadonlySet<number>;

	/**
	 * The git errors which are expected by the caller. Unexpected errors will
	 * be logged and an error thrown.
	 */
	readonly expectedErrors?: ReadonlySet<string[]>;

	/** Should it track & report LFS progress? */
	readonly trackLFSProgress?: boolean;
}

/**
 * Return an array of command line arguments for network operation that override
 * the default git configuration values provided by local, global, or system
 * level git configs.
 *
 * These arguments should be inserted before the subcommand, i.e in the case of
 * `git pull` these arguments needs to go before the `pull` argument.
 */
export const gitNetworkArguments = () => [
	// Explicitly unset any defined credential helper, we rely on our
	// own askpass for authentication.
	'-c',
	'credential.helper='
];
