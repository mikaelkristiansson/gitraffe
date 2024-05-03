<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { activeBranch, workingBranch } from '$lib/stores/branch';
	import BranchHeader from '$lib/components/BranchHeader.svelte';
	import noChangesSvg from '$lib/assets/empty-state/lane-no-changes.svg?raw';
	import * as hotkeys from '$lib/utils/hotkeys';
	import { writable } from 'svelte/store';
	import { persisted } from '$lib/persisted';
	import { projectLaneCollapsed } from '$lib/config/config';
	import BranchFiles from '$lib/components/BranchFiles/BranchFiles.svelte';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import type { IStatusResult } from '$lib/git/status';
	import { onDestroy, onMount } from 'svelte';
	import type { ChangedFile } from '$lib/models/status';
	import CommitDialog from '$lib/components/CommitDialog.svelte';
	import { activeRepository } from '$lib/stores/repository';
	import { commitStore } from '$lib/stores/commits';
	import type { Commit } from '$lib/models/commit';
	import type { IStashEntry } from '$lib/models/stash-entry';
	import { stashStore } from '$lib/stores/stash';
	import Stash from '$lib/components/Stash.svelte';
	import { unsubscribe } from '$lib/utils/unsubscribe';
	import { createRequestUrl } from '$lib/utils/url';
	import type { Repository } from '$lib/models/repository';
	import { pushActiveBranch } from '$lib/utils/branch';
	import Commits from '$lib/components/Commits.svelte';
	import FilePreview from '$lib/components/FilePreview.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';

	let branch$: IStatusResult | null = $workingBranch;
	const selectedFiles = writable<ChangedFile[]>([]);
	let commits: Commit[] | null = null;
	let selected: ChangedFile | undefined = $selectedFiles[0];
	let stash: IStashEntry | null = null;
	let isPushing = false;

	function setSelected(file: ChangedFile | undefined) {
		selected = file;
		return;
	}

	const unsubscribeCommitStore = commitStore.subscribe((store) => {
		commits = store.localCommits;
	});

	const unsubscribeStashStore = stashStore.subscribe((store) => {
		if (!$activeRepository || !branch$) return;
		const identifier = $activeRepository.id + '_' + branch$.currentBranch;
		stash = store[identifier];
	});

	const unsubscribeWorkingBranch = workingBranch.subscribe((branch) => {
		branch$ = branch;
		if (branch?.workingDirectory) {
			selectedFiles.set(branch.workingDirectory.files);
		}
		if (branch) {
			const identifier = $activeRepository!.id + '_' + branch.currentBranch;
			stash = $stashStore[identifier];
		}
	});

	console.info('[ROUTE] branch');

	onMount(() => {
		if ($activeRepository) {
			const notMatching = $workingBranch?.currentTip !== $activeBranch?.tip.sha;
			const shouldUpdate = !$workingBranch || notMatching;
			if (shouldUpdate) {
				workingBranch.setWorking($activeRepository);
			}
			return unsubscribe(
				hotkeys.on('Meta+R', () => {
					createRequestUrl(
						$activeRepository as Repository,
						($workingBranch as IStatusResult).currentBranch as string
					);
				}),
				hotkeys.on('Meta+P', async () => {
					if ($activeRepository && $workingBranch && $activeBranch) {
						isPushing = true;
						await pushActiveBranch(
							$activeRepository as Repository,
							$workingBranch as IStatusResult,
							$activeBranch
						);
						isPushing = false;
					}
				})
			);
		}
	});

	onDestroy(() => {
		unsubscribeCommitStore();
		unsubscribeWorkingBranch();
		unsubscribeStashStore();
	});

	const commitBoxOpen = persisted<boolean>(
		true,
		'commitBoxExpanded_' + $activeRepository?.id || '' + '_' + branch$?.currentTip || ''
	);

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
		<div class="z-10 absolute top-0 left-0 w-full h-5" data-tauri-drag-region />
		<div class="relative flex flex-col flex-grow h-full">
			<div class="flex flex-grow flex-shrink items-start h-full p-3">
				<div class="flex h-full w-full items-start flex-shrink-0 relative gap-3">
					<div
						class={`relative select-none flex flex-col gap-2 max-w-80 overflow-x-hidden overflow-y-scroll ${$isLaneCollapsed ? 'h-full' : 'min-w-80'}`}
					>
						<BranchHeader
							branch={branch$}
							bind:isLaneCollapsed
							repository={$activeRepository}
							{isPushing}
						/>
						{#if !$isLaneCollapsed}
							<div>
								{#if $activeRepository && branch$.workingDirectory.files && branch$.workingDirectory.files?.length > 0}
									<Card.Root class="flex flex-col">
										<BranchFiles
											files={branch$.workingDirectory.files}
											repository={$activeRepository}
											{selectedFiles}
											showCheckboxes={$commitBoxOpen}
											{selected}
											{setSelected}
											class="max-h-[12rem] overflow-x-scroll"
										/>
										{#if branch$.doConflictedFilesExist}
											<div class="flex flex-col pt-0 px-3 pb-3">
												<Alert.Root variant="destructive">
													<CircleAlert class="h-4 w-4" />
													<Alert.Description>
														{#if branch$.workingDirectory.files?.some((f) => f.status.kind == 'Conflicted')}
															This virtual branch conflicts with upstream changes. Please resolve
															all conflicts and commit before you can continue.
														{:else}
															Please commit your resolved conflicts to continue.
														{/if}
													</Alert.Description>
												</Alert.Root>
											</div>
										{/if}
										<div class="bg-muted/40">
											<CommitDialog
												repositoryId={$activeRepository.id}
												branch={branch$}
												expanded={commitBoxOpen}
												{setSelected}
												{selectedFiles}
											/>
										</div>
									</Card.Root>
								{:else}
									<Card.Root
										class="flex flex-col items-center flex-grow select-none justify-center py-14 px-0"
										data-dnd-ignore
									>
										<div class="flex flex-col items-center gap-2 max-w-56">
											<div class="w-[7.5rem] mb-3">
												{@html noChangesSvg}
											</div>
											<h2 class="select-none text-muted-foreground text-center text-xs opacity-60">
												No uncommitted changes<br />on this branch
											</h2>
										</div>
									</Card.Root>
								{/if}
							</div>
						{/if}
						{#if stash && !$isLaneCollapsed}
							<Stash {stash} />
						{/if}
						{#if commits && commits.length > 0 && !$isLaneCollapsed}
							<Commits {commits} repository={$activeRepository} />
						{/if}
					</div>
					<FilePreview
						isCommitedFile={false}
						{selected}
						{setSelected}
						repository={$activeRepository}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
