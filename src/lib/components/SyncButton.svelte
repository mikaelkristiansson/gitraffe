<script lang="ts">
	import TimeAgo from './TimeAgo.svelte';
	import { allBranches, defaultBranch, lastSynced, workingBranch } from '$lib/stores/branch';
	import { fetchAll } from '$lib/git/cli';
	import type { Repository } from '$lib/models/repository';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { toast } from 'svelte-sonner';

	export let repository: Repository;

	let busy$ = false;
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		<Button
			variant="outline"
			size="sm"
			icon="update-small"
			iconPosition="left"
			loading={busy$}
			on:click={async (e) => {
				e.preventDefault();
				e.stopPropagation();
				busy$ = true;
				try {
					await fetchAll(repository.path);
					const dBranch = await defaultBranch.setDefault(repository);
					await allBranches.fetch(repository, {
						defaultBranchUpstreamName: dBranch?.upstream || 'HEAD',
						prevBranches: $allBranches
					});
					workingBranch.setWorking(repository);
					lastSynced.set(new Date());
					toast.success('Fetched from upstream');
				} catch (e) {
					console.error(e);
					toast.error('Failed to fetch from upstream');
				} finally {
					busy$ = false;
				}
			}}
		>
			{#if busy$}
				<span>busy…</span>
			{:else if $lastSynced}
				<TimeAgo date={$lastSynced} />
			{/if}
		</Button>
	</Tooltip.Trigger>
	<Tooltip.Content>
		<p>Last fetch from upstream</p>
	</Tooltip.Content>
</Tooltip.Root>
