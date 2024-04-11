import type { Project } from '$lib/projects';
import { invoke } from '@tauri-apps/api/tauri';

/** Unstage all paths. */
export async function unstageAll(repository: Project): Promise<true> {
	await invoke('git_reset_all', { path: repository.path });
	return true;
}
