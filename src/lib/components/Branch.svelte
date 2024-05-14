<script lang="ts">
	import { goto } from '$app/navigation';
	import { updateCurrentBranch } from '$lib/store-updater';
	import { workingBranch } from '$lib/stores/branch';
	import { toast } from 'svelte-sonner';
	import AheadBehind from './AheadBehind.svelte';
	import TimeAgo from './TimeAgo.svelte';
	import AuthorIcon from './AuthorIcon.svelte';
	import type { Branch } from '$lib/models/branch';
	import type { Repository } from '$lib/models/repository';
	import SwitchBranch from './SwitchBranch.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Icon from './Icon.svelte';
	import { checkoutBranch } from '$lib/git/checkout';

	export let selected = false;
	export let repository: Repository;
	export let branch: Branch;
	export let href: string;
	let dialogSwitchOpen = false;
</script>

<button
	class={'flex w-full rounded-md py-3 px-2 gap-2 hover:bg-muted/90' +
		(selected ? ' bg-muted/90 cursor-default' : '')}
	on:click={async () => {
		if (selected) return;
		if ($workingBranch?.workingDirectory.files.length === 0) {
			try {
				await checkoutBranch(repository, null, branch);
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
	<Tooltip.Root>
		<Tooltip.Trigger class="cursor-auto flex">
			<Icon
				color={branch.localExists ? (branch.remoteExists ? 'neutral' : 'secondary') : 'pop'}
				name={branch.localExists ? (branch.remoteExists ? 'local-remote' : 'local') : 'remote'}
			/>
		</Tooltip.Trigger>
		<Tooltip.Content>
			<p>
				{branch.localExists
					? branch.remoteExists
						? 'Local and remote branch'
						: 'Local branch'
					: 'Remote branch'}
			</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<div class="flex flex-col flex-grow overflow-hidden gap-1">
		<div class="flex items-center justify-between gap-1">
			<p
				class="text-xs font-medium whitespace-nowrap overflow-x-hidden overflow-ellipsis leading-[120%]"
			>
				{branch.name}
			</p>
			{#if branch.aheadBehind}
				<AheadBehind ahead={branch.aheadBehind.ahead} behind={branch.aheadBehind.behind} />
			{/if}
		</div>
		<div class="flex items-center justify-between gap-1">
			<span class="text-gray-400 text-[0.7rem] details truncate">
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
