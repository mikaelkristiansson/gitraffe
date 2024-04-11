import type { Repository } from '$lib/models/repository';
import { invoke } from '@tauri-apps/api/tauri';

/** Unstage all paths. */
export async function unstageAll(repository: Repository): Promise<true> {
	await invoke('git_reset_all', { path: repository.path });
	return true;
}
