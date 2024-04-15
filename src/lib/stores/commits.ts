import { getCommits } from '$lib/git/log';
import type { Branch } from '$lib/models/branch';
import type { Commit } from '$lib/models/commit';
import type { Repository } from '$lib/models/repository';
import { writable } from 'svelte/store';

export interface CommitStore {
	localCommitSHAs: string[];
	localCommits: ReadonlyArray<Commit>;
	lastFetched: string;
}

/**
 * Convert two refs into the Git range syntax representing the set of commits
 * that are reachable from `to` but excluding those that are reachable from
 * `from`. This will not be inclusive to the `from` ref, see
 * `revRangeInclusive`.
 *
 * Each parameter can be the commit SHA or a ref name, or specify an empty
 * string to represent HEAD.
 *
 * @param from The start of the range
 * @param to The end of the range
 */
export function revRange(from: string, to: string) {
	return `${from}..${to}`;
}

/** The number of commits to load from history per batch. */
const CommitBatchSize = 100;

export async function loadLocalCommits(
	repository: Repository,
	branch: Branch | null
): Promise<void> {
	if (branch === null) {
		return;
	}

	let localCommits: ReadonlyArray<Commit> | undefined;
	if (branch.upstream) {
		const range = revRange(branch.upstream, branch.name);
		localCommits = await getCommits(repository, range, CommitBatchSize);
	} else {
		localCommits = await getCommits(repository, 'HEAD', CommitBatchSize, undefined, [
			'--not',
			'--remotes'
		]);
	}

	if (!localCommits) {
		return;
	}

	const localCommitSHAs = localCommits.map((c) => c.sha);
	commitStore.subscribe((store) => {
		if (store.localCommitSHAs.length === localCommitSHAs.length) {
			const hasNewCommits = localCommitSHAs.some(
				(sha, index) => store.localCommitSHAs[index] !== sha
			);
			if (!hasNewCommits) {
				return;
			}
		}

		commitStore.set({
			localCommits: localCommits as ReadonlyArray<Commit>,
			localCommitSHAs,
			lastFetched: new Date().toISOString()
		});
	});
}

function setCommitsStore() {
	const { subscribe, set, update } = writable<CommitStore>({
		localCommitSHAs: [],
		localCommits: [],
		lastFetched: ''
	});

	return {
		subscribe,
		set,
		updateLastFetched: (lastFetched: string) => {
			update((store) => {
				store.lastFetched = lastFetched;
				return store;
			});
		},
		updateLocalCommits: (localCommits: ReadonlyArray<Commit>) => {
			update((store) => {
				store.localCommits = localCommits;
				return store;
			});
		},
		updateLocalCommitSHAs: (localCommitSHAs: string[]) => {
			update((store) => {
				store.localCommitSHAs = localCommitSHAs;
				return store;
			});
		}
	};
}

export const commitStore = setCommitsStore();
