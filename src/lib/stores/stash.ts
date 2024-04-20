import type { IStashEntry } from '$lib/models/stash-entry';
import { writable } from 'svelte/store';

export const stashStore = writable<IStashEntry | null>(null);
