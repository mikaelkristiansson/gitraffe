import type { Repository } from '$lib/models/repository';
import { invoke } from '@tauri-apps/api/tauri';
import { git } from './cli';
import { homeDir } from '@tauri-apps/api/path';

/**
 * Look up a config value by name in the repository.
 *
 * @param onlyLocal Whether or not the value to be retrieved should stick to
 *                  the local repository settings. It is false by default. This
 *                  is equivalent to using the `--local` argument in the
 *                  `git config` invocation.
 */
export function getConfigValue(
	repository: Repository,
	name: string,
	onlyLocal: boolean = false
): Promise<string | null> {
	return getConfigValueInPath(name, repository.path, onlyLocal);
}

/**
 * Set config value by name
 *
 * @param path The path to execute the `git` command in. If null
 *             we'll use the global configuration (i.e. --global)
 *             and execute the Git call from the same location that
 *             GitHub Desktop is installed in.
 */
async function setConfigValueInPath(
	name: string,
	value: string,
	path: string | null
	// env?: {
	//   HOME: string
	// }
): Promise<void> {
	// const options = env ? { env } : undefined

	const flags = ['config'];

	if (!path) {
		flags.push('--global');
	}

	flags.push('--replace-all', name, value);

	// await git(flags, path || __dirname, 'setConfigValueInPath', options)
	await invoke('git', { path: path, args: flags });
}

/**
 * Look up a config value by name
 *
 * @param path      The path to execute the `git` command in. If null
 *                  we'll use the global configuration (i.e. --global)
 *                  and execute the Git call from the same location that
 *                  GitHub Desktop is installed in.
 * @param onlyLocal Whether or not the value to be retrieved should stick to
 *                  the local repository settings (if a path is specified). It
 *                  is false by default. It is equivalent to using the `--local`
 *                  argument in the `git config` invocation.
 * @param type      Canonicalize configuration values according to the
 *                  expected type (i.e. 0 -> false, "on" -> true etc).
 *                  See `--type` documentation in `git config`
 */
async function getConfigValueInPath(
	name: string,
	path: string | null,
	onlyLocal: boolean = false,
	type?: 'bool' | 'int' | 'bool-or-int' | 'path' | 'expiry-date' | 'color'
	// env?: {
	//   HOME: string
	// }
): Promise<string | null> {
	const flags = ['config', '-z'];
	if (!path) {
		flags.push('--global');
	} else if (onlyLocal) {
		flags.push('--local');
	}

	if (type !== undefined) {
		flags.push('--type', type);
	}

	flags.push(name);

	const homeDirPath = await homeDir();

	const result = await git(path || homeDirPath, flags, {
		successExitCodes: new Set([0, 1])
		//   env,
	});
	// const { stdout }: GitResponse = await invoke('git', { path: path, args: flags });

	// Git exits with 1 if the value isn't found. That's OK.
	if (result.exitCode === 1) {
		return null;
	}

	const pieces = result.stdout.split('\0');
	return pieces[0];
}

/** Look up a global config value by name. */
export function getGlobalConfigValue(
	name: string,
	path: string | null
	// env?: {
	//   HOME: string
	// }
): Promise<string | null> {
	return getConfigValueInPath(name, path, false, undefined);
}

/** Set the global config value by name. */
export async function setGlobalConfigValue(
	name: string,
	value: string
	// env?: {
	//   HOME: string
	// }
): Promise<void> {
	return setConfigValueInPath(name, value, null);
}
