import { getCaptures } from '$lib/utils/regex';
import { invoke } from '@tauri-apps/api/tauri';

/**
 * Returns a list of files with conflict markers present
 *
 * @param repositoryPath filepath to repository
 * @returns filepaths with their number of conflicted markers
 */
export async function getFilesWithConflictMarkers(path: string): Promise<Map<string, number>> {
	// // git operation
	// const args = ['diff', '--check']
	// const { output } = await spawnAndComplete(
	//   args,
	//   repositoryPath,
	//   'getFilesWithConflictMarkers',
	//   new Set([0, 2])
	// )

	// // result parsing
	// const outputStr = output.toString('utf8')
	const outputStr: string = await invoke('git_diff', { path });
	const captures = getCaptures(outputStr, fileNameCaptureRe);
	if (captures.length === 0) {
		return new Map<string, number>();
	}
	// flatten the list (only does one level deep)
	const flatCaptures = captures.reduce((acc, val) => acc.concat(val));
	// count number of occurrences
	const counted = flatCaptures.reduce(
		(acc, val) => acc.set(val, (acc.get(val) || 0) + 1),
		new Map<string, number>()
	);
	return counted;
}

/**
 * matches a line reporting a leftover conflict marker
 * and captures the name of the file
 */
const fileNameCaptureRe = /(.+):\d+: leftover conflict marker/gi;
