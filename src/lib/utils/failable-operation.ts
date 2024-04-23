import { ErrorWithMetadata, type IErrorMetadata } from '$lib/models/error-with-metadata';
import type { Repository } from '$lib/models/repository';
import { emit } from '@tauri-apps/api/event';

/**
 * Perform an operation that may fail by throwing an error. If an error is
 * thrown, catch it and emit it, and return `undefined`.
 *
 * @param errorMetadata - The metadata which should be attached to any errors
 *                        that are thrown.
 */
export async function performFailableOperation<T>(
	fn: () => Promise<T>,
	repository: Repository,
	errorMetadata?: IErrorMetadata
): Promise<T | undefined> {
	try {
		const result = await fn();
		return result;
	} catch (e) {
		const error = new ErrorWithMetadata(e as Error, {
			repository: repository,
			...errorMetadata
		});

		emit('did-error', error);
		return undefined;
	}
}
