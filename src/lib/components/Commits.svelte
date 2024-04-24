<script lang="ts">
	import { undoCommit } from '$lib/git/commit';
	import type { Commit } from '$lib/models/commit';
	import type { Repository } from '$lib/models/repository';
	import { activeBranch, workingBranch } from '$lib/stores/branch';
	import { commitStore, loadLocalCommits } from '$lib/stores/commits';
	import { error, success } from '$lib/utils/toasts';
	import AuthorIcon from './AuthorIcon.svelte';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import Tag from './Tag.svelte';
	import TimeAgo from './TimeAgo.svelte';
	import { activeRepository } from '$lib/stores/repository';
	import type { ChangedFile, CommittedFileChange } from '$lib/models/status';
	import { getChangedFiles } from '$lib/git/log';
	import Select from './Select.svelte';
	import SelectItem from './SelectItem.svelte';
	import FilePreview from './FilePreview.svelte';
	import BranchFiles from './BranchFiles/BranchFiles.svelte';

	export let commits: Commit[];
	export let repository: Repository;
	export let offset: number | undefined = undefined;
	export let scaleFactor: number | undefined = undefined;

	const CARD_OFFSET = offset || 8;
	const SCALE_FACTOR = scaleFactor || 0.02;
	let files: CommittedFileChange[] = [];
	let selected: ChangedFile | undefined = undefined;
	let selectedCommit: Commit | undefined = commits[0];
	let commitsModal: Modal;

	const setFilesForCommit = (sha: Commit['sha']) => {
		selectedCommit = commits.find((commit) => commit.sha === sha);
		selected = undefined;
		getChangedFiles(repository, sha).then((change) => {
			files = change.files;
		});
	};

	const openModal = () => {
		if (selectedCommit) {
			setFilesForCommit(selectedCommit.sha);
		}
		commitsModal.show();
	};
</script>

<button
	type="button"
	on:click={openModal}
	class="relative w-full h-20 btn flex flex-col text-left"
	style:margin-top={`${(commits.length - 1) * CARD_OFFSET}px`}
>
	{#each commits as commit, index}
		<div
			style:transform-origin="top center"
			style:top={`${index * -CARD_OFFSET}px`}
			style:scale={1 - index * SCALE_FACTOR}
			style:z-index={commits.length - index}
			class="relative w-full"
		>
			<div class="commit absolute w-full h-20">
				<div class="commit__header">
					<div class="commit__message">
						<div class="commit__row">
							<span class="commit__title text-semibold text-base-12">
								{commit.summary}
							</span>
							{#if index === 0}
								<Tag
									color="ghost"
									icon="undo-small"
									border
									clickable
									on:click={async (e) => {
										e.stopPropagation();
										if (commit) {
											try {
												const message = await undoCommit(commit, repository);
												await workingBranch.setWorking(repository);
												const commits = await loadLocalCommits(repository, $activeBranch);
												commitStore.set(commits);
												success(`Commit ${message?.summary} undone`);
											} catch (e) {
												console.error('Failed to undo commit', e);
												error('Failed to undo commit');
											}
										}
									}}>Undo</Tag
								>
							{/if}
						</div>
						<span class="commit__body text-base-body-12 max-h-20 overflow-x-scroll">
							{commit.body}
						</span>
					</div>
					<div class="commit__row">
						<div class="commit__author">
							<AuthorIcon email={commit.author.email} />
							<span class="commit__author-name text-base-12 truncate">{commit.author.name}</span>
						</div>
						<span class="commit__time text-base-11">
							<TimeAgo date={commit.author.date} />
						</span>
					</div>
				</div>
			</div>
		</div>
	{/each}
</button>

<Modal width="full" height="full" title="Commited Files" bind:this={commitsModal}>
	<div class="h-full flex flex-col gap-4 divide-y divide-light-200 dark:divide-dark-400">
		<Select
			label="Select a commit"
			items={commits.map((commit) => ({ name: commit.summary, value: commit.sha }))}
			itemId="value"
			labelId="name"
			on:select={(e) => setFilesForCommit(e.detail.item.value)}
			selectedItemId={selectedCommit?.sha}
		>
			<SelectItem slot="template" selected={selectedCommit?.sha === item.value} let:item>
				{item.name}
			</SelectItem>
		</Select>
		<div class="grid grid-cols-2 divide-x divide-light-200 dark:divide-dark-400 h-full py-4">
			<BranchFiles {files} {repository} {selected} setSelected={(file) => (selected = file)} />
			{#if $activeRepository}
				<FilePreview {selected} {repository} />
			{/if}
		</div>
	</div>
	<svelte:fragment slot="controls" let:close>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	.commit {
		display: flex;
		flex-direction: column;

		border-radius: var(--size-6);
		background-color: var(--clr-theme-container-light);
		border: 1px dashed var(--clr-theme-container-outline-light);
		overflow: hidden;
		transition: background-color var(--transition-fast);

		&:not(.is-commit-open):hover {
			border: 1px dashed
				color-mix(in srgb, var(--clr-theme-container-outline-light), var(--darken-tint-mid));
			background-color: color-mix(
				in srgb,
				var(--clr-theme-container-light),
				var(--darken-tint-extralight)
			);
		}
	}

	.commit__header {
		display: flex;
		flex-direction: column;
		gap: var(--size-10);
		padding: var(--size-14);
	}

	.commit__message {
		display: flex;
		flex-direction: column;
		gap: var(--size-6);
	}

	.commit__title {
		flex: 1;
		display: block;
		color: var(--clr-theme-scale-ntrl-0);
		width: 100%;
	}

	.commit__body {
		flex: 1;
		display: block;
		width: 100%;
		color: var(--clr-theme-scale-ntrl-40);
		white-space: pre-line;
		word-wrap: anywhere;
	}

	.commit__row {
		display: flex;
		align-items: center;
		gap: var(--size-8);
	}

	.commit__author {
		display: block;
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--size-6);
	}

	.commit__author-name {
		max-width: calc(100% - var(--size-16));
	}

	.commit__time,
	.commit__author-name {
		color: var(--clr-theme-scale-ntrl-50);
	}
</style>
