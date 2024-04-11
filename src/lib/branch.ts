import { writable } from 'svelte/store';
// import type { DefaultBranch } from './types';
import { getBranchStatus, getCurrentBranchName } from './git/cli';
import type { IStatusResult } from './git/status';
// import type { Project } from './projects';
import { getBranches } from './git/branch';
import type { Branch } from './models/branch';
import { findDefaultBranch } from './utils/branch';
import type { Repository } from './models/repository';

function createBranches() {
	const storedBranches = typeof localStorage !== 'undefined' ? localStorage?.branches : null;
	const { subscribe, set, update } = writable(
		((storedBranches && JSON.parse(storedBranches)) || []) as Array<Branch>
	);

	return {
		subscribe,
		set,
		fetch: async (repository: Repository) => {
			fetchingBranches.set(true);
			const branches = await getBranches(repository);
			allBranches.set(branches);
			localStorage.setItem('branches', JSON.stringify(branches));
			const currentBranchName = await getCurrentBranchName(repository.path);
			const currentBranch = branches.find((branch) => branch.name === currentBranchName) as Branch;
			activeBranch.setActive(currentBranch);
			// await checkout(project.path, currentBranch.name);
			localStorage.setItem('activeBranch', JSON.stringify(currentBranch));
			fetchingBranches.set(false);
			return branches;
		},
		// fetch: async (path: string) => {
		// 	const strings = await getBranches(path);
		// 	const currentIndex = strings.findIndex((branch) => branch.trim().charAt(0) === '*');
		// 	const branchesWithData = strings.map((str, index) => {
		// 		const branch = str.replace('*', '').trim();
		// 		const name = branch.match(/^([\S]+)/g)?.[0] ?? '';
		// 		const description = branch.replace(name, '').trim();
		// 		if (name.indexOf('HEAD') > -1 || name === '') return;
		// 		const sha = description?.match(/^([\w-]+)/g);
		// 		const aheadBehind = description?.match(/\[[^\]]+\]/g);
		// 		const behind = aheadBehind ? aheadBehind[0].match(/behind (\d+)/) : 0;
		// 		const ahead = aheadBehind ? aheadBehind[0].match(/ahead (\d+)/) : 0;
		// 		const commit = description
		// 			? description
		// 					.replace(sha ? sha[0] : '', '')
		// 					.replace(aheadBehind ? aheadBehind[0] : '', '')
		// 			: '';
		// 		const branchObj: Branch = {
		// 			current: index === currentIndex,
		// 			name: name.trim(),
		// 			sha: sha ? sha[0] : '',
		// 			commit: commit,
		// 			ahead: typeof ahead === 'object' ? (ahead ? Number(ahead[1]) : 0) : ahead,
		// 			behind: typeof behind === 'object' ? (behind ? Number(behind[1]) : 0) : behind
		// 		};
		// 		return branchObj;
		// 	});
		// 	const branches = branchesWithData.filter(Boolean) as Branch[];
		// 	allBranches.set(branches);
		// 	localStorage.setItem('branches', JSON.stringify(branches));
		// 	const currentBranch = branches[currentIndex];
		// 	activeBranch.setActive(currentBranch);
		// 	await checkout(path, currentBranch.name);
		// 	localStorage.setItem('activeBranch', JSON.stringify(currentBranch));
		// 	return branches;
		// },
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
				localStorage.setItem('branches', JSON.stringify(newBranches));
				return newBranches;
			});
			return updatedBranches;
		},
		add: (branch: Branch) => {
			update((branches) => {
				const newBranches = [...branches, branch];
				localStorage.setItem('branches', JSON.stringify(newBranches));
				return newBranches;
			});
		},
		remove: (name: string) => {
			update((branches) => {
				const newBranches = branches.filter((branch) => branch.name !== name);
				localStorage.setItem('branches', JSON.stringify(newBranches));
				return newBranches;
			});
		}
	};
}

function createActiveBranch() {
	const storedActiveBranch =
		typeof localStorage !== 'undefined' ? localStorage?.activeBranch : undefined;
	const { subscribe, set, update } = writable(
		((storedActiveBranch && JSON.parse(storedActiveBranch)) || undefined) as Branch
	);

	return {
		subscribe,
		set,
		setActive: (branch: Branch) => {
			update(() => branch);
			localStorage.setItem('activeBranch', JSON.stringify(branch));
			return branch;
		}
	};
}

function createWorkingBranch() {
	const storedWorkingBranch =
		typeof localStorage !== 'undefined' ? localStorage?.workingBranch : null;
	const { subscribe, set, update } = writable(
		((storedWorkingBranch && JSON.parse(storedWorkingBranch)) || null) as IStatusResult
	);

	return {
		subscribe,
		set,
		setWorking: async (path: string) => {
			const workingBranch = await getBranchStatus(path);
			update((prev) => ({
				...prev,
				...workingBranch
			}));
			localStorage.setItem('workingBranch', JSON.stringify(workingBranch));
			return workingBranch;
		}
	};
}

function createDefautBranch() {
	const storedDefaultBranch =
		typeof localStorage !== 'undefined' ? localStorage?.defaultBranch : null;
	const { subscribe, set, update } = writable(
		((storedDefaultBranch && JSON.parse(storedDefaultBranch)) || null) as Branch
	);

	return {
		subscribe,
		set,
		setDefault: async (repository: Repository, branches: Branch[]) => {
			const branch = await findDefaultBranch(repository, branches, 'origin');
			if (!branch) {
				return;
			}
			update(() => branch);
			localStorage.setItem('defaultBranch', JSON.stringify(branch));
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
