import type { RebaseInternalState } from '$lib/models/rebase';
import { readTextFile, exists } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

/**
 * Get the internal state about the rebase being performed on a repository. This
 * information is required to help Desktop display information to the user
 * about the current action as well as the options available.
 *
 * Returns `null` if no rebase is detected, or if the expected information
 * cannot be found in the repository.
 */
export async function getRebaseInternalState(
	projectPath: string
): Promise<RebaseInternalState | null> {
	const isRebase = await isRebaseHeadSet(projectPath);

	if (!isRebase) {
		return null;
	}

	let originalBranchTip: string | null = null;
	let targetBranch: string | null = null;
	let baseBranchTip: string | null = null;

	try {
		const filePath = await join(projectPath, '.git', 'rebase-merge', 'orig-head');
		const pathExists = await exists(filePath);
		if (pathExists) {
			invoke('expand_scope', { folderPath: `${projectPath}/.git/rebase-merge` });
			originalBranchTip = await readTextFile(filePath);

			originalBranchTip = originalBranchTip && originalBranchTip.trim();

			targetBranch = await readTextFile(
				await join(projectPath, '.git', 'rebase-merge', 'head-name')
			);

			if (targetBranch?.startsWith('refs/heads/')) {
				targetBranch = targetBranch.substring(11).trim();
			}

			baseBranchTip = await readTextFile(await join(projectPath, '.git', 'rebase-merge', 'onto'));

			baseBranchTip = baseBranchTip && baseBranchTip.trim();
		}
	} catch {
		// ignore any errors reading the rebase state
	}

	if (originalBranchTip != null && targetBranch != null && baseBranchTip != null) {
		return { originalBranchTip, targetBranch, baseBranchTip };
	}

	// unable to resolve the rebase state of this repository

	return null;
}

/**
 * Check the `.git/REBASE_HEAD` file exists in a repository to confirm
 * a rebase operation is underway.
 */
async function isRebaseHeadSet(projectPath: string): Promise<boolean> {
	const path = join(projectPath, '.git', 'REBASE_HEAD');
	return Boolean(await path);
}
