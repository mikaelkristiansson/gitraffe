import { get, writable, type Writable } from 'svelte/store';

const SETTINGS_KEY = 'settings-json';
export const SETTINGS_CONTEXT = Symbol();

export interface Settings {
	theme?: string;
}

const defaults: Settings = {};

export type SettingsStore = Writable<Settings>;

export function loadUserSettings(): Writable<Settings> {
	let obj: object;
	try {
		obj = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '');
	} catch {
		obj = {};
	}

	const store = writable<Settings>({ ...defaults, ...obj });
	return {
		subscribe: store.subscribe,
		set: store.set,
		update: (updater) => {
			store.update(updater);
			localStorage.setItem(SETTINGS_KEY, JSON.stringify(get(store)));
		}
	};
}
