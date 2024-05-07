import { platform } from '@tauri-apps/plugin-os';
import { normalize as pathNormalize } from '@tauri-apps/api/path';
import type { Repository } from '$lib/models/repository';
import type { CloningRepository } from '$lib/models/cloning-repository';

/**
 * Find an existing repository associated with this path
 *
 * @param repos The list of repositories tracked in the app
 * @param path The path on disk which might be a repository
 */
export async function matchExistingRepository<T extends Repository | CloningRepository>(
	repos: ReadonlyArray<T>,
	path: string
): Promise<T | undefined> {
	const platformName = await platform();
	// Windows is guaranteed to be case-insensitive so we can be a bit less strict
	const normalize =
		platformName === 'win32'
			? async (p: string) => (await pathNormalize(p)).toLowerCase()
			: async (p: string) => await pathNormalize(p);

	const needle = normalize(path);
	return repos.find((r) => normalize(r.path) === needle);
}
