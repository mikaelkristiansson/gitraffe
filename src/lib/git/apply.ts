import { assertNever } from '$lib/fatal-error';
import { DiffType } from '$lib/models/diff';
import { AppFileStatusKind, WorkingDirectoryFileChange } from '$lib/models/status';
import type { Project } from '$lib/projects';
import { invoke } from '@tauri-apps/api/tauri';
import { getWorkingDirectoryDiff } from './diff';

export async function applyPatchToIndex(
	repository: Project,
	file: WorkingDirectoryFileChange
): Promise<void> {
	// If the file was a rename we have to recreate that rename since we've
	// just blown away the index. Think of this block of weird looking commands
	// as running `git mv`.
	if (file.status.kind === AppFileStatusKind.Renamed) {
		// Make sure the index knows of the removed file. We could use
		// update-index --force-remove here but we're not since it's
		// possible that someone staged a rename and then recreated the
		// original file and we don't have any guarantees for in which order
		// partial stages vs full-file stages happen. By using git add the
		// worst that could happen is that we re-stage a file already staged
		// by updateIndex.
		//   await git(
		//     ['add', '--u', '--', file.status.oldPath],
		//     repository.path,
		//     'applyPatchToIndex'
		//   )
		await invoke('git', { path: repository.path, args: ['add', '--u', '--', file.status.oldPath] });

		// Figure out the blob oid of the removed file
		// <mode> SP <type> SP <object> TAB <file>
		//   const oldFile = await git(
		//     ['ls-tree', 'HEAD', '--', file.status.oldPath],
		//     repository.path,
		//     'applyPatchToIndex'
		//   )
		const oldFile: string = await invoke('git', {
			path: repository.path,
			args: ['ls-tree', 'HEAD', '--', file.status.oldPath]
		});

		const [info] = oldFile.split('\t', 1);
		const [mode, , oid] = info.split(' ', 3);

		// Add the old file blob to the index under the new name
		//   await git(
		//     ['update-index', '--add', '--cacheinfo', mode, oid, file.path],
		//     repository.path,
		//     'applyPatchToIndex'
		//   )
		await invoke('git', {
			path: repository.path,
			args: ['update-index', '--add', '--cacheinfo', mode, oid, file.path]
		});
	}

	const applyArgs: string[] = ['apply', '--cached', '--unidiff-zero', '--whitespace=nowarn', '-'];

	const diff = await getWorkingDirectoryDiff(repository, file);

	if (diff.kind !== DiffType.Text && diff.kind !== DiffType.LargeText) {
		const { kind } = diff;
		switch (diff.kind) {
			case DiffType.Binary:
			case DiffType.Submodule:
			case DiffType.Image:
				throw new Error(`Can't create partial commit in binary file: ${file.path}`);
			case DiffType.Unrenderable:
				throw new Error(`File diff is too large to generate a partial commit: ${file.path}`);
			default:
				assertNever(diff, `Unknown diff kind: ${kind}`);
		}
	}

	// const patch = await formatPatch(file, diff)
	// await git(applyArgs, repository.path, 'applyPatchToIndex', { stdin: patch })
	await invoke('git', { path: repository.path, args: applyArgs });

	return Promise.resolve();
}
