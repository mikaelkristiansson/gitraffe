<script lang="ts">
	import ActiveBranchStatus from './ActiveBranchStatus.svelte';
	// import BranchLanePopupMenu from './BranchLanePopupMenu.svelte';
	import Tag from './Tag.svelte';
	import { clickOutside } from '$lib/utils/clickOutside';
	import Button from '$lib/components/Button.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import * as toasts from '$lib/utils/toasts';
	import type { Persisted } from '$lib/persisted';
	import { goto } from '$app/navigation';
	import { tooltip } from '$lib/utils/tooltip';
	import { pullOrigin, push } from '$lib/git/cli';
	import { activeBranch, allBranches, defaultBranch, workingBranch } from '$lib/branch';
	import type { IStatusResult } from '$lib/git/status';
	import GitPull from '$lib/icons/GitPull.svelte';
	import GitPush from '$lib/icons/GitPush.svelte';
	import Badge from './Badge.svelte';
	import { Branch } from '$lib/models/branch';
	import { activeRepository } from '$lib/repository';

	export let isUnapplied = false;
	export let branch: IStatusResult | undefined;
	export let repositoryId: string;
	export let isLaneCollapsed: Persisted<boolean>;

	// const branchController = getContextByClass(BranchController);

	let meatballButton: HTMLDivElement;
	let visible = false;
	let isApplying = false;
	let isDeleting = false;
	let isPulling = false;
	let isPushing = false;

	// function handleBranchNameChange() {
	// 	branchController.updateBranchName(branch.id, branch.name);
	// }

	function collapseLane() {
		$isLaneCollapsed = true;
	}

	function expandLane() {
		$isLaneCollapsed = false;
	}

	// $: hasIntegratedCommits = branch.commits?.some((b) => b.isIntegrated);
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
				{branch?.currentBranch}
			</h3>

			<div class="collapsed-lane__info__details">
				<!-- {hasIntegratedCommits} -->
				<ActiveBranchStatus {branch} {isUnapplied} isLaneCollapsed={$isLaneCollapsed} />
				<!-- {#if branch.selectedForChanges}
					<Tag color="pop" filled icon="target" verticalOrientation>Default branch</Tag>
				{/if} -->
			</div>
		</div>
	</div>
{:else}
	<div class="header__wrapper">
		<div class="header card" class:isUnapplied>
			<div class="header__info">
				<div class="flex">
					<div class="header__label text-base-13 text-bold">
						{branch?.currentBranch}
					</div>
					<div class="flex mr-2" use:tooltip={{ text: 'pull origin', delay: 300 }}>
						<Button
							kind="outlined"
							color="neutral"
							class="items-center"
							disabled={!branch?.branchAheadBehind?.behind}
							loading={isPulling}
							on:click={async () => {
								if (branch?.workingDirectory?.files && branch?.workingDirectory?.files.length > 0) {
									toasts.error('Cannot pull while there are uncommitted changes');
									return;
								}
								isPulling = true;
								try {
									if ($activeRepository && branch?.currentBranch) {
										await pullOrigin($activeRepository.path, branch.currentBranch);
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
										await defaultBranch.setDefault($activeRepository);
										await workingBranch.setWorking($activeRepository.path);
										toasts.success('Pulled from origin');
									}
								} finally {
									isPulling = false;
								}
							}}
						>
							Pull <Badge class="ml-1" count={branch?.branchAheadBehind?.behind || 0} />
							<GitPull class="ml-1" size={14} />
						</Button>
					</div>
					<div class="flex" use:tooltip={{ text: 'Push origin', delay: 300 }}>
						<Button
							kind="outlined"
							color="neutral"
							disabled={!branch?.branchAheadBehind?.ahead}
							loading={isPushing}
							on:click={async () => {
								if (branch?.branchAheadBehind?.behind) {
									toasts.error('Cannot push while branch is behind origin');
									return;
								}
								isPushing = true;
								try {
									if ($activeRepository && branch?.currentBranch) {
										await push($activeRepository.path);
										const update = { behind: $activeBranch.aheadBehind.behind, ahead: 0 };
										const newBranch = new Branch(
											$activeBranch.name,
											$activeBranch.upstream,
											$activeBranch.tip,
											$activeBranch.type,
											$activeBranch.ref,
											update
										);
										workingBranch.setWorking($activeRepository.path);
										await defaultBranch.setDefault($activeRepository);
										allBranches.updateBranch(newBranch);
									}
									toasts.success('Pushed to origin');
								} finally {
									isPushing = false;
								}
							}}
						>
							Push <Badge class="ml-1" count={branch?.branchAheadBehind?.ahead || 0} />
							<GitPush class="ml-1" size={14} />
						</Button>
					</div>
				</div>
				<div class="header__remote-branch">
					<!-- {hasIntegratedCommits} -->
					<ActiveBranchStatus {branch} {isUnapplied} isLaneCollapsed={$isLaneCollapsed} />
					{#if branch?.doConflictedFilesExist}
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
			<div class="header__actions">
				<Button
					help="Deletes the local virtual branch (only)"
					icon="bin-small"
					color="neutral"
					kind="outlined"
					loading={isDeleting}
					on:click={async () => {
						isDeleting = true;
						try {
							// await branchController.deleteBranch(branch.id);
							goto(`/${repositoryId}/board`);
						} catch (e) {
							const err = 'Failed to delete branch';
							toasts.error(err);
							console.error(err, e);
						} finally {
							isDeleting = false;
						}
					}}
				>
					Delete
				</Button>
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
						<!-- <BranchLanePopupMenu {branch} {repositoryId} {isUnapplied} bind:visible on:action /> -->
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
