<script lang="ts">
	import * as Dialog from './ui/dialog';
	import { dropGitraffeStashEntry, getStashedFiles, popStashEntry } from '$lib/git/stash';
	import { StashedChangesLoadStates, type IStashEntry } from '$lib/models/stash-entry';
	import { activeRepository } from '$lib/stores/repository';
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import type { ChangedFile } from '$lib/models/status';
	import { updateCurrentBranch } from '$lib/store-updater';
	import { activeBranch } from '$lib/stores/branch';
	import { writable } from 'svelte/store';
	import { stashStore } from '$lib/stores/stash';
	import FilePreview from './FilePreview.svelte';
	import BranchFiles from './BranchFiles/BranchFiles.svelte';
	import Tag from './Tag.svelte';
	import { Button } from './ui/button';
	import { toast } from 'svelte-sonner';

	export let stash: IStashEntry;

	let persistedStash = writable(stash);
	let selected: ChangedFile | undefined = undefined;
	let dialogStashFilesOpen = false;

	async function loadFilesForCurrentStashEntry() {
		if (!stash || stash.files.kind !== StashedChangesLoadStates.NotLoaded) {
			return;
		}
		persistedStash.update((prev) => ({
			...prev,
			files: {
				kind: StashedChangesLoadStates.Loading
			}
		}));
		if ($activeRepository) {
			try {
				const files = await getStashedFiles($activeRepository, stash.stashSha);
				persistedStash.update((prev) => ({
					...prev,
					files: {
						kind: StashedChangesLoadStates.Loaded,
						files
					}
				}));
			} catch (e) {
				console.log(e);
			}
		}
	}

	const onDiscardClick = async () => {
		try {
			if ($activeRepository) {
				await dropGitraffeStashEntry($activeRepository, $persistedStash.stashSha);
				stashStore.removeStash($activeRepository.id + '_' + $activeBranch.name);
				dialogStashFilesOpen = false;
				toast.success('Stash discarded');
				await updateCurrentBranch($activeRepository, $activeBranch);
			}
		} catch (e) {
			console.error(e);
			dialogStashFilesOpen = false;
			toast.error('Stash could not be discarded');
		}
	};

	const onRestoreClick = async () => {
		try {
			if ($activeRepository) {
				await popStashEntry($activeRepository, $persistedStash.stashSha);
				stashStore.removeStash($activeRepository.id + '_' + $activeBranch.name);
				dialogStashFilesOpen = false;
				toast.success('Stash restored');
				await updateCurrentBranch($activeRepository, $activeBranch);
			}
		} catch (e) {
			console.error(e);
			dialogStashFilesOpen = false;
			toast.error('Stash could not be restored');
		}
	};

	onMount(() => {
		loadFilesForCurrentStashEntry();
	});
</script>

<Tag color="warning" size="medium" wide clickable on:click={() => (dialogStashFilesOpen = true)}>
	<span class="text-xs font-semibold">Stashed changes</span>
	<Icon name="pr-draft" />
</Tag>

<Dialog.Root bind:open={dialogStashFilesOpen}>
	<Dialog.Content size="full" class="flex flex-col justify-stretch">
		<Dialog.Header>
			<Dialog.Title>Stashed Files</Dialog.Title>
		</Dialog.Header>
		<div class="grid grid-cols-2 h-full w-full divide-x">
			<div class="flex flex-col gap-2 px-2 grow">
				{#if $persistedStash.files && $activeRepository}
					{@const files =
						$persistedStash.files.kind === StashedChangesLoadStates.Loaded
							? $persistedStash.files.files
							: []}
					<BranchFiles
						{files}
						repository={$activeRepository}
						{selected}
						setSelected={(file) => (selected = file)}
					/>
				{/if}
			</div>
			<div class="pl-2 grow">
				{#if $activeRepository}
					<FilePreview
						{selected}
						isCommitedFile={true}
						repository={$activeRepository}
						setSelected={(file) => (selected = file)}
					/>
				{/if}
			</div>
		</div>
		<Dialog.Footer class="row-span-1">
			<Button variant="default" color="success" on:click={onRestoreClick}>Restore</Button>
			<Button variant="secondary" color="error" on:click={onDiscardClick}>Discard</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
