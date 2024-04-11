import { Branch, BranchType, type IBranchTip } from '$lib/models/branch';
import { CommitIdentity } from '$lib/models/commit-identity';
import { invoke } from '@tauri-apps/api/tauri';
import { createForEachRefParser } from './git-delimiter-parser';
import type { Repository } from '$lib/models/repository';

/** Get all the branches. */
export async function getBranches(
	repository: Repository,
	...prefixes: string[]
): Promise<Array<Branch>> {
	const { formatArgs, parse } = createForEachRefParser({
		fullName: '%(refname)',
		shortName: '%(refname:short)',
		upstreamShortName: '%(upstream:short)',
		sha: '%(objectname)',
		author: '%(author)',
		symRef: '%(symref)',
		aheadBehind: '%(ahead-behind:HEAD)'
	});

	if (!prefixes || !prefixes.length) {
		prefixes = ['refs/heads', 'refs/remotes'];
	}

	// TODO: use expectedErrors here to handle a specific error
	// see https://github.com/desktop/desktop/pull/5299#discussion_r206603442 for
	// discussion about what needs to change
	// const result = await git(
	//   ['for-each-ref', ...formatArgs, ...prefixes],
	//   repository.path,
	//   'getBranches',
	//   { expectedErrors: new Set([GitError.NotAGitRepository]) }
	// )

	// if (result.gitError === GitError.NotAGitRepository) {
	//   return []
	// }

	const args = ['for-each-ref', ...formatArgs, ...prefixes];
	const result: string = await invoke('git', { path: repository.path, args });

	const branches = [];

	for (const ref of parse(result)) {
		// excude symbolic refs from the branch list
		if (ref.symRef.length > 0) {
			continue;
		}

		const author = CommitIdentity.parseIdentity(ref.author);
		const tip: IBranchTip = { sha: ref.sha, author };

		const type = ref.fullName.startsWith('refs/heads') ? BranchType.Local : BranchType.Remote;

		const upstream = ref.upstreamShortName.length > 0 ? ref.upstreamShortName : null;

		const [ahead, behind] = ref.aheadBehind.length > 0 ? ref.aheadBehind.split(' ') : [0, 0];
		const aheadBehind = { ahead: Number(ahead), behind: Number(behind) };

		branches.push(new Branch(ref.shortName, upstream, tip, type, ref.fullName, aheadBehind));
	}

	return branches;
}

/**
 * Get the `limit` most recently checked out branches.
 */
export async function getRecentBranches(repository: Repository, limit: number): Promise<string[]> {
	// "git reflog show" is just an alias for "git log -g --abbrev-commit --pretty=oneline"
	// but by using log we can give it a max number which should prevent us from balling out
	// of control when there's ginormous reflogs around (as in e.g. github/github).
	const regex = new RegExp(
		/.*? (renamed|checkout)(?:: moving from|\s*) (?:refs\/heads\/|\s*)(.*?) to (?:refs\/heads\/|\s*)(.*?)$/i
	);

	// const result = await git(
	//   [
	//     'log',
	//     '-g',
	//     '--no-abbrev-commit',
	//     '--pretty=oneline',
	//     'HEAD',
	//     '-n',
	//     '2500',
	//     '--',
	//   ],
	//   repository.path,
	//   'getRecentBranches',
	//   { successExitCodes: new Set([0, 128]) }
	// )

	// if (result.exitCode === 128) {
	//   // error code 128 is returned if the branch is unborn
	//   return []
	// }
	const result: string = await invoke('git', {
		path: repository.path,
		args: ['log', '-g', '--no-abbrev-commit', '--pretty=oneline', 'HEAD', '-n', '2500', '--']
	});

	const lines = result.split('\n');
	const names = new Set<string>();
	const excludedNames = new Set<string>();

	for (const line of lines) {
		const result = regex.exec(line);
		if (result && result.length === 4) {
			const operationType = result[1];
			const excludeBranchName = result[2];
			const branchName = result[3];

			if (operationType === 'renamed') {
				// exclude intermediate-state renaming branch from recent branches
				excludedNames.add(excludeBranchName);
			}

			if (!excludedNames.has(branchName)) {
				names.add(branchName);
			}
		}

		if (names.size === limit) {
			break;
		}
	}

	return [...names];
}
