import { getBranches } from '$lib/git/branch';
import { checkoutBranch } from '$lib/git/checkout';
import { GitError } from '$lib/git/cli';
import { getGlobalConfigValue, setGlobalConfigValue } from '$lib/git/config';
import { MergeResult, merge } from '$lib/git/merge';
import { getRemoteHEAD } from '$lib/git/remote';
import {
	createGitfoxStashEntry,
	dropGitfoxStashEntry,
	getLastGitfoxStashEntryForBranch,
	popStashEntry
} from '$lib/git/stash';
import { BranchType, type Branch } from '$lib/models/branch';
import { ErrorWithMetadata } from '$lib/models/error-with-metadata';
import type { IGitAccount } from '$lib/models/git-account';
import { IGitError } from '$lib/models/git-errors';
import { UpstreamRemoteName } from '$lib/models/remote';
import { Repository, isForkedRepositoryContributingToParent } from '$lib/models/repository';
import type { WorkingDirectoryStatus } from '$lib/models/status';
import { stashStore } from '$lib/stores/stash';
import { getUntrackedFiles } from './status';

export function normalizeBranchName(value: string) {
	return value.toLowerCase().replace(/[^0-9a-z/_.]+/g, '-');
}

/**
 * Takes a list of local and remote branches and filters out "duplicate"
 * remote branches, i.e. remote branches that we already have a local
 * branch tracking.
 */
export function mergeRemoteAndLocalBranches(branches: Array<Branch>): Array<Branch> {
	const localBranches = new Array<Branch>();
	const remoteBranches = new Array<Branch>();

	for (const branch of branches) {
		if (branch.type === BranchType.Local) {
			localBranches.push(branch);
		} else if (branch.type === BranchType.Remote) {
			remoteBranches.push(branch);
		}
	}

	const upstreamBranchesAdded = new Set<string>();
	const allBranchesWithUpstream = new Array<Branch>();

	for (const branch of localBranches) {
		allBranchesWithUpstream.push(branch);

		if (branch.upstream) {
			upstreamBranchesAdded.add(branch.upstream);
		}
	}

	for (const branch of remoteBranches) {
		// This means we already added the local branch of this remote branch, so
		// we don't need to add it again.
		if (upstreamBranchesAdded.has(branch.name)) {
			continue;
		}

		allBranchesWithUpstream.push(branch);
	}

	return allBranchesWithUpstream;
}

/**
 * Attempts to locate the default branch as determined by the HEAD symbolic link
 * in the contribution target remote (origin or upstream) if such a ref exists,
 * falling back to the value of the `init.defaultBranch` configuration and
 * finally a const value of `main`.
 *
 * In determining the default branch we prioritize finding a local branch but if
 * no local branch matches the default branch name nor is tracking the
 * contribution target remote HEAD we'll fall back to looking for the remote
 * branch itself.
 */
export async function findDefaultBranch(
	repository: Repository,
	defaultRemoteName: string | undefined
) {
	const remoteName = isForkedRepositoryContributingToParent(repository)
		? UpstreamRemoteName
		: defaultRemoteName;

	const remoteHead = remoteName ? await getRemoteHEAD(repository, remoteName) : null;

	const defaultBranchName = remoteHead ?? (await getDefaultBranch(repository));
	const remoteRef = remoteHead ? `${remoteName}/${remoteHead}` : undefined;

	const upstreamName = remoteRef || `origin/${defaultBranchName}`;
	const branches = await getBranches(repository, upstreamName);

	let localHit: Branch | undefined = undefined;
	let localTrackingHit: Branch | undefined = undefined;
	let remoteHit: Branch | undefined = undefined;

	for (const branch of branches) {
		if (branch.type === BranchType.Local) {
			if (branch.name === defaultBranchName) {
				localHit = branch;
			}

			if (remoteRef && branch.upstream === remoteRef) {
				// Give preference to local branches that target the upstream
				// default branch that also match the name. In other words, if there
				// are two local branches which both track the origin default branch
				// we'll prefer a branch which is also named the same as the default
				// branch name.
				if (!localTrackingHit || branch.name === defaultBranchName) {
					localTrackingHit = branch;
				}
			}
		} else if (remoteRef && branch.name === remoteRef) {
			remoteHit = branch;
		}
	}

	// When determining what the default branch is we give priority to local
	// branches tracking the default branch of the contribution target (think
	// origin) remote, then we consider local branches that are named the same
	// as the default branch, and finally we look for the remote branch
	// representing the default branch of the contribution target
	return localTrackingHit ?? localHit ?? remoteHit ?? null;
}

/**
 * The default branch name that GitHub Desktop will use when
 * initializing a new repository.
 */
const DefaultBranchInDesktop = 'main';

/**
 * The name of the Git configuration variable which holds what
 * branch name Git will use when initializing a new repository.
 */
const DefaultBranchSettingName = 'init.defaultBranch';

/**
 * Returns the configured default branch when creating new repositories
 */
async function getConfiguredDefaultBranch(repository: Repository): Promise<string | null> {
	return getGlobalConfigValue(DefaultBranchSettingName, repository.path);
}

/**
 * Returns the configured default branch when creating new repositories
 */
export async function getDefaultBranch(repository: Repository): Promise<string> {
	return (await getConfiguredDefaultBranch(repository)) ?? DefaultBranchInDesktop;
}

/**
 * Sets the configured default branch when creating new repositories.
 *
 * @param branchName The default branch name to use.
 */
export async function setDefaultBranch(branchName: string) {
	return setGlobalConfigValue(DefaultBranchSettingName, branchName);
}

/** An item in the filter list. */
export interface IFilterListItem {
	/** The text which represents the item. This is used for filtering. */
	readonly text: ReadonlyArray<string>;

	/** A unique identifier for the item. */
	readonly id: string;
}

/** A group of items in the list. */
export interface IFilterListGroup<T extends IFilterListItem> {
	/** The identifier for this group. */
	readonly identifier: string;

	/** The items in the group. */
	readonly items: ReadonlyArray<T>;
}

export type BranchGroupIdentifier = 'default' | 'recent' | 'other';

export interface IBranchListItem extends IFilterListItem {
	readonly text: ReadonlyArray<string>;
	readonly id: string;
	readonly branch: Branch;
}

export function groupBranches(
	defaultBranch: Branch | null,
	allBranches: ReadonlyArray<Branch>,
	recentBrancheNames: string[]
): IFilterListGroup<IBranchListItem>[] {
	const groups = new Array<IFilterListGroup<IBranchListItem>>();

	if (defaultBranch) {
		groups.push({
			identifier: 'default',
			items: [
				{
					text: [defaultBranch.name],
					id: defaultBranch.name,
					branch: defaultBranch
				}
			]
		});
	}

	const recentBranchNames = new Set<string>();
	const defaultBranchName = defaultBranch ? defaultBranch.name : null;
	const recentBranchesWithoutDefault = recentBrancheNames.filter((b) => b !== defaultBranchName);
	if (recentBranchesWithoutDefault.length > 0) {
		const recentBranches = new Array<IBranchListItem>();

		for (const branch of recentBranchesWithoutDefault) {
			const recentBranch = allBranches.find((b) => b.name === branch) as Branch;
			if (!recentBranch) {
				continue;
			}
			recentBranches.push({
				text: [recentBranch.name],
				id: recentBranch.name,
				branch: recentBranch
			});
			recentBranchNames.add(recentBranch.name);
		}

		groups.push({
			identifier: 'recent',
			items: recentBranches
		});
	}

	const remainingBranches = allBranches.filter(
		(b) =>
			b.name !== defaultBranchName && !recentBranchNames.has(b.name) && !b.isDesktopForkRemoteBranch
	);

	const remainingItems = remainingBranches.map((b) => ({
		text: [b.name],
		id: b.name,
		branch: b
	}));
	if (remainingItems.length > 0) {
		groups.push({
			identifier: 'other',
			items: remainingItems
		});
	}

	return groups;
}

export function getRemoteName(branch: Branch): string | null {
	if (branch.type === BranchType.Local) {
		return null;
	}

	const pieces = branch.ref.match(/^refs\/remotes\/(.*?)\/.*/);
	if (!pieces || pieces.length !== 2) {
		// This shouldn't happen, the remote ref should always be prefixed
		// with refs/remotes
		throw new Error(`Remote branch ref has unexpected format: ${branch.ref}`);
	}
	return pieces[1];
}

export async function mergeBranch(
	repository: Repository,
	sourceBranch: Branch,
	isSquash: boolean = false
) {
	const mergeResult = await merge(repository, sourceBranch.name, isSquash);
	if (mergeResult === MergeResult.Success) {
		console.log('Merge successful');
	} else if (mergeResult === MergeResult.AlreadyUpToDate) {
		console.log('Already up to date');
	}
	return mergeResult;
}

/**
 * Checkout the given branch and leave any local changes on the current branch
 *
 * Note that this will ovewrite any existing stash enty on the current branch.
 */
export async function checkoutAndLeaveChanges(
	repository: Repository,
	branch: Branch,
	workingBranch: Branch,
	workingDirectory: WorkingDirectoryStatus,
	account: IGitAccount | null
) {
	if (workingDirectory.files.length > 0) {
		await createStashAndDropPreviousEntry(repository, workingBranch, workingDirectory);
	}

	const lastStash = await getLastGitfoxStashEntryForBranch(repository, workingBranch);
	if (lastStash) {
		stashStore.setNewStash(lastStash, repository.id + '_' + workingBranch.name);
	}

	return checkoutIgnoringChanges(repository, branch, account);
}

/**
 * Checkout the given branch and move any local changes along.
 *
 * Will attempt to simply check out the branch and if that fails due to
 * local changes risking being overwritten it'll create a transient stash
 * entry, switch branches, and pop said stash entry.
 *
 * Note that the transient stash entry will not overwrite any current stash
 * entry for the target branch.
 */
export async function checkoutAndBringChanges(
	repository: Repository,
	branch: Branch,
	workingDirectory: WorkingDirectoryStatus,
	account: IGitAccount | null
) {
	try {
		await checkoutBranch(repository, account, branch);
	} catch (checkoutError) {
		if (!isLocalChangesOverwrittenError(checkoutError as Error)) {
			throw checkoutError;
		}

		const stash = (await createStashEntry(repository, branch, workingDirectory))
			? await getLastGitfoxStashEntryForBranch(repository, branch)
			: null;

		// Failing to stash the changes when we know that there are changes
		// preventing a checkout is very likely due to assume-unchanged or
		// skip-worktree. So instead of showing a "could not create stash" error
		// we'll show the checkout error to the user and let them figure it out.
		if (stash === null) {
			throw checkoutError;
		}

		await checkoutIgnoringChanges(repository, branch, account);
		await popStashEntry(repository, stash.stashSha);
	}
}

/** Checkout the given branch without taking local changes into account */
async function checkoutIgnoringChanges(
	repository: Repository,
	branch: Branch,
	account: IGitAccount | null
) {
	await checkoutBranch(repository, account, branch);
}

async function createStashEntry(
	repository: Repository,
	branch: Branch,
	workingDirectory: WorkingDirectoryStatus
) {
	const untrackedFiles = getUntrackedFiles(workingDirectory);
	return createGitfoxStashEntry(repository, branch, untrackedFiles);
}

function isLocalChangesOverwrittenError(error: Error): boolean {
	if (error instanceof ErrorWithMetadata) {
		return isLocalChangesOverwrittenError(error.underlyingError);
	}

	return error instanceof GitError && error.result.gitError === IGitError.LocalChangesOverwritten;
}

async function createStashAndDropPreviousEntry(
	repository: Repository,
	branch: Branch,
	workingDirectory: WorkingDirectoryStatus
) {
	const entry = await getLastGitfoxStashEntryForBranch(repository, branch);

	const createdStash = await createStashEntry(repository, branch, workingDirectory);

	if (createdStash === true && entry !== null) {
		const { stashSha, branchName } = entry;

		await dropGitfoxStashEntry(repository, stashSha);
		console.info(`Dropped stash '${stashSha}' associated with ${branchName}`);
	}

	return createdStash === true;
}
