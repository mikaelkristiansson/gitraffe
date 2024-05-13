<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Badge } from '$lib/components/ui/badge';
	import ActiveBranchStatus from './ActiveBranchStatus.svelte';
	import { pullOrigin } from '$lib/git/cli';
	import { push as pushUpstream } from '$lib/git/push';
	import { activeBranch, allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import type { Persisted } from '$lib/persisted';
	import type { IStatusResult } from '$lib/git/status';
	import type { Repository } from '$lib/models/repository';
	import { Branch } from '$lib/models/branch';
	import { getRemotes } from '$lib/git/remote';
	import { findDefaultRemote } from '$lib/utils/find-default-remote';
	import type { IRemote } from '$lib/models/remote';
	import PullRequestCard from './PullRequestCard.svelte';
	import Icon from './Icon.svelte';
	import { mergeBranch, pushActiveBranch } from '$lib/utils/branch';
	import { Button } from './ui/button';
	import { fetchRemote } from '$lib/utils/remote';
	import { toast } from 'svelte-sonner';
	import { MergeResult } from '$lib/git/merge';
	import DeleteBranch from './DeleteBranch.svelte';

	export let branch: IStatusResult;
	export let repository: Repository;
	export let isLaneCollapsed: Persisted<boolean>;
	export let isPushing = false;

	let dialogDeleteOpen = false;
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
			toast.success('Branch published');
		} catch (e) {
			toast.error('Failed to publish branch');
			console.error('Failed to publish branch', e);
		} finally {
			isPublishing = false;
		}
	};

	const pullBranch = async () => {
		if (branch.workingDirectory?.files && branch.workingDirectory?.files.length > 0) {
			toast.error('Cannot pull while there are uncommitted changes');
			return;
		}
		isPulling = true;
		try {
			if (branch.currentBranch) {
				try {
					await pullOrigin(repository.path, branch.currentBranch);
				} catch (e) {
					toast.error('Failed to pull from origin');
					console.error('Failed to pull from origin', e);
				}
				const update = { behind: 0, ahead: $activeBranch.aheadBehind?.ahead || 0 };
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
				toast.success('Pulled from origin');
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
	<Card.Root class="flex flex-col h-full gap-2 px-2 py-4 collapsed-lane">
		<div class="collapsed-lane__actions">
			<Button icon="unfold-lane" size="icon" variant="outline" on:click={expandLane} />
		</div>

		<div class="collapsed-lane__info">
			<h3 class="collapsed-lane__label text-xs font-bold">
				{branch.currentBranch}
			</h3>

			<div class="collapsed-lane__info__details">
				<ActiveBranchStatus {repository} {branch} isLaneCollapsed={$isLaneCollapsed} />
			</div>
		</div>
	</Card.Root>
{:else}
	<Card.Root>
		<div class="header__info">
			<div class="flex">
				<div class="header__label text-xs font-bold overflow-hidden text-ellipsis">
					{branch.currentBranch}
				</div>
			</div>
			<div class="header__remote-branch">
				<ActiveBranchStatus {repository} {branch} isLaneCollapsed={$isLaneCollapsed} />
				{#if branch.doConflictedFilesExist}
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Badge icon="locked-small" variant="destructive">Conflict</Badge>
						</Tooltip.Trigger>
						<Tooltip.Content>
							Applying this branch will add merge conflict markers that you will have to resolve
						</Tooltip.Content>
					</Tooltip.Root>
				{/if}
			</div>
			<div class="flex flex-1 justify-evenly">
				<Tooltip.Root>
					<Tooltip.Trigger class="cursor-auto flex w-full">
						<Button
							variant="outline"
							class="!rounded-r-none !border-r-0 w-full"
							disabled={!branch.branchAheadBehind?.behind}
							loading={isPulling}
							on:click={pullBranch}
						>
							Pull <Badge size="sm" variant="secondary" class="ml-1"
								>{branch.branchAheadBehind?.behind || 0}</Badge
							>
							<Icon name="pull-small" size={14} />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Pull origin</Tooltip.Content>
				</Tooltip.Root>
				<Tooltip.Root>
					<Tooltip.Trigger class="cursor-auto flex w-full">
						<Button
							variant="outline"
							class="!rounded-l-none w-full"
							disabled={!branch.branchAheadBehind?.ahead}
							loading={isPushing}
							on:click={pushBranch}
						>
							<kbd
								class="pointer-events-none inline-flex select-none items-center gap-1 rounded px-1 leading-[15px] border border-gray-400 bg-gray-400/60 mr-1 font-mono text-xs font-medium opacity-60"
							>
								<span>⌘</span>P
							</kbd>
							Push <Badge size="sm" variant="secondary" class="ml-1"
								>{branch.branchAheadBehind?.ahead || 0}</Badge
							>
							<Icon name="push-small" size={14} />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content>Push origin</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>
		<Card.Footer class="flex justify-between py-2 px-3 bg-muted/40">
			<div>
				{#if branch && branch.branchAheadBehind !== undefined}
					<PullRequestCard {repository} />
				{:else}
					<Button icon="merged-pr-small" loading={isPublishing} color="pop" on:click={publishBranch}
						>Publish Branch</Button
					>
				{/if}
			</div>
			<div class="header__buttons">
				<!-- help="Collapse lane" -->
				<Button icon="fold-lane" on:click={collapseLane} size="icon" variant="outline" />
				<DropdownMenu.Root>
					<DropdownMenu.Trigger asChild let:builder>
						<Button builders={[builder]} variant="outline" size="icon" icon="kebab" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Group>
							<DropdownMenu.Item
								class="cursor-pointer"
								on:click={async () => {
									let fetchCurrentRemote = null;
									const remotes = await getRemotes(repository);
									const remote = findDefaultRemote(remotes);
									const remoteName = branch.currentUpstreamBranch || remote?.name;
									if (remoteName && remote) {
										const safeRemote = { name: remoteName, url: remote.url };
										fetchCurrentRemote = fetchRemote(null, repository, safeRemote, false);
									}
									const allPromises = Promise.all([remotes, fetchCurrentRemote]);
									toast.promise(allPromises, {
										success: 'Fetched from remote',
										loading: 'Fetching',
										error: 'Failed to fetch from remote'
									});
								}}
							>
								<Icon name="remote" />
								<span class="pl-2">Fetch from remote</span>
								<!-- <DropdownMenu.Shortcut>⌘⇧F</DropdownMenu.Shortcut> -->
							</DropdownMenu.Item>
							{#if branch.currentBranch !== $defaultBranch.name}
								<DropdownMenu.Item
									class="cursor-pointer"
									on:click={async () => {
										if (repository) {
											const mergeStatus = await mergeBranch(repository, $defaultBranch);
											if (mergeStatus === MergeResult.Success) {
												toast.success('Branch updated');
											} else if (mergeStatus === MergeResult.AlreadyUpToDate) {
												toast.success('Branch is already up to date');
											} else {
												toast.error('Failed to update branch');
											}
										}
									}}
								>
									<Icon name="rebase-small" />
									<span class="pl-2">Update from {$defaultBranch.nameWithoutRemote}</span>
									<!-- <DropdownMenu.Shortcut>⌘⇧U</DropdownMenu.Shortcut> -->
								</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Group>
						{#if branch.currentBranch !== $defaultBranch.name}
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item
									class="cursor-pointer"
									on:click={async () => {
										dialogDeleteOpen = true;
									}}
								>
									<Icon name="bin-small" />
									<span class="pl-2">Delete branch</span>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</Card.Footer>
	</Card.Root>
{/if}

<DeleteBranch {repository} branch={$activeBranch} bind:dialogDeleteOpen />

<style lang="postcss">
	.header__info {
		display: flex;
		flex-direction: column;
		@apply p-3 gap-2;
	}
	.header__buttons {
		display: flex;
		position: relative;
		@apply gap-1;
	}
	.header__label {
		display: flex;
		flex-grow: 1;
		align-items: center;
		@apply gap-1;
	}

	.header__remote-branch {
		display: flex;
		@apply gap-1;
		justify-content: start;
		text-overflow: ellipsis;
		white-space: nowrap;
		align-items: center;
	}

	/*  COLLAPSABLE LANE */

	.collapsed-lane__actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		@apply gap-0.5;
	}

	.collapsed-lane__info {
		flex: 1;
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		justify-content: space-between;
		height: 100%;

		writing-mode: vertical-rl;
		@apply gap-2;
	}

	.collapsed-lane__info__details {
		display: flex;
		flex-direction: row-reverse;
		align-items: center;
		@apply gap-1;
	}

	.collapsed-lane__label {
		transform: rotate(180deg);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
