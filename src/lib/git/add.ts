import type { WorkingDirectoryFileChange } from '$lib/models/status';
import type { Project } from '$lib/projects';
import { invoke } from '@tauri-apps/api/tauri';

export async function gitAddFiles(
	repository: Project,
	files: ReadonlyArray<WorkingDirectoryFileChange>
) {
	const args = ['add'];
	files.forEach((f) => args.push(f.path));
	console.log('🚀 ~ args:', args);
	return await invoke('git', { path: repository.path, args });
}
