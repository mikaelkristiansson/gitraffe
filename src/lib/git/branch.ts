import { Branch, BranchType, type IBranchTip } from '$lib/models/branch';
import { CommitIdentity } from '$lib/models/commit-identity';
import { createForEachRefParser } from './git-delimiter-parser';
import type { Repository } from '$lib/models/repository';
import { git, gitNetworkArguments } from './cli';
import { IGitError } from '$lib/models/git-errors';
import type { IGitAccount } from '$lib/models/git-account';
// import { getRemoteURL } from './remote';
// import { getFallbackUrlForProxyResolve } from './environment';
import { deleteRef } from './update-ref';
import { envForRemoteOperation, getFallbackUrlForProxyResolve } from './environment';
import { getRemoteURL } from './remote';

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
		symRef: '%(symref)'
	});

	if (!prefixes || !prefixes.length) {
		prefixes = ['refs/heads', 'refs/remotes'];
	}

	const args = ['for-each-ref', ...formatArgs, ...prefixes];
	const result = await git(repository.path, args, {
		expectedErrors: new Set([IGitError.NotAGitRepository])
	});

	if (result.gitError === IGitError.NotAGitRepository) {
		return [];
	}

	const branches = [];

	const status = await git(repository.path, ['branch', '-vv']);

	const states = status.stdout
		.split(/\n/)
		.filter((branch) => branch.trim())
		.map((branch) => {
			const pattern = /([* ]) +([^ ]+) +([^ ]+) +\[(.*?)\]+ +(.+)/;
			const matches = branch.match(pattern);
			if (!matches) return;
			const [_, flag, name, sha, aheadBehind, commit] = matches;
			const ahead = aheadBehind.includes('ahead')
				? Number(aheadBehind.split('ahead').pop()?.trim())
				: 0;
			const behind = aheadBehind.includes('behind')
				? Number(aheadBehind.split('behind').pop()?.trim())
				: 0;
			const isGone = aheadBehind.includes('gone');
			return { flag, name, sha, ahead, behind, isGone, commit };
		});

	for (const ref of parse(result.stdout)) {
		// excude symbolic refs from the branch list
		if (ref.symRef.length > 0) {
			continue;
		}

		const author = CommitIdentity.parseIdentity(ref.author);
		const tip: IBranchTip = { sha: ref.sha, author };

		const type = ref.fullName.startsWith('refs/heads') ? BranchType.Local : BranchType.Remote;

		const upstream = ref.upstreamShortName.length > 0 ? ref.upstreamShortName : null;
		let ahead = 0;
		let behind = 0;
		const state = states.find((state) => state?.name === ref.shortName);
		if (state) {
			ahead = state.ahead;
			behind = state.behind;
		}
		const aheadBehind = state?.isGone ? null : { ahead: Number(ahead), behind: Number(behind) };

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
	const { stdout, exitCode } = await git(
		repository.path,
		['log', '-g', '--no-abbrev-commit', '--pretty=oneline', 'HEAD', '-n', '2500', '--'],
		{ successExitCodes: new Set([0, 128]) }
	);

	if (exitCode === 128) {
		// error code 128 is returned if the branch is unborn
		return [];
	}

	const lines = stdout.split('\n');
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

/** Rename the given branch to a new name. */
export async function renameBranch(
	repository: Repository,
	branch: Branch,
	newName: string
): Promise<void> {
	await git(repository.path, ['branch', '-m', branch.nameWithoutRemote, newName]);
}

/**
 * Delete the branch locally.
 */
export async function deleteLocalBranch(repository: Repository, branchName: string): Promise<true> {
	await git(repository.path, ['branch', '-D', branchName]);
	return true;
}

/**
 * Create a new branch from the given start point.
 *
 * @param repository - The repository in which to create the new branch
 * @param name       - The name of the new branch
 * @param startPoint - A committish string that the new branch should be based
 *                     on, or undefined if the branch should be created based
 *                     off of the current state of HEAD
 */
export async function createBranch(
	repository: Repository,
	name: string,
	startPoint: string | null,
	noTrack?: boolean
): Promise<void> {
	const args = startPoint !== null ? ['branch', name, startPoint] : ['branch', name];

	// if we're branching directly from a remote branch, we don't want to track it
	// tracking it will make the rest of desktop think we want to push to that
	// remote branch's upstream (which would likely be the upstream of the fork)
	if (noTrack) {
		args.push('--no-track');
	}

	await git(repository.path, args);
}

/**
 * Deletes a remote branch
 *
 * @param remoteName - the name of the remote to delete the branch from
 * @param remoteBranchName - the name of the branch on the remote
 */
export async function deleteRemoteBranch(
	repository: Repository,
	account: IGitAccount | null,
	remoteName: string,
	remoteBranchName: string
): Promise<true> {
	const remoteUrl =
		(await getRemoteURL(repository, remoteName).catch((err) => {
			// If we can't get the URL then it's very unlikely Git will be able to
			// either and the push will fail. The URL is only used to resolve the
			// proxy though so it's not critical.
			console.error(`Could not resolve remote url for remote ${remoteName}`, err);
			return null;
		})) || getFallbackUrlForProxyResolve(account, repository);

	const args = [...gitNetworkArguments(), 'push', remoteName, `:${remoteBranchName}`];

	// If the user is not authenticated, the push is going to fail
	// Let this propagate and leave it to the caller to handle
	const result = await git(repository.path, args, {
		env: await envForRemoteOperation(account, remoteUrl),
		expectedErrors: new Set<IGitError>([IGitError.BranchDeletionFailed])
	});

	// It's possible that the delete failed because the ref has already
	// been deleted on the remote. If we identify that specific
	// error we can safely remove our remote ref which is what would
	// happen if the push didn't fail.
	if (result.gitError === IGitError.BranchDeletionFailed) {
		const ref = `refs/remotes/${remoteName}/${remoteBranchName}`;
		await deleteRef(repository, ref);
	}

	return true;
}
