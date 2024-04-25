<script lang="ts">
	import ActiveBranchStatus from './ActiveBranchStatus.svelte';
	import BranchLanePopupMenu from './BranchLanePopupMenu.svelte';
	import Tag from './Tag.svelte';
	import { clickOutside } from '$lib/utils/clickOutside';
	import Button from '$lib/components/Button.svelte';
	import * as toasts from '$lib/utils/toasts';
	import { tooltip } from '$lib/utils/tooltip';
	import { pullOrigin } from '$lib/git/cli';
	import { push as pushUpstream } from '$lib/git/push';
	import { activeBranch, allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import type { Persisted } from '$lib/persisted';
	import type { IStatusResult } from '$lib/git/status';
	import type { Repository } from '$lib/models/repository';
	import Badge from './Badge.svelte';
	import { Branch } from '$lib/models/branch';
	import { getRemotes } from '$lib/git/remote';
	import { findDefaultRemote } from '$lib/utils/find-default-remote';
	import type { IRemote } from '$lib/models/remote';
	import { commitStore } from '$lib/stores/commits';
	import PullRequestCard from './PullRequestCard.svelte';
	import Icon from './Icon.svelte';
	import { pushActiveBranch } from '$lib/utils/branch';

	export let isUnapplied = false;
	export let branch: IStatusResult;
	export let repository: Repository;
	export let isLaneCollapsed: Persisted<boolean>;
	export let isPushing = false;

	let meatballButton: HTMLDivElement;
	let visible = false;
	let isPublishing = false;
	let isPulling = false;

	function collapseLane() {
		$isLaneCollapsed = true;
	}

	function expandLane() {
		$isLaneCollapsed = false;
	}

	const publishBranch = async () => {
		isPublishing = true;
		try {
			const remotes = await getRemotes(repository);
			const remote = findDefaultRemote(remotes);
			const remoteName = branch.currentUpstreamBranch || remote?.name;
			if (remoteName && remote) {
				const safeRemote: IRemote = { name: remoteName, url: remote.url };
				if (branch.currentBranch) {
					await pushUpstream(repository, null, safeRemote, branch.currentBranch, null, null);
				}
			}
			workingBranch.setWorking(repository);
			toasts.success('Branch published');
		} catch (e) {
			toasts.error('Failed to publish branch');
			console.error('Failed to publish branch', e);
		} finally {
			isPublishing = false;
		}
	};

	const pullBranch = async () => {
		if (branch.workingDirectory?.files && branch.workingDirectory?.files.length > 0) {
			toasts.error('Cannot pull while there are uncommitted changes');
			return;
		}
		isPulling = true;
		try {
			if (branch.currentBranch) {
				await pullOrigin(repository.path, branch.currentBranch);
				const update = { behind: 0, ahead: $activeBranch.aheadBehind.ahead };
				const newBranch = new Branch(
					$activeBranch.name,
					$activeBranch.upstream,
					$activeBranch.tip,
					$activeBranch.type,
					$activeBranch.ref,
					update
				);
				allBranches.updateBranch(newBranch);
				await defaultBranch.setDefault(repository);
				await workingBranch.setWorking(repository);
				toasts.success('Pulled from origin');
			}
		} finally {
			isPulling = false;
		}
	};

	const pushBranch = async () => {
		isPushing = true;
		await pushActiveBranch(repository, branch, $activeBranch);
		isPushing = false;
	};
</script>

{#if $isLaneCollapsed}
	<div
		class="card collapsed-lane"
		on:mousedown={expandLane}
		on:keydown={(e) => e.key === 'Enter' && expandLane()}
		tabindex="0"
		role="button"
	>
		<div class="collapsed-lane__actions">
			<Button
				icon="unfold-lane"
				kind="outlined"
				color="neutral"
				help="Collapse lane"
				on:mousedown={expandLane}
			/>
		</div>

		<div class="collapsed-lane__info">
			<h3 class="collapsed-lane__label text-base-13 text-bold">
				{branch.currentBranch}
			</h3>

			<div class="collapsed-lane__info__details">
				<ActiveBranchStatus {repository} {branch} isLaneCollapsed={$isLaneCollapsed} />
			</div>
		</div>
	</div>
{:else}
	<div class="header__wrapper">
		<div class="header card" class:isUnapplied>
			<div class="header__info">
				<div class="flex">
					<div class="header__label text-base-13 text-bold">
						{branch.currentBranch}
					</div>
					<div class="header__remote-branch">
						<ActiveBranchStatus {repository} {branch} isLaneCollapsed={$isLaneCollapsed} />
						{#if branch.doConflictedFilesExist}
							<Tag
								icon="locked-small"
								color="warning"
								help="Applying this branch will add merge conflict markers that you will have to resolve"
							>
								Conflict
							</Tag>
						{/if}
					</div>
				</div>
				<div class="flex flex-1 justify-evenly">
					<div class="flex w-full" use:tooltip={{ text: 'Pull origin', delay: 300 }}>
						<Button
							kind="outlined"
							color="neutral"
							wide
							class="!rounded-r-none !border-r-0"
							disabled={!branch.branchAheadBehind?.behind}
							loading={isPulling}
							on:click={pullBranch}
						>
							Pull <Badge class="ml-1" count={branch.branchAheadBehind?.behind || 0} />
							<Icon name="pull-small" size={14} />
						</Button>
					</div>
					<div class="flex w-full" use:tooltip={{ text: 'Push origin', delay: 300 }}>
						<Button
							kind="outlined"
							color="neutral"
							wide
							class="!rounded-l-none"
							disabled={!branch.branchAheadBehind?.ahead}
							loading={isPushing}
							on:click={pushBranch}
						>
							<kbd
								class="pointer-events-none inline-flex select-none items-center gap-1 rounded px-1 leading-[15px] border border-gray-400 bg-gray-400/60 mr-1 font-mono text-base-10 font-medium opacity-60"
							>
								<span>⌘</span>P
							</kbd>
							Push <Badge class="ml-1" count={branch.branchAheadBehind?.ahead || 0} />
							<Icon name="push-small" size={14} />
						</Button>
					</div>
				</div>
			</div>
			<div class="header__actions">
				<div>
					{#if branch && branch.branchAheadBehind !== undefined}
						<PullRequestCard {repository} />
					{:else}
						<Button
							icon="merged-pr-small"
							loading={isPublishing}
							color="pop"
							on:click={publishBranch}>Publish Branch</Button
						>
					{/if}
				</div>
				<div class="header__buttons">
					<Button
						icon="fold-lane"
						on:mousedown={collapseLane}
						kind="outlined"
						color="neutral"
						help="Collapse lane"
					/>
					<Button
						icon="kebab"
						kind="outlined"
						color="neutral"
						on:mousedown={() => {
							visible = !visible;
						}}
					/>
					<div
						class="branch-popup-menu"
						use:clickOutside={{
							trigger: meatballButton,
							handler: () => (visible = false)
						}}
					>
						{#if branch && $commitStore.localCommits}
							<BranchLanePopupMenu
								{branch}
								commits={$commitStore.localCommits}
								bind:visible
								on:action
							/>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	/* .header__wrapper {
		z-index: 10;
		position: sticky;
		top: var(--size-12);
	} */
	.header {
		z-index: 2;
		position: relative;
		flex-direction: column;
		gap: var(--size-2);

		&.isUnapplied {
			background: var(--clr-theme-container-pale);
		}
	}
	.header__info {
		display: flex;
		flex-direction: column;
		transition: margin var(--transition-slow);
		padding: var(--size-12);
		gap: var(--size-10);
	}
	.header__actions {
		display: flex;
		gap: var(--size-4);
		background: var(--clr-theme-container-pale);
		padding: var(--size-14);
		justify-content: space-between;
		border-radius: 0 0 var(--radius-m) var(--radius-m);
		user-select: none;
	}
	.isUnapplied .header__actions {
		background: var(--clr-theme-container-sub);
	}
	.header__buttons {
		display: flex;
		position: relative;
		gap: var(--size-4);
	}
	.header__label {
		display: flex;
		flex-grow: 1;
		align-items: center;
		gap: var(--size-4);
	}
	.draggable {
		display: flex;
		cursor: grab;
		position: absolute;
		right: var(--size-4);
		top: var(--size-6);
		opacity: 0;
		color: var(--clr-theme-scale-ntrl-50);
		transition:
			opacity var(--transition-slow),
			color var(--transition-slow);

		&:hover {
			color: var(--clr-theme-scale-ntrl-40);
		}
	}

	.branch-popup-menu {
		position: absolute;
		top: calc(100% + var(--size-4));
		right: 0;
		z-index: 10;
	}

	.header__remote-branch {
		color: var(--clr-theme-scale-ntrl-50);
		display: flex;
		gap: var(--size-4);
		justify-content: space-between;
		text-overflow: ellipsis;
		overflow-x: hidden;
		white-space: nowrap;
		align-items: center;
	}

	/*  COLLAPSABLE LANE */

	.collapsed-lane {
		cursor: default;
		user-select: none;
		align-items: center;
		height: 100%;
		gap: var(--size-8);
		padding: var(--size-8) var(--size-8) var(--size-20);

		&:focus-within {
			outline: none;
		}
	}

	.collapsed-lane__actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--size-2);
	}

	.collapsed-lane__draggable {
		cursor: grab;
		transform: rotate(90deg);
		margin-bottom: var(--size-4);
		opacity: 0.4;
		transition: opacity var(--transition-fast);
		color: var(--clr-theme-scale-ntrl-0);

		&:hover {
			opacity: 1;
		}
	}

	.collapsed-lane__info {
		flex: 1;
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		justify-content: space-between;
		height: 100%;

		writing-mode: vertical-rl;
		gap: var(--size-8);
	}

	.collapsed-lane__info__details {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		gap: var(--size-4);
	}

	.collapsed-lane__label {
		color: var(--clr-theme-scale-ntrl-0);
		transform: rotate(180deg);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
