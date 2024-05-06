<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { persistedCommitMessage } from '$lib/config/config';
	import { quintOut } from 'svelte/easing';
	import { fly, slide } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import type { IStatusResult } from '$lib/git/status';
	import { createCommit } from '$lib/git/commit';
	import type { ChangedFile, WorkingDirectoryFileChange } from '$lib/models/status';
	import { activeBranch, allBranches, workingBranch } from '$lib/stores/branch';
	import type { Repository } from '$lib/models/repository';
	import { activeRepository } from '$lib/stores/repository';
	import { commitStore, loadLocalCommits } from '$lib/stores/commits';
	import { Button } from './ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { SetSelected } from '$lib/types';
	import { toast } from 'svelte-sonner';

	export let repositoryId: Repository['id'];
	export let branch: IStatusResult;
	export let selectedFiles: Writable<ChangedFile[]>;
	export let expanded: Writable<boolean>;
	export let setSelected: SetSelected;

	const commitMessage = persistedCommitMessage(repositoryId, branch.currentTip || '');

	let isCommitting = false;
	let aiLoading = false;

	let titleTextArea: HTMLTextAreaElement;
	let descriptionTextArea: HTMLTextAreaElement;

	$: [title, description] = splitMessage($commitMessage);

	function splitMessage(message: string) {
		const parts = message.split(/\n+(.*)/s);
		return [parts[0] || '', parts[1] || ''];
	}

	function concatMessage(title: string, description: string) {
		return `${title}\n\n${description}`;
	}

	function focusTextareaOnMount(el: HTMLTextAreaElement) {
		el.focus();
	}

	async function commit() {
		const message = concatMessage(title, description);
		isCommitting = true;
		try {
			if ($activeRepository) {
				const createPromise = await createCommit(
					$activeRepository,
					message.trim(),
					$selectedFiles as WorkingDirectoryFileChange[]
				);
				const updatePromise = await workingBranch.setWorking($activeRepository);
				allBranches.updateBranch($activeBranch);
				const commits = await loadLocalCommits($activeRepository, $activeBranch);
				commitStore.set(commits);
				const allPromises = Promise.all([createPromise, updatePromise, commits]);
				toast.promise(allPromises, {
					loading: 'Committing...',
					success: 'Changes committed',
					error: 'Failed to commit changes'
				});
				setSelected(undefined);
			}
			$commitMessage = '';
		} catch (e) {
			toast.error('Failed to commit changes');
		} finally {
			isCommitting = false;
		}
	}
</script>

<div class="flex flex-col p-3" class:commit-box__expanded={$expanded}>
	{#if $expanded}
		<div class="flex flex-col mb-3" transition:slide={{ duration: 150, easing: quintOut }}>
			<div
				class="flex flex-col relative p-0 pb-10 gap-1 bg-input/30 rounded-sm border border-input"
			>
				<textarea
					value={title}
					placeholder="Commit summary"
					disabled={aiLoading}
					class="text-xs text-foreground font-semibold commit-box__textarea commit-box__textarea__title"
					spellcheck="false"
					rows="1"
					bind:this={titleTextArea}
					use:focusTextareaOnMount
					on:input={(e) => {
						$commitMessage = concatMessage(e.currentTarget.value, description);
					}}
					on:keydown={(e) => {
						if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') commit();
						if (e.key === 'Tab' || e.key === 'Enter') {
							e.preventDefault();
							descriptionTextArea.focus();
						}
					}}
				/>

				{#if title.length > 0}
					<textarea
						value={description}
						disabled={aiLoading}
						placeholder="Commit description (optional)"
						class="text-xs text-foreground commit-box__textarea commit-box__textarea__description"
						spellcheck="false"
						rows="1"
						bind:this={descriptionTextArea}
						on:input={(e) => {
							$commitMessage = concatMessage(title, e.currentTarget.value);
						}}
						on:keydown={(e) => {
							const value = e.currentTarget.value;
							if (e.key == 'Backspace' && value.length == 0) {
								e.preventDefault();
								titleTextArea.focus();
							} else if (e.key == 'a' && (e.metaKey || e.ctrlKey) && value.length == 0) {
								// select previous textarea on cmd+a if this textarea is empty
								e.preventDefault();
								titleTextArea.select();
							}
						}}
					/>
				{/if}

				{#if title.length > 50}
					<Tooltip.Root>
						<Tooltip.Trigger class="cursor-auto">
							<div
								transition:fly={{ y: 2, duration: 150 }}
								class="absolute flex bottom-3 left-3 rounded-full p-1"
							>
								<Icon name="blitz" />
							</div>
						</Tooltip.Trigger>
						<Tooltip.Content
							>50 characters or less is best. Extra info can be added in the description.</Tooltip.Content
						>
					</Tooltip.Root>
				{/if}
			</div>
		</div>
	{/if}
	<div class="actions">
		{#if $expanded && !isCommitting}
			<Button
				variant="outline"
				id="commit-to-branch"
				on:click={() => {
					$expanded = false;
				}}
			>
				Cancel
			</Button>
		{/if}
		<Button
			class="flex-grow"
			variant="default"
			disabled={(isCommitting || !title) && $expanded}
			loading={isCommitting}
			id="commit-to-branch"
			on:click={() => {
				if ($expanded) {
					commit();
				} else {
					$expanded = true;
				}
			}}
		>
			{$expanded ? 'Commit' : 'Commit changes'}
		</Button>
	</div>
</div>

<style lang="postcss">
	.commit-box__textarea {
		overflow: hidden;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		@apply gap-4;
		background: none;
		resize: none;
		&:focus {
			outline: none;
		}
	}

	.commit-box__textarea__title {
		@apply pt-4 px-3 pb-0;
	}

	.commit-box__textarea__description {
		@apply py-0 px-3;
	}

	.actions {
		display: flex;
		justify-content: right;
		@apply gap-2;
	}
</style>
