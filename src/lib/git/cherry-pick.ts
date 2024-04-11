import { join } from '@tauri-apps/api/path';

/**
 * Check if the `.git/CHERRY_PICK_HEAD` file exists
 */
export async function isCherryPickHeadFound(projectPath: string): Promise<boolean> {
	try {
		const cherryPickHeadPath = join(projectPath, '.git', 'CHERRY_PICK_HEAD');
		return Boolean(cherryPickHeadPath);
	} catch (err) {
		console.warn(
			`[cherryPick] a problem was encountered reading .git/CHERRY_PICK_HEAD,
         so it is unsafe to continue cherry-picking`,
			err
		);
		return false;
	}
}
