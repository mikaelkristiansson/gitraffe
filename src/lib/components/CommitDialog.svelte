<script lang="ts">
	// import { AIService } from '$lib/backend/aiService';
	// import Checkbox from '$lib/components/Checkbox.svelte';
	// import DropDownButton from '$lib/components/DropDownButton.svelte';
	import Icon from '$lib/components/Icon.svelte';
	// import ContextMenu from '$lib/components/contextmenu/ContextMenu.svelte';
	// import ContextMenuItem from '$lib/components/contextmenu/ContextMenuItem.svelte';
	// import ContextMenuSection from '$lib/components/contextmenu/ContextMenuSection.svelte';
	import {
		projectAiGenEnabled,
		projectCommitGenerationExtraConcise,
		projectCommitGenerationUseEmojis,
		projectRunCommitHooks,
		persistedCommitMessage
	} from '$lib/config/config';
	// import { getContextByClass } from '$lib/utils/context';
	// import { createEventDispatcher, onMount } from 'svelte';
	import { quintOut } from 'svelte/easing';
	import { fly, slide } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import type { IStatusResult } from '$lib/git/status';
	import { createCommit } from '$lib/git/commit';
	import type { ChangedFile, WorkingDirectoryFileChange } from '$lib/models/status';
	import { allBranches, workingBranch } from '$lib/stores/branch';
	import type { Repository } from '$lib/models/repository';
	import { activeRepository } from '$lib/stores/repository';
	import { commitStore, loadLocalCommits } from '$lib/stores/commits';
	import { Button } from './ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { SetSelected } from '$lib/types';
	import { toast } from 'svelte-sonner';

	// const aiService = getContextByClass(AIService);

	// const dispatch = createEventDispatcher<{
	// 	action: 'generate-branch-name';
	// }>();

	export let repositoryId: Repository['id'];
	export let branch: IStatusResult;
	// export let user: User | undefined;
	export let selectedFiles: Writable<ChangedFile[]>;
	export let expanded: Writable<boolean>;
	export let setSelected: SetSelected;

	const aiGenEnabled = projectAiGenEnabled(repositoryId);
	const commitMessage = persistedCommitMessage(repositoryId, branch.currentTip || '');
	// const runCommitHooks = projectRunCommitHooks(repositoryId);
	// const commitGenerationExtraConcise = projectCommitGenerationExtraConcise(repositoryId);
	// const commitGenerationUseEmojis = projectCommitGenerationUseEmojis(repositoryId);

	let isCommitting = false;
	let aiLoading = false;

	// let contextMenu: ContextMenu;

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
				await createCommit(
					$activeRepository,
					message.trim(),
					$selectedFiles as WorkingDirectoryFileChange[]
				);
				await workingBranch.setWorking($activeRepository);
				const updateBranch = $allBranches.find((b) => b.tip.sha === branch.currentTip);
				if (updateBranch) {
					allBranches.updateBranch(updateBranch);
					const commits = await loadLocalCommits($activeRepository, updateBranch);
					commitStore.set(commits);
				}
				setSelected(undefined);
				toast.success('Changes committed');
			}
			$commitMessage = '';
		} catch (e) {
			toast.error('Failed to commit changes');
		} finally {
			isCommitting = false;
		}
	}

	// async function generateCommitMessage(files: LocalFile[]) {
	// 	const diff = files
	// 		.map((f) => f.hunks.filter((h) => $selectedOwnership.containsHunk(f.id, h.id)))
	// 		.flat()
	// 		.map((h) => h.diff)
	// 		.flat()
	// 		.join('\n')
	// 		.slice(0, 5000);

	// 	// Branches get their names generated only if there are at least 4 lines of code
	// 	// If the change is a 'one-liner', the branch name is either left as "virtual branch"
	// 	// or the user has to manually trigger the name generation from the meatball menu
	// 	// This saves people this extra click
	// 	if (branch.name.toLowerCase().includes('virtual branch')) {
	// 		dispatch('action', 'generate-branch-name');
	// 	}

	// 	aiLoading = true;
	// 	try {
	// 		const generatedMessage = await aiService.summarizeCommit({
	// 			diff,
	// 			useEmojiStyle: $commitGenerationUseEmojis,
	// 			useBriefStyle: $commitGenerationExtraConcise,
	// 			userToken: user?.access_token
	// 		});

	// 		if (generatedMessage) {
	// 			$commitMessage = generatedMessage;
	// 		} else {
	// 			toast.error('Failed to generate commit message');
	// 		}
	// 	} catch {
	// 		toast.error('Failed to generate commit message');
	// 	} finally {
	// 		aiLoading = false;
	// 	}

	// 	setTimeout(() => {
	// 		updateHeights();
	// 		descriptionTextArea.focus();
	// 	}, 0);
	// }

	let aiConfigurationValid = false;

	// onMount(async () => {
	// 	aiConfigurationValid = await aiService.validateConfiguration(user?.access_token);
	// });
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
				variant="secondary"
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
	.commit-box__textarea-wrapper {
		display: flex;
		position: relative;
		@apply pb-10;
		flex-direction: column;
		@apply gap-1;
	}

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
		@apply pt-3 px-3 pb-0;
	}

	.commit-box__textarea__description {
		@apply py-0 px-3;
	}

	.commit-box__texarea-actions {
		position: absolute;
		display: flex;
		@apply right-3 bottom-3;
	}

	.actions {
		display: flex;
		justify-content: right;
		@apply gap-2;
	}
</style>
