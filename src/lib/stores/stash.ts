import type { IStashEntry } from '$lib/models/stash-entry';
import { getStorageItem, setStorageItem } from '$lib/persisted';
import { writable } from 'svelte/store';

//identifier = repository.id + '_' + branch.name

const setStashStore = () => {
	const storedStashes = getStorageItem('stashes') || {};
	const { subscribe, set, update } = writable(storedStashes as { [key: string]: IStashEntry });

	return {
		subscribe,
		set,
		update,
		setNewStash: (entry: IStashEntry, identifier: string) => {
			update((prev) => {
				const newStashes = { ...prev, [identifier]: entry };
				setStorageItem('stashes', newStashes);
				return newStashes;
			});
		},
		removeStash: (identifier: string) => {
			update((prev) => {
				const newStashes = { ...prev };
				delete newStashes[identifier];
				setStorageItem('stashes', newStashes);
				return newStashes;
			});
		}
	};
};

export const stashStore = setStashStore();
// export const stashStore = writable<IStashEntry | null>(null);
