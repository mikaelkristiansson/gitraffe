<script lang="ts">
	import { goto } from '$app/navigation';
	import { checkout } from '$lib/git/cli';
	import { updateCurrentBranch } from '$lib/store-updater';
	import { workingBranch } from '$lib/stores/branch';
	import { toast } from 'svelte-sonner';
	import BranchIcon from './BranchIcon.svelte';
	import AheadBehind from './AheadBehind.svelte';
	import TimeAgo from './TimeAgo.svelte';
	import AuthorIcon from './AuthorIcon.svelte';
	import type { Branch } from '$lib/models/branch';
	import type { Repository } from '$lib/models/repository';
	import SwitchBranch from './SwitchBranch.svelte';

	export let selected = false;
	export let repository: Repository;
	export let branch: Branch;
	export let href: string;
	let dialogSwitchOpen = false;
</script>

<button
	class={'flex w-full rounded-md py-3 px-2 gap-2' + (selected ? ' bg-muted/90 cursor-default' : '')}
	on:click={async () => {
		if (selected) return;
		if ($workingBranch?.workingDirectory.files.length === 0) {
			try {
				await checkout(repository.path, branch.name);
				updateCurrentBranch(repository, branch);
				if (href) goto(href);
			} catch (e) {
				toast.error('Failed to switch branch');
			}
		} else {
			dialogSwitchOpen = true;
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
<SwitchBranch {href} {branch} bind:dialogSwitchOpen />

<style lang="postcss">
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
</style>
