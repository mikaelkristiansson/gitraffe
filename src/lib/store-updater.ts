import type { Branch } from './models/branch';
import type { Repository } from './models/repository';
import { activeBranch, workingBranch } from './stores/branch';
import { commitStore, loadLocalCommits } from './stores/commits';

export async function updateCurrentBranch(repository: Repository, branch: Branch) {
	try {
		activeBranch.setActive(branch);
		await workingBranch.setWorking(repository);
		const commits = await loadLocalCommits(repository, branch);
		const commitsSorted = commits.localCommitSHAs.slice().sort();
		const unsubscribeCommitStore = commitStore.subscribe((store) => {
			if (
				!(
					store.localCommitSHAs.length === commits.localCommitSHAs.length &&
					store.localCommitSHAs
						.slice()
						.sort()
						.every(function (value, index) {
							return value === commitsSorted[index];
						})
				)
			) {
				commitStore.set(commits);
			}
		});
		unsubscribeCommitStore();
		return true;
	} catch (error) {
		console.error(error);
		return false;
	}
}
