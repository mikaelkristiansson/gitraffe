import { writable } from 'svelte/store';
import { getBranchStatus, getCurrentBranchName } from './git/cli';
import type { IStatusResult } from './git/status';
import { getBranches } from './git/branch';
import type { Branch } from './models/branch';
import { findDefaultBranch } from './utils/branch';
import type { Repository } from './models/repository';
// import {setStorageItem } from './persisted';

function createBranches() {
	// const storedBranches = typeof localStorage !== 'undefined' ? localStorage?.branches : null;
	const { subscribe, set, update } = writable([] as Array<Branch>);

	return {
		subscribe,
		set,
		fetch: async (repository: Repository, defaultBranchUpstreamName: string = 'HEAD') => {
			fetchingBranches.set(true);
			try {
				const branches = await getBranches(repository, defaultBranchUpstreamName);
				allBranches.set(branches);
				// localStorage.setItem('branches', JSON.stringify(branches));
				// setStorageItem(`${repository.id}-branches`, branches);
				const currentBranchName = await getCurrentBranchName(repository.path);
				const currentBranch = branches.find(
					(branch) => branch.name === currentBranchName
				) as Branch;
				activeBranch.setActive(currentBranch);
				return branches;
			} catch (error) {
				console.error(error);
				throw error;
			} finally {
				fetchingBranches.set(false);
			}
		},
		updateBranch: (branch: Branch) => {
			let updatedBranches = null as Branch[] | null;
			update((branches) => {
				const newBranches = branches.map((b) => {
					if (b.name === branch.name) {
						return branch;
					}
					return b;
				});
				updatedBranches = newBranches;
				// setStorageItem(`${repository.id}-branches`, newBranches);
				return newBranches;
			});
			return updatedBranches;
		},
		add: (branch: Branch) => {
			update((branches) => {
				const newBranches = [...branches, branch];
				// localStorage.setItem('branches', JSON.stringify(newBranches));
				return newBranches;
			});
		},
		remove: (name: string) => {
			update((branches) => {
				const newBranches = branches.filter((branch) => branch.name !== name);
				// localStorage.setItem('branches', JSON.stringify(newBranches));
				return newBranches;
			});
		}
	};
}

function createActiveBranch() {
	// const storedActiveBranch =
	// 	typeof localStorage !== 'undefined' ? localStorage?.activeBranch : undefined;
	const { subscribe, set, update } = writable(undefined as Branch | undefined);

	return {
		subscribe,
		set,
		setActive: (branch: Branch) => {
			update(() => branch);
			// setStorageItem(`${repository.id}-activeBranch`, branch);
			return branch;
		}
	};
}

function createWorkingBranch() {
	const { subscribe, set, update } = writable(null as IStatusResult | null);

	return {
		subscribe,
		set,
		setWorking: async (repository: Repository) => {
			try {
				const workingBranch = await getBranchStatus(repository);
				update((prev) => {
					if (prev === null) {
						return workingBranch;
					}
					return {
						...prev,
						...workingBranch
					};
				});
				return workingBranch;
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	};
}

function createDefautBranch() {
	// const storedDefaultBranch =
	// 	typeof localStorage !== 'undefined' ? localStorage?.defaultBranch : null;
	const { subscribe, set, update } = writable(undefined as Branch | undefined);

	return {
		subscribe,
		set,
		setDefault: async (repository: Repository) => {
			const branch = await findDefaultBranch(repository, 'origin');
			if (!branch) {
				return;
			}
			update(() => branch);
			// localStorage.setItem('defaultBranch', JSON.stringify(branch));
			return branch;
		}
	};
}

export const allBranches = createBranches();
export const fetchingBranches = writable(false);
export const activeBranch = createActiveBranch();
export const workingBranch = createWorkingBranch();
export const defaultBranch = createDefautBranch();
export const lastSynced = writable(new Date());
