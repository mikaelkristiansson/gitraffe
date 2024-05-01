import { writable } from 'svelte/store';
import { getBranchStatus, getCurrentBranchName } from '../git/cli';
import type { IStatusResult } from '../git/status';
import { getBranches } from '../git/branch';
import { type Branch } from '../models/branch';
import { findDefaultBranch } from '../utils/branch';
import type { Repository } from '../models/repository';

function createBranches() {
	const { subscribe, set, update } = writable([] as Array<Branch>);

	return {
		subscribe,
		set,
		fetch: async (
			repository: Repository,
			params: { defaultBranchUpstreamName: string; prevBranches?: Branch[] }
		) => {
			const { defaultBranchUpstreamName = 'HEAD', prevBranches } = params;
			fetchingBranches.set(true);
			try {
				const branches = await getBranches(repository, defaultBranchUpstreamName);
				if (
					prevBranches &&
					branches.length === prevBranches.length &&
					prevBranches.every((branch, index) => branch.name === branches[index].name)
					// JSON.stringify(branches) === JSON.stringify(prevBranches)
				) {
					return prevBranches;
				}
				allBranches.set(branches);
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
				return newBranches;
			});
			return updatedBranches;
		},
		add: (branch: Branch) => {
			update((branches) => {
				const newBranches = [...branches, branch];
				return newBranches;
			});
		},
		remove: (name: string) => {
			update((branches) => {
				const newBranches = branches.filter((branch) => branch.name !== name);
				return newBranches;
			});
		}
	};
}

function createActiveBranch() {
	const { subscribe, set } = writable(undefined as Branch | undefined);

	return {
		subscribe,
		set,
		setActive: (branch: Branch) => {
			set(branch);
			return branch;
		}
	};
}

function createWorkingBranch() {
	const { subscribe, set } = writable(null as IStatusResult | null);

	return {
		subscribe,
		set,
		setWorking: async (repository: Repository, prevWorkingBranch?: IStatusResult | null) => {
			try {
				const workingBranch = await getBranchStatus(repository);
				if (JSON.stringify(workingBranch) === JSON.stringify(prevWorkingBranch)) {
					return prevWorkingBranch;
				}
				set(workingBranch);
				return workingBranch;
			} catch (error) {
				console.error(error);
				throw error;
			}
		}
	};
}

function createDefautBranch() {
	const { subscribe, set } = writable(undefined as Branch | undefined);

	return {
		subscribe,
		set,
		setDefault: async (repository: Repository) => {
			const branch = await findDefaultBranch(repository, 'origin');
			if (!branch) {
				return;
			}
			if (branch.upstream) {
				branch.remoteExists = true;
			}
			set(branch);
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
