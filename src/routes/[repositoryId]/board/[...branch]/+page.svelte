<svelte:options runes={true} />

<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { activeBranch, workingBranch } from '$lib/stores/branch';
	import BranchHeader from '$lib/components/BranchHeader.svelte';
	import noChangesSvg from '$lib/assets/illu/rocket-launch.svg?raw';
	import * as hotkeys from '$lib/utils/hotkeys';
	import { writable } from 'svelte/store';
	import { persisted } from '$lib/persisted';
	import { projectLaneCollapsed } from '$lib/stores/config';
	import BranchFiles from '$lib/components/BranchFiles/BranchFiles.svelte';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import type { IStatusResult } from '$lib/git/status';
	import { onDestroy, onMount } from 'svelte';
	import type { ChangedFile } from '$lib/models/status';
	import CommitDialog from '$lib/components/CommitDialog.svelte';
	import { repositoryStore } from '$lib/stores/repository.svelte';
	import { commitStore } from '$lib/stores/commits';
	import type { Commit } from '$lib/models/commit';
	import type { IStashEntry } from '$lib/models/stash-entry';
	import { stashStore } from '$lib/stores/stash';
	import Stash from '$lib/components/Stash.svelte';
	import { unsubscribe } from '$lib/utils/unsubscribe';
	import { createRequestUrl } from '$lib/utils/url';
	import { pushActiveBranch } from '$lib/utils/branch';
	import Commits from '$lib/components/Commits.svelte';
	import FilePreview from '$lib/components/FilePreview.svelte';
	import * as Alert from '$lib/components/ui/alert';
	import CircleAlert from 'lucide-svelte/icons/circle-alert';
	import { cn } from '$lib/utils';

	let { activeRepository } = repositoryStore;

	// let $workingBranch: IStatusResult | null = $state($workingBranch);
	const selectedFiles = writable<ChangedFile[]>([]);
	let commits: Commit[] | null = $state(null);
	let selected: ChangedFile | undefined = $state($selectedFiles[0]);
	let stash: IStashEntry | null = $state(null);
	let isPushing = $state(false);

	let isLaneCollapsed = $state(projectLaneCollapsed(activeRepository.id));

	function setSelected(file: ChangedFile | undefined) {
		selected = file;
		return;
	}

	const unsubscribeCommitStore = commitStore.subscribe((store) => {
		commits = store.localCommits;
	});

	const unsubscribeStashStore = stashStore.subscribe((store) => {
		if (!activeRepository || !$workingBranch) return;
		const identifier = activeRepository.id + '_' + $workingBranch.currentBranch;
		stash = store[identifier];
	});

	const unsubscribeWorkingBranch = workingBranch.subscribe((branch) => {
		// $workingBranch = branch;
		if (branch?.workingDirectory) {
			selectedFiles.set(branch.workingDirectory.files);
		}
		if (branch) {
			const identifier = activeRepository!.id + '_' + branch.currentBranch;
			stash = $stashStore[identifier];
		}
	});

	console.info('[ROUTE] branch');

	onMount(() => {
		if (activeRepository) {
			const notMatching = $workingBranch?.currentTip !== $activeBranch?.tip.sha;
			const shouldUpdate = !$workingBranch || notMatching;
			if (shouldUpdate) {
				workingBranch.setWorking(activeRepository);
			}
			return unsubscribe(
				hotkeys.on('Meta+R', () => {
					createRequestUrl(
						activeRepository,
						($workingBranch as IStatusResult).currentBranch as string
					);
				}),
				hotkeys.on('Meta+P', async () => {
					if (activeRepository && $workingBranch && $activeBranch) {
						isPushing = true;
						await pushActiveBranch(
							activeRepository,
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
		'commitBoxExpanded_' + activeRepository?.id || '' + '_' + $workingBranch?.currentTip || ''
	);

	// $: isLaneCollapsed = projectLaneCollapsed(activeRepository?.id || '');
	$effect(() => {
		if (isLaneCollapsed) {
			$selectedFiles = [];
		}
		if ($commitBoxOpen && $workingBranch?.workingDirectory.files?.length === 0) {
			$commitBoxOpen = false;
		}
	});
	// $: if ($isLaneCollapsed) {
	// 	$selectedFiles = [];
	// }

	// $: if ($commitBoxOpen && $workingBranch?.workingDirectory.files?.length === 0) {
	// 	$commitBoxOpen = false;
	// }
</script>

{#if !$workingBranch || !activeRepository}
	<FullviewLoading />
{:else}
	<div class="flex h-full w-full max-w-full flex-grow flex-col overflow-hidden">
		<div class="z-10 absolute top-0 left-0 w-full h-5" data-tauri-drag-region></div>
		<div class="relative flex flex-col flex-grow h-full">
			<div class="flex flex-grow flex-shrink items-start h-full p-3">
				<div class="flex h-full w-full items-start flex-shrink-0 relative gap-3">
					<div
						class={cn(
							'relative select-none flex flex-col gap-2 max-w-80 overflow-x-hidden h-full',
							!$isLaneCollapsed && 'min-w-80'
						)}
					>
						<BranchHeader
							branch={$workingBranch}
							bind:isLaneCollapsed
							repository={activeRepository}
							{isPushing}
						/>
						{#if !$isLaneCollapsed}
							<div class="flex grow overflow-hidden">
								{#if activeRepository && $workingBranch.workingDirectory.files && $workingBranch.workingDirectory.files?.length > 0}
									<Card.Root class="flex flex-col w-full justify-between">
										<BranchFiles
											files={$workingBranch.workingDirectory.files}
											repository={activeRepository}
											{selectedFiles}
											showCheckboxes={$commitBoxOpen}
											{selected}
											{setSelected}
										/>
										{#if $workingBranch.doConflictedFilesExist}
											<div class="flex flex-col pt-0 px-3 pb-3">
												<Alert.Root variant="destructive">
													<CircleAlert class="h-4 w-4" />
													<Alert.Description>
														{#if $workingBranch.workingDirectory.files?.some((f) => f.status.kind == 'Conflicted')}
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
												repositoryId={activeRepository.id}
												branch={$workingBranch}
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
											<div
												class="[&>svg]:w-40 [&>svg]:h-40 [&>svg>path]:fill-muted-foreground opacity-20"
											>
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
							<Commits {commits} repository={activeRepository} />
						{/if}
					</div>
					<FilePreview
						isCommitedFile={false}
						{selected}
						{setSelected}
						repository={activeRepository}
						showCommands
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
