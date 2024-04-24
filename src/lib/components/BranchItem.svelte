<script lang="ts">
	import BranchIcon from './BranchIcon.svelte';
	import { goto } from '$app/navigation';
	import AheadBehind from './AheadBehind.svelte';
	import { defaultBranch, workingBranch } from '$lib/stores/branch';
	import { checkout } from '$lib/git/cli';
	import { type Branch } from '$lib/models/branch';
	import TimeAgo from './TimeAgo.svelte';
	import AuthorIcon from './AuthorIcon.svelte';
	import type { Repository } from '$lib/models/repository';
	import Modal from './Modal.svelte';
	import { error } from '$lib/utils/toasts';
	import BranchContextMenu from './BranchContextMenu.svelte';
	import { onDestroy } from 'svelte';
	import { updateCurrentBranch } from '$lib/store-updater';
	import SwitchBranch from './SwitchBranch.svelte';
	import { untracked } from '$lib/stores/modal';

	export let repository: Repository;
	export let branch: Branch;
	export let selected = false;
	let untrackedModal: Modal;

	function updateContextMenu() {
		if (popupMenu) popupMenu.$destroy();
		return new BranchContextMenu({
			target: document.body,
			props: { repository }
		});
	}

	untracked.subscribe((u) => {
		untrackedModal = u as any;
	});

	$: popupMenu = updateContextMenu();

	onDestroy(() => {
		if (popupMenu) {
			popupMenu.$destroy();
		}
	});

	$: href = `/${repository.id}/board/${branch.name}`;
</script>

<button
	class="branch"
	class:selected
	on:contextmenu|preventDefault={(e) =>
		branch.ref !== $defaultBranch.ref &&
		popupMenu.openByMouse(e, {
			branch,
			untrackedModal
		})}
	on:click={async () => {
		if (selected) return;
		if ($workingBranch?.workingDirectory.files.length === 0) {
			try {
				await checkout(repository.path, branch.name);
				updateCurrentBranch(repository, branch);
				if (href) goto(href);
			} catch (e) {
				error('Failed to switch branch');
			}
		} else {
			untrackedModal.show({
				branch
			});
			console.log('You have uncommitted changes');
		}
	}}
>
	<BranchIcon name={branch.remoteExists ? 'remote-branch' : 'local-branch'} />
	<div class="branch__info flex flex-col gap-2">
		<div class="branch__details">
			<p class="text-base-13 branch__name">
				{branch.name}
			</p>
			<AheadBehind ahead={branch.aheadBehind.ahead} behind={branch.aheadBehind.behind} />
		</div>
		<div class="branch__details">
			<span class="branch__author text-base-11 details truncate">
				<TimeAgo date={branch.tip.author.date} />
				{#if branch.tip.author}
					by {branch.tip.author?.name ?? 'unknown'}
				{/if}
			</span>
			{#key branch.tip.author.email}
				<AuthorIcon email={branch.tip.author.email} />
			{/key}
		</div>
	</div>
</button>
<SwitchBranch {href} {branch} />

<style lang="postcss">
	.branch {
		display: flex;
		gap: var(--size-10);
		width: 100%;

		padding: var(--size-10) var(--size-8);
		border-radius: var(--radius-m);
		transition: background-color var(--transition-fast);
	}

	.branch__info {
		display: flex;
		flex-grow: 1;
		flex-direction: column;
		gap: var(--size-6);
		overflow: hidden;
	}

	.branch__details {
		display: flex;
		align-items: center;
		gap: var(--size-6);
		justify-content: space-between;
	}

	.branch__name {
		white-space: nowrap;
		overflow-x: hidden;
		text-overflow: ellipsis;
		line-height: 120%;
	}

	.branch__author {
		color: var(--clr-theme-scale-ntrl-50);
	}

	.selected {
		cursor: default;
	}

	.branch:not(.selected):hover,
	.branch:not(.selected):focus,
	.selected {
		background-color: color-mix(in srgb, transparent, var(--darken-tint-light));
		transition: none;
	}
</style>
