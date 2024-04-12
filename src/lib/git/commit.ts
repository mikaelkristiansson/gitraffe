// import type { WorkingDirectoryFileChange } from '$lib/models/status';
import type { Repository } from '$lib/models/repository';
import type { WorkingDirectoryFileChange } from '$lib/models/status';
import { invoke } from '@tauri-apps/api/tauri';
import { unstageAll } from './reset';
import { stageFiles } from './update-index';
import type { GitResponse } from './type';

/**
 * @param repository repository to execute merge in
 * @param message commit message
 * @param files files to commit
 * @returns the commit SHA
 */
export async function createCommit(
	repository: Repository,
	message: string,
	files: ReadonlyArray<WorkingDirectoryFileChange>,
	amend: boolean = false
): Promise<string> {
	// Clear the staging area, our diffs reflect the difference between the
	// working directory and the last commit (if any) so our commits should
	// do the same thing.
	await unstageAll(repository);

	await stageFiles(repository, files);

	const args = ['-F', '-'];

	if (amend) {
		args.push('--amend');
	}

	// const result = await git(
	//   ['commit', ...args],
	//   repository.path,
	//   'createCommit',
	//   {
	//     stdin: message,
	//   }
	// )
	// const result: string = await invoke('git_commit', { path: repository.path, message });
	// args: ['commit', '-m', `"${message}"`]
	const { stdout }: GitResponse = await invoke('git', {
		path: repository.path,
		args: ['commit', ...args],
		stdin: message
	});
	console.log('🚀 ~ result:', stdout);
	return parseCommitSHA(stdout);
}

/**
 * Returns the SHA of the passed in IGitResult
 */
export function parseCommitSHA(result: string): string {
	return result.split(']')[0].split(' ')[1];
}
