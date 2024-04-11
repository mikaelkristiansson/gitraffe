/**
 * Rebase internal state used to track how and where the rebase is applied to
 * the repository.
 */
export type RebaseInternalState = {
	/** The branch containing commits that should be rebased */
	readonly targetBranch: string;
	/**
	 * The commit ID of the base branch, to be used as a starting point for
	 * the rebase.
	 */
	readonly baseBranchTip: string;
	/**
	 * The commit ID of the target branch at the start of the rebase, which points
	 * to the original commit history.
	 */
	readonly originalBranchTip: string;
};
