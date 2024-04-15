<script lang="ts">
	import Tag from '$lib/components/Tag.svelte';
	import TimeAgo from '$lib/components/TimeAgo.svelte';
	import type { Repository } from '$lib/models/repository';
	import type { Commit } from '$lib/models/commit';
	import AuthorIcon from './AuthorIcon.svelte';
	import { undoCommit } from '$lib/git/commit';
	import { loadLocalCommits } from '$lib/stores/commits';
	import { activeBranch, workingBranch } from '$lib/stores/branch';
	import { error, success } from '$lib/utils/toasts';

	export let repository: Repository;
	export let commit: Commit | null;
	export let isUnapplied = false;

	const isUndoable = !isUnapplied;
</script>

{#if commit}
	<div class="commit">
		<div class="commit__header">
			<div class="commit__message">
				<div class="commit__row">
					<span class="commit__title text-semibold text-base-12">
						{commit?.summary}
					</span>
					{#if isUndoable}
						<Tag
							color="ghost"
							icon="undo-small"
							border
							clickable
							on:click={async (e) => {
								if (commit) {
									try {
										const message = await undoCommit(commit, repository);
										await workingBranch.setWorking(repository);
										await loadLocalCommits(repository, $activeBranch);
										success('Commit undone');
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
{/if}

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
