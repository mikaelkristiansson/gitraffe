import { basename } from '@tauri-apps/api/path';

let CloningRepositoryID = 1;

/** A repository which is currently being cloned. */
export class CloningRepository {
	public readonly id = CloningRepositoryID++;

	public constructor(
		public readonly path: string,
		public readonly url: string
	) {}

	public get name(): Promise<string> {
		return (async () => {
			return await basename(this.url, '.git');
		})();
	}

	/**
	 * A hash of the properties of the object.
	 *
	 * Objects with the same hash are guaranteed to be structurally equal.
	 */
	public get hash(): string {
		return `${this.id}+${this.path}+${this.url}`;
	}
}
