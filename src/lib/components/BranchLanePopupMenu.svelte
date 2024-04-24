<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import ContextMenu from '$lib/components/contextmenu/ContextMenu.svelte';
	import ContextMenuItem from '$lib/components/contextmenu/ContextMenuItem.svelte';
	import ContextMenuSection from '$lib/components/contextmenu/ContextMenuSection.svelte';
	import { checkout } from '$lib/git/cli';
	import { getRemotes } from '$lib/git/remote';
	import type { IStatusResult } from '$lib/git/status';
	import type { Commit } from '$lib/models/commit';
	import { activeBranch, allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import { activeRepository } from '$lib/stores/repository';
	import { deleteBranch } from '$lib/utils/branch';
	import { findDefaultRemote } from '$lib/utils/find-default-remote';
	import { fetchRemote } from '$lib/utils/remote';
	import * as toasts from '$lib/utils/toasts';
	import Icon from './Icon.svelte';
	import InfoMessage from './InfoMessage.svelte';

	export let branch: IStatusResult;
	export let commits: ReadonlyArray<Commit>;
	export let visible: boolean;

	let deleteBranchModal: Modal;

	$: commits = commits;
</script>

{#if visible}
	<ContextMenu>
		{#if branch.currentBranch !== $defaultBranch.name}
			<ContextMenuSection>
				<ContextMenuItem
					label="Delete branch"
					icon="bin-small"
					on:click={async () => {
						deleteBranchModal.show(branch);
						visible = false;
					}}
				/>
			</ContextMenuSection>
		{/if}
		<ContextMenuSection>
			<ContextMenuItem
				label="Fetch from remote"
				icon="remote"
				on:click={async () => {
					if ($activeRepository) {
						const remotes = await getRemotes($activeRepository);
						const remote = findDefaultRemote(remotes);
						const remoteName = branch.currentUpstreamBranch || remote?.name;
						if (remoteName && remote) {
							const safeRemote = { name: remoteName, url: remote.url };
							fetchRemote(null, $activeRepository, safeRemote, false);
						}
					}
					visible = false;
				}}
			/>
		</ContextMenuSection>
	</ContextMenu>
{/if}

<Modal width="small" title="Delete branch" bind:this={deleteBranchModal} let:item={branch}>
	<div class="flex flex-col gap-4">
		<div class="flex items-center gap-4">
			<Icon name="warning" size={30} opacity={0.8} color="warn" />
			<div>
				Delete branch <span class="tag">{branch.currentBranch}</span> ? <br />
				This action cannot be undone
			</div>
		</div>
		{#if branch.currentBranch === $workingBranch?.currentBranch && $workingBranch?.workingDirectory.files.length !== 0}
			<InfoMessage>
				You have changes on the branch that are not committed. Deleting this branch will bring these
				changes to next branch.
				<ul class="file-list">
					{#if $workingBranch?.workingDirectory}
						{#each $workingBranch?.workingDirectory.files as file}
							<li>
								<code class="whitespace-pre-wrap break-words">{file.path}</code>
							</li>
						{/each}
					{/if}
				</ul>
			</InfoMessage>
		{/if}
	</div>
	<svelte:fragment slot="controls" let:close let:item={branch}>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
		<Button
			color="error"
			on:click={async () => {
				if ($activeRepository && branch) {
					try {
						await deleteBranch($activeRepository, $activeBranch, $activeBranch, $defaultBranch);
						deleteBranchModal.close();
						toasts.success(`Deleting branch ${branch.currentBranch}`);
						await allBranches.fetch($activeRepository, {
							defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD'
						});
						if (branch.currentBranch === $workingBranch?.currentBranch) {
							await checkout($activeRepository.path, $defaultBranch.name);
							activeBranch.setActive($defaultBranch);
							await workingBranch.setWorking($activeRepository);
						}
					} catch (e) {
						console.error('Failed to delete branch', e);
						toasts.error('Failed to delete branch');
					}
					console.log('delete branch', branch.currentBranch);
				}
			}}
		>
			Confirm
		</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	.tag {
		height: var(--size-control-s);
		padding: var(--size-2) var(--size-4);
		border-radius: var(--radius-m);
		transition: background-color var(--transition-fast);
		color: var(--clr-theme-scale-warn-20);
		background: color-mix(in srgb, var(--clr-core-warn-50), transparent 80%);
		box-shadow: inset 0 0 0 1px var(--clr-theme-scale-warn-60);
	}
	.file-list {
		list-style: disc;
		padding-left: var(--size-26);
		background-color: var(--bg-card);
		border-radius: var(--radius-m);
	}
	.file-list li {
		padding: var(--size-2);
		padding-left: var(--size-1);
	}
</style>
