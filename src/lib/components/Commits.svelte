<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from './ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import * as Alert from '$lib/components/ui/alert';
	import { undoCommit } from '$lib/git/commit';
	import type { Commit } from '$lib/models/commit';
	import type { Repository } from '$lib/models/repository';
	import { activeBranch, workingBranch } from '$lib/stores/branch';
	import { commitStore, loadLocalCommits } from '$lib/stores/commits';
	import { error, success } from '$lib/utils/toasts';
	import AuthorIcon from './AuthorIcon.svelte';
	import TimeAgo from './TimeAgo.svelte';
	import { activeRepository } from '$lib/stores/repository';
	import type { ChangedFile, CommittedFileChange } from '$lib/models/status';
	import { getChangedFiles } from '$lib/git/log';
	import FilePreview from './FilePreview.svelte';
	import BranchFiles from './BranchFiles/BranchFiles.svelte';
	import { Button } from './ui/button';
	import Icon from './Icon.svelte';
	import { Label } from './ui/label';

	export let commits: Commit[];
	export let repository: Repository;
	export let offset: number | undefined = undefined;
	export let scaleFactor: number | undefined = undefined;

	const CARD_OFFSET = offset || 8;
	const SCALE_FACTOR = scaleFactor || 0.02;
	let files: CommittedFileChange[] = [];
	let selected: ChangedFile | undefined = undefined;
	let selectedCommit: Commit | undefined = commits[0];
	let dialogCommitFilesOpen = false;

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
		dialogCommitFilesOpen = true;
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
			<Card.Root class="absolute w-full h-20 hover:bg-accent overflow-hidden">
				<div class="commit__header">
					<div class="commit__message">
						<div class="commit__row">
							<span class="commit__title text-semibold text-base-12">
								{commit.summary}
							</span>
							{#if index === 0}
								<Button
									size="sm"
									variant="outline"
									icon="undo-small"
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
									}}>Undo</Button
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
			</Card.Root>
		</div>
	{/each}
</button>

<Dialog.Root bind:open={dialogCommitFilesOpen}>
	<Dialog.Content size="full">
		<Dialog.Header>
			<Dialog.Title>Commited Files</Dialog.Title>
		</Dialog.Header>
		<div class="h-[520px] flex flex-col gap-4 divide-y">
			<div class="flex flex-row gap-8">
				<div class="flex gap-2 flex-col">
					<Label for="currentCommit" class="text-md">Select commit</Label>
					<Select.Root
						portal={null}
						selected={{ value: selectedCommit?.sha, label: selectedCommit?.summary }}
						onSelectedChange={(sel) => sel?.value && setFilesForCommit(sel?.value)}
					>
						<Select.Trigger class="w-[296px]">
							<div class="flex flex-row items-center gap-2">
								<Icon name="commit" />
								<Select.Value placeholder="Select a commit" />
							</div>
						</Select.Trigger>
						<Select.Content>
							<Select.Group>
								{#each commits.map( (commit) => ({ label: commit.summary, value: commit.sha }) ) as commit}
									<Select.Item value={commit.value} label={commit.label}>{commit.label}</Select.Item
									>
								{/each}
							</Select.Group>
						</Select.Content>
						<Select.Input name="currentCommit" />
					</Select.Root>
				</div>
				{#if selectedCommit}
					<Alert.Root>
						<Alert.Title>{selectedCommit.summary}</Alert.Title>
						<Alert.Description>
							<div class="commit__row">
								<div class="commit__author">
									<AuthorIcon email={selectedCommit.author.email} />
									<span class="commit__author-name text-base-12 truncate"
										>{selectedCommit.author.name}</span
									>
								</div>
								<span class="commit__time text-base-11">
									<TimeAgo date={selectedCommit.author.date} />
								</span>
							</div>
						</Alert.Description>
					</Alert.Root>
				{/if}
			</div>
			<div class="grid grid-cols-2 divide-x h-full pt-4">
				<BranchFiles {files} {repository} {selected} setSelected={(file) => (selected = file)} />
				{#if $activeRepository}
					<FilePreview {selected} {repository} setSelected={(file) => (selected = file)} />
				{/if}
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

<style lang="postcss">
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