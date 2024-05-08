import { removeRemotePrefix } from '$lib/utils/remove-remote-prefix';
import type { CommitIdentity } from './commit-identity';
import { ForkedRemotePrefix } from './remote';

export enum BranchType {
	Local = 0,
	Remote = 1
}

/** The number of commits a revision range is ahead/behind. */
export interface IAheadBehind {
	ahead: number;
	behind: number;
}

/** Basic data about the latest commit on the branch. */
export interface IBranchTip {
	readonly sha: string;
	readonly author: CommitIdentity;
}

/** A branch as loaded from Git. */
export class Branch {
	/**
	 * A branch as loaded from Git.
	 *
	 * @param name The short name of the branch. E.g., `main`.
	 * @param upstream The remote-prefixed upstream name. E.g., `origin/main`.
	 * @param tip Basic information (sha and author) of the latest commit on the branch.
	 * @param type The type of branch, e.g., local or remote.
	 * @param ref The canonical ref of the branch
	 */
	public constructor(
		public readonly name: string,
		public readonly upstream: string | null,
		public readonly tip: IBranchTip,
		public readonly type: BranchType,
		public readonly ref: string,
		public readonly aheadBehind: IAheadBehind | null,
		public remoteExists: boolean = false
	) {}

	/** The name of the upstream's remote. */
	public get upstreamRemoteName(): string | null {
		const upstream = this.upstream;
		if (!upstream) {
			return null;
		}

		const pieces = upstream.match(/(.*?)\/.*/);
		if (!pieces || pieces.length < 2) {
			return null;
		}

		return pieces[1];
	}

	/** The name of remote for a remote branch. If local, will return null. */
	public get remoteName(): string | null {
		if (this.type === BranchType.Local) {
			return null;
		}

		const pieces = this.ref.match(/^refs\/remotes\/(.*?)\/.*/);
		if (!pieces || pieces.length !== 2) {
			// This shouldn't happen, the remote ref should always be prefixed
			// with refs/remotes
			throw new Error(`Remote branch ref has unexpected format: ${this.ref}`);
		}
		return pieces[1];
	}
	/**
	 * The name of the branch's upstream without the remote prefix.
	 */
	public get upstreamWithoutRemote(): string | null {
		if (!this.upstream) {
			return null;
		}

		return removeRemotePrefix(this.upstream);
	}

	/**
	 * The name of the branch without the remote prefix. If the branch is a local
	 * branch, this is the same as its `name`.
	 */
	public get nameWithoutRemote(): string {
		if (this.type === BranchType.Local) {
			return this.name;
		} else {
			const withoutRemote = removeRemotePrefix(this.name);
			return withoutRemote || this.name;
		}
	}

	/**
	 * Gets a value indicating whether the branch is a remote branch belonging to
	 * one of Desktop's automatically created (and pruned) fork remotes. I.e. a
	 * remote branch from a branch which starts with `github-desktop-`.
	 *
	 * We hide branches from our known Desktop for remotes as these are considered
	 * plumbing and can add noise to everywhere in the user interface where we
	 * display branches as forks will likely contain duplicates of the same ref
	 * names
	 **/
	public get isDesktopForkRemoteBranch() {
		return this.type === BranchType.Remote && this.name.startsWith(ForkedRemotePrefix);
	}
}

/** Basic data about a branch, and the branch it's tracking. */
export interface ITrackingBranch {
	readonly ref: string;
	readonly sha: string;
	readonly upstreamRef: string;
	readonly upstreamSha: string;
}
