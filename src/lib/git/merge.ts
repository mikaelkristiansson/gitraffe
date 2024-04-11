import { join } from '@tauri-apps/api/path';

/**
 * Check the `.git/MERGE_HEAD` file exists in a repository to confirm
 * that it is in a conflicted state.
 */
export async function isMergeHeadSet(projectPath: string): Promise<boolean> {
	const path = join(projectPath, '.git', 'MERGE_HEAD');
	return Boolean(await path);
}

/**
 * Check the `.git/SQUASH_MSG` file exists in a repository
 * This would indicate we did a merge --squash and have not committed.. indicating
 * we have detected a conflict.
 *
 * Note: If we abort the merge, this doesn't get cleared automatically which
 * could lead to this being erroneously available in a non merge --squashing scenario.
 */
export async function isSquashMsgSet(projectPath: string): Promise<boolean> {
	const path = join(projectPath, '.git', 'SQUASH_MSG');
	return Boolean(await path);
}
