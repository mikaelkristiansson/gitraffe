<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { IStatusResult } from '$lib/git/status';
	import type { Repository } from '$lib/models/repository';
	import { setRepositoryURL } from '$lib/utils/remote';
	import { openExternalUrl } from '$lib/utils/url';
	import PullRequestCard from './PullRequestCard.svelte';
	import { Button } from './ui/button';

	export let branch: IStatusResult;
	export let repository: Repository;
	export let isLaneCollapsed: boolean = false;
</script>

{#if !branch.currentUpstreamBranch || branch.branchAheadBehind === undefined}
	<Tooltip.Root>
		<Tooltip.Trigger class="cursor-auto"
			><Badge variant="secondary" size="sm" icon="local" vertical={isLaneCollapsed}>Local</Badge
			></Tooltip.Trigger
		>
		<Tooltip.Content>
			<p>These changes are in your working directory.</p>
		</Tooltip.Content>
	</Tooltip.Root>
{:else}
	<Tooltip.Root>
		<Tooltip.Trigger class="cursor-auto"
			><Badge variant="default" size="sm" icon="remote" vertical={isLaneCollapsed}>Remote</Badge
			></Tooltip.Trigger
		>
		<Tooltip.Content>
			<p>At least some of your changes have been pushed</p>
		</Tooltip.Content>
	</Tooltip.Root>

	<Button
		variant="outline"
		icon="open-link"
		size="sm"
		vertical={isLaneCollapsed}
		on:click={async (e) => {
			const baseUrl = await setRepositoryURL(repository);
			const url = `${baseUrl?.link}/tree/${branch?.currentBranch}`;
			if (baseUrl) openExternalUrl(url);
			e.preventDefault();
			e.stopPropagation();
		}}>{isLaneCollapsed ? 'View branch' : `origin/${branch.currentBranch}`}</Button
	>
	{#if isLaneCollapsed}
		<PullRequestCard {repository} {isLaneCollapsed} />
	{/if}
{/if}
