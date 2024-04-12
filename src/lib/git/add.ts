import type { Repository } from '$lib/models/repository';
import type { WorkingDirectoryFileChange } from '$lib/models/status';
import { invoke } from '@tauri-apps/api/tauri';

export async function gitAddFiles(
	repository: Repository,
	files: ReadonlyArray<WorkingDirectoryFileChange>
) {
	const args = ['add'];
	files.forEach((f) => args.push(f.path));
	return await invoke('git', { path: repository.path, args });
}
