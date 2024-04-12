<script lang="ts">
	import { activeBranch, workingBranch } from '$lib/branch';
	import BranchHeader from '$lib/components/BranchHeader.svelte';
	import laneNewSvg from '$lib/assets/empty-state/lane-new.svg?raw';
	import noChangesSvg from '$lib/assets/empty-state/lane-no-changes.svg?raw';
	import { writable } from 'svelte/store';
	import { persisted } from '$lib/persisted';
	import { projectLaneCollapsed } from '$lib/config/config';
	import BranchFiles from '$lib/components/BranchFiles/BranchFiles.svelte';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import type { IStatusResult } from '$lib/git/status';
	import { onMount } from 'svelte';
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import type { PageData } from '../$types';
	import CommitDialog from '$lib/components/CommitDialog.svelte';
	import { activeRepository } from '$lib/repository';
	import { commitStore } from '$lib/stores/commits';
	import type { Commit } from '$lib/models/commit';
	import CommitCard from '$lib/components/CommitCard.svelte';

	export let data: PageData;

	let branch$: IStatusResult | null = $workingBranch;
	const selectedFiles = writable<WorkingDirectoryFileChange[]>([]);
	let latestLocalCommit: Commit | null = null;

	commitStore.subscribe((store) => {
		latestLocalCommit = store.localCommits[0];
	});

	workingBranch.subscribe((branch) => {
		branch$ = branch;
		if (branch?.workingDirectory) {
			selectedFiles.set(branch.workingDirectory.files);
		}
	});

	onMount(() => {
		if ($activeRepository) {
			const notMatching = $workingBranch?.currentTip !== $activeBranch?.tip.sha;
			const shouldUpdate = !$workingBranch || notMatching;
			if (shouldUpdate) {
				workingBranch.setWorking($activeRepository);
			}
		}
	});

	const commitBoxOpen = persisted<boolean>(
		true,
		'commitBoxExpanded_' + $activeRepository?.id || '' + '_' + branch$?.currentTip || ''
	);
	let isUnapplied = false;

	$: isLaneCollapsed = projectLaneCollapsed($activeRepository?.id || '');
	$: if ($isLaneCollapsed) {
		$selectedFiles = [];
	}

	$: if ($commitBoxOpen && branch$?.workingDirectory.files?.length === 0) {
		$commitBoxOpen = false;
	}
</script>

{#if !branch$ || !$activeRepository}
	<FullviewLoading />
{:else}
	<div class="flex h-full w-full max-w-full flex-grow flex-col overflow-hidden">
		<div class="board-wrapper">
			<div class="board p-3">
				<div class="wrapper">
					<div class={`branch-card ${$isLaneCollapsed ? 'h-full' : 'min-w-80'}`}>
						<BranchHeader
							branch={branch$}
							{isUnapplied}
							bind:isLaneCollapsed
							repository={$activeRepository}
						/>

						<!-- <PullRequestCard
						repositoryId={repository.id}
						{branch}
						{isUnapplied}
						isLaneCollapsed={$isLaneCollapsed}
					/> -->
						{#if !$isLaneCollapsed}
							<div>
								{#if $activeRepository && branch$.workingDirectory.files && branch$.workingDirectory.files?.length > 0}
									<div class="card">
										{#if branch$.doConflictedFilesExist}
											<div class="mb-2 bg-red-500 p-2 font-bold text-white">
												{#if branch$.workingDirectory.files?.some((f) => f.status.kind == 'Conflicted')}
													This virtual branch conflicts with upstream changes. Please resolve all
													conflicts and commit before you can continue.
												{:else}
													Please commit your resolved conflicts to continue.
												{/if}
											</div>
										{/if}
										<BranchFiles
											branchId={branch$.currentTip || branch$.currentBranch || 'branch'}
											files={branch$.workingDirectory.files}
											{isUnapplied}
											repository={$activeRepository}
											{selectedFiles}
											showCheckboxes={$commitBoxOpen}
											allowMultiple={true}
											readonly={false}
										/>
										<!-- {user} -->
										<CommitDialog
											repositoryId={$activeRepository.id}
											branch={branch$}
											expanded={commitBoxOpen}
											{selectedFiles}
										/>
									</div>

									<!-- {:else if branch?.commits?.length == 0}
									<div class="new-branch card" data-dnd-ignore>
										<div class="new-branch__content">
											<div class="new-branch__image">
												{@html laneNewSvg}
											</div>
											<h2 class="new-branch__title text-base-body-15 text-semibold">
												This is a new branch.
											</h2>
											<p class="new-branch__caption text-base-body-13">
												You can drag and drop files or parts of files here.
											</p>
										</div>
									</div> -->
								{:else}
									<!-- TODO: add a check if commits exist -->
									{#if false}
										<div class="new-branch card" data-dnd-ignore>
											<div class="new-branch__content">
												<div class="new-branch__image">
													{@html laneNewSvg}
												</div>
												<h2 class="new-branch__title text-base-body-15 text-semibold">
													This is a new branch.
												</h2>
											</div>
										</div>
									{:else}
										<!-- attention: these markers have custom css at the bottom of thise file -->
										<div class="no-changes card" data-dnd-ignore>
											<div class="new-branch__content">
												<div class="new-branch__image">
													{@html noChangesSvg}
												</div>
												<h2 class="new-branch__caption text-base-body-13">
													No uncommitted changes<br />on this branch
												</h2>
											</div>
										</div>
									{/if}
								{/if}
							</div>
						{/if}
						{#if $activeRepository}
							<CommitCard commit={latestLocalCommit} {isUnapplied} repository={$activeRepository} />
						{/if}
						<!-- branch={branch$}  -->
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style lang="postcss">
	/* BOARD */
	.board-wrapper {
		position: relative;
		display: flex;
		flex-direction: column;
		flex-grow: 1;
		height: 100%;
	}
	.board {
		display: flex;
		flex-grow: 1;
		flex-shrink: 1;
		align-items: flex-start;
		height: 100%;
	}
	.wrapper {
		display: flex;
		height: 100%;
		align-items: self-start;
		flex-shrink: 0;
		user-select: none; /* here because of user-select draggable interference in board */
		position: relative;
		--target-branch-background: var(--clr-theme-container-pale);
		background-color: var(--target-branch-background);
	}
	/* .resizer-wrapper {
		position: relative;
		display: flex;
		height: 100%;
	} */
	.branch-card {
		/* height: 100%; */
		position: relative;
		user-select: none;
		display: flex;
		flex-direction: column;
		gap: var(--size-10);
		/* min-width: 300px; */
		/* overflow-x: hidden;
		overflow-y: scroll; */
	}

	.divider-line {
		z-index: 30;
		position: absolute;
		top: 0;
		right: 0;
		height: 100%;
	}

	.branch-card__dropzone-wrapper {
		display: flex;
		flex-direction: column;
		flex: 1;
		position: relative;
	}

	.branch-card__contents {
		position: relative;
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 100%;
		gap: var(--size-8);
		padding: var(--size-12);
	}

	.card {
		flex: 1;
	}

	.new-branch__content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--size-8);
		max-width: 14rem;
	}

	.new-branch,
	.no-changes {
		user-select: none;
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		align-items: center;
		color: var(--clr-theme-scale-ntrl-60);
		background: var(--clr-theme-container-light);
		justify-content: center;
		padding: var(--size-48) 0;
		border-radius: var(--radius-m);
		cursor: default; /* was defaulting to text cursor */
	}

	.no-changes {
		color: var(--clr-theme-scale-ntrl-40);
		text-align: center;
	}

	.new-branch__title {
		color: var(--clr-theme-scale-ntrl-40);
	}

	.new-branch__caption {
		color: var(--clr-theme-scale-ntrl-50);
		opacity: 0.6;
	}

	.new-branch__caption,
	.new-branch__title {
		text-align: center;
	}

	.new-branch__image {
		width: 7.5rem;
		margin-bottom: var(--size-10);
	}

	.branch-card :global(.contents) {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	/* COLLAPSED LANE */
	.collapsed-lane-wrapper {
		display: flex;
		flex-direction: column;
		padding: var(--size-12);
		height: 100%;
		border-right: 1px solid var(--clr-theme-container-outline-light);
	}
</style>
