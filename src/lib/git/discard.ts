import type { Repository } from '$lib/models/repository';
import { AppFileStatusKind, type ChangedFile } from '$lib/models/status';
import { queueWorkHigh } from '$lib/utils/queue-work';
import { removeFile } from '@tauri-apps/api/fs';
import { resolve } from '@tauri-apps/api/path';
import { listSubmodules, resetSubmodulePaths } from './submodule';
import { IndexStatus, getIndexChanges } from './diff-index';
import { GitResetMode, resetPaths } from './reset';
import { checkoutIndex } from './checkout-index';
import { invoke } from '@tauri-apps/api/tauri';
import { performFailableOperation } from '$lib/utils/failable-operation';

export async function discardChanges(
	files: Array<ChangedFile>,
	repository: Repository,
	moveToTrash: boolean = true,
	askForConfirmationOnDiscardChangesPermanently: boolean = false
): Promise<void> {
	const pathsToCheckout = new Array<string>();
	const pathsToReset = new Array<string>();

	const submodules = await listSubmodules(repository);

	await queueWorkHigh(files, async (file) => {
		const foundSubmodule = submodules.some((s) => s.path === file.path);

		if (file.status.kind !== AppFileStatusKind.Deleted && !foundSubmodule && moveToTrash) {
			// N.B. moveItemToTrash can take a fair bit of time which is why we're
			// running it inside this work queue that spreads out the calls across
			// as many animation frames as it needs to.
			try {
				const filePath = await resolve(repository.path, file.path);
				await invoke('expand_scope', { folderPath: filePath });
				await removeFile(filePath);
			} catch (e) {
				if (askForConfirmationOnDiscardChangesPermanently) {
					console.error(e);
				}
				console.error(e);
			}
		}

		if (
			file.status.kind === AppFileStatusKind.Copied ||
			file.status.kind === AppFileStatusKind.Renamed
		) {
			// file.path is the "destination" or "new" file in a copy or rename.
			// we've already deleted it so all we need to do is make sure the
			// index forgets about it.
			pathsToReset.push(file.path);

			// checkout the old path too
			pathsToCheckout.push(file.status.oldPath);
			pathsToReset.push(file.status.oldPath);
		} else {
			pathsToCheckout.push(file.path);
			pathsToReset.push(file.path);
		}
	});

	// Check the index to see which files actually have changes there as compared to HEAD
	const changedFilesInIndex = await getIndexChanges(repository);

	// Only reset paths if they have changes in the index
	const necessaryPathsToReset = pathsToReset.filter((x) => changedFilesInIndex.has(x));

	const submodulePaths = pathsToCheckout.filter((p) => submodules.find((s) => s.path === p));

	// Don't attempt to checkout files that are submodules or don't exist in the index after our reset
	const necessaryPathsToCheckout = pathsToCheckout.filter(
		(x) => submodulePaths.indexOf(x) === -1 || changedFilesInIndex.get(x) !== IndexStatus.Added
	);

	// We're trying to not invoke git linearly with the number of files to discard
	// so we're doing our discards in three conceptual steps.
	//
	// 1. Figure out what the index thinks has changed as compared to the previous
	//    commit. For users who exclusive interact with Git using Desktop this will
	//    almost always empty which, as it turns out, is great for us.
	//
	// 2. Figure out if any of the files that we've been asked to discard are changed
	//    in the index and if so, reset them such that the index is set up just as
	//    the previous commit for the paths we're discarding.
	//
	// 3. Checkout all the files that we've discarded that existed in the previous
	//    commit from the index.
	await performFailableOperation(async () => {
		if (submodulePaths.length > 0) {
			await resetSubmodulePaths(repository, submodulePaths);
		}

		await resetPaths(repository, GitResetMode.Mixed, 'HEAD', necessaryPathsToReset);
		await checkoutIndex(repository, necessaryPathsToCheckout);
	}, repository);

	// We're done!
}
