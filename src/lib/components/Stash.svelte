<script lang="ts">
	import { dropGitfoxStashEntry, getStashedFiles, popStashEntry } from '$lib/git/stash';
	import noSelectSvg from '$lib/assets/empty-state/lane-new.svg?raw';
	import { StashedChangesLoadStates, type IStashEntry } from '$lib/models/stash-entry';
	import { activeRepository } from '$lib/stores/repository';
	import { onMount } from 'svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import Modal from './Modal.svelte';
	import { getVSIFileIcon } from '$lib/ext-icons';
	import { slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import FileCard from './FileCard.svelte';
	import type { CommittedFileChange } from '$lib/models/status';
	import { error, success } from '$lib/utils/toasts';
	import { updateCurrentBranch } from '$lib/store-updater';
	import { activeBranch } from '$lib/stores/branch';
	import { writable } from 'svelte/store';
	import { stashStore } from '$lib/stores/stash';

	export let stash: IStashEntry;

	let stashModal: Modal;
	let persistedStash = writable(stash);
	let selected: CommittedFileChange | undefined = undefined;

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
				await dropGitfoxStashEntry($activeRepository, $persistedStash.stashSha);
				stashStore.removeStash($activeRepository.id + '_' + $activeBranch.name);
				stashModal.close();
				success('Stash discarded');
				await updateCurrentBranch($activeRepository, $activeBranch);
			}
		} catch (e) {
			console.error(e);
			stashModal.close();
			error('Stash could not be discarded');
		}
	};

	const onRestoreClick = async () => {
		try {
			if ($activeRepository) {
				await popStashEntry($activeRepository, $persistedStash.stashSha);
				stashStore.removeStash($activeRepository.id + '_' + $activeBranch.name);
				stashModal.close();
				success('Stash restored');
				await updateCurrentBranch($activeRepository, $activeBranch);
			}
		} catch (e) {
			console.error(e);
			stashModal.close();
			error('Stash could not be restored');
		}
	};

	onMount(() => {
		loadFilesForCurrentStashEntry();
	});
</script>

<button class="btn card" type="button" on:mousedown={() => stashModal.show()}>
	<span class="text-base-14 text-semibold">Stashed changes</span>
	<Icon name="pin" />
</button>

<Modal width="full" height="full" title="Stashed files" bind:this={stashModal}>
	<div class="grid grid-cols-2 divide-x divide-light-200 dark:divide-dark-400 h-full">
		<div class="list-item-wrapper">
			{#if $persistedStash.files}
				{@const files =
					$persistedStash.files.kind === StashedChangesLoadStates.Loaded
						? $persistedStash.files.files
						: []}
				{#each files as file (file.id)}
					<div
						class="file-list-item"
						id={`file-${file.id}`}
						on:click={() => (selected = file)}
						on:keydown
						role="button"
						tabindex="0"
						class:selected={selected?.id === file.id}
					>
						<div class="info-wrap">
							<div class="info">
								<img draggable="false" class="file-icon" src={getVSIFileIcon(file.path)} alt="js" />
								<span class="text-base-12 name">
									{file.path.split('/').pop()}
								</span>
								<span class="text-base-12 path">
									{file.path}
								</span>
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
		<div class="preview-wrapper">
			{#if selected && $activeRepository}
				<div
					class="file-preview resize-viewport"
					in:slide={{ duration: 180, easing: quintOut, axis: 'x' }}
				>
					<FileCard
						file={selected}
						isCommitedFile={true}
						repository={$activeRepository}
						readonly={selected.status.kind !== 'Conflicted'}
						selectable={false}
						on:close={() => {
							selected = undefined;
						}}
					/>
				</div>
			{:else}
				<div class="no-selected">
					{@html noSelectSvg}
					<h2 class="text-base-body-13">No selected file</h2>
				</div>
			{/if}
		</div>
	</div>
	<svelte:fragment slot="controls" let:close>
		<Button kind="filled" color="success" on:click={onRestoreClick}>Restore</Button>
		<Button kind="filled" color="warn" on:click={onDiscardClick}>Discard</Button>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	.card {
		display: flex;
		flex-grow: 1;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
		color: var(--clr-theme-scale-warn-20);
		background: color-mix(in srgb, var(--clr-core-warn-50), transparent 80%);
		border-color: var(--clr-theme-scale-warn-60);
		padding: var(--size-8);
		border-radius: var(--radius-m);
	}
	.list-item-wrapper {
		display: flex;
		gap: var(--size-8);
		padding: 0 var(--size-8);
	}

	.file-list-item {
		flex: 1;
		display: flex;
		align-items: center;
		height: var(--size-28);
		padding: var(--size-4) var(--size-8);
		gap: var(--size-16);
		border-radius: var(--radius-s);
		max-width: 100%;
		overflow: hidden;
		text-align: left;
		user-select: none;
		outline: none;
		margin-bottom: var(--size-2);
		transition: background-color var(--transition-fast);
		background: var(--clr-theme-container-light);
		&:not(.selected-draggable):hover {
			transition: none;
			background-color: color-mix(
				in srgb,
				var(--clr-theme-container-light),
				var(--darken-tint-light)
			);
		}
	}

	.info-wrap {
		display: flex;
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		gap: var(--size-10);
		overflow: hidden;
	}
	.info {
		display: flex;
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		gap: var(--size-6);
		overflow: hidden;
	}

	.file-icon {
		width: var(--size-12);
	}
	.name {
		color: var(--clr-theme-scale-ntrl-0);
		white-space: nowrap;
		flex-shrink: 0;
		text-overflow: ellipsis;
		overflow: hidden;
		line-height: 120%;
	}
	.path {
		color: var(--clr-theme-scale-ntrl-0);
		line-height: 120%;
		flex-shrink: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		opacity: 0.3;
	}
	.selected {
		background-color: var(--clr-theme-scale-pop-80);

		&:hover {
			background-color: color-mix(in srgb, var(--clr-theme-scale-pop-80), var(--darken-extralight));
		}
	}

	.preview-wrapper {
		padding: 0 var(--size-8);
	}
	.no-selected {
		user-select: none;
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		align-items: center;
		color: var(--clr-theme-scale-ntrl-60);
		text-align: center;
		justify-content: center;
		height: 100%;
		cursor: default; /* was defaulting to text cursor */
	}
</style>
