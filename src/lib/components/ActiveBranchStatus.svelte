<script lang="ts">
	import Tag from '$lib/components/Tag.svelte';
	import type { IStatusResult } from '$lib/git/status';
	import type { Repository } from '$lib/models/repository';
	import { normalizeBranchName } from '$lib/utils/branch';
	import { setRepositoryURL } from '$lib/utils/remote';
	import { openExternalUrl } from '$lib/utils/url';
	import PullRequestCard from './PullRequestCard.svelte';
	// import { openExternalUrl } from '$lib/utils/url';

	export let branch: IStatusResult | undefined;
	export let repository: Repository;
	export let isUnapplied = false;
	// export let hasIntegratedCommits = false;
	export let isLaneCollapsed: boolean = false;
</script>

<!-- {#if !isUnapplied && !isLaneCollapsed}
	<Tag
		shrinkable
		disabled
		help="Branch name that will be used when pushing. You can change it from the lane menu."
		verticalOrientation={isLaneCollapsed}
	>
		origin/{branch?.currentBranch
			? branch.currentBranch
			: normalizeBranchName(branch?.currentBranch || '')}</Tag
	>
{/if} -->
{#if !branch?.currentUpstreamBranch}
	<Tag
		icon="virtual-branch-small"
		color="light"
		help="These changes are in your working directory."
		reversedDirection
		verticalOrientation={isLaneCollapsed}>Local</Tag
	>
{:else}
	<Tag
		color="pop"
		icon="remote-branch-small"
		help="At least some of your changes have been pushed"
		verticalOrientation={isLaneCollapsed}
		reversedDirection>Remote</Tag
	>

	<Tag
		icon="open-link"
		color="ghost"
		border
		clickable
		shrinkable
		verticalOrientation={isLaneCollapsed}
		on:click={async (e) => {
			const baseUrl = await setRepositoryURL(repository);
			const url = `${baseUrl?.link}/tree/${branch?.currentBranch}`;
			if (baseUrl) openExternalUrl(url);
			e.preventDefault();
			e.stopPropagation();
		}}
	>
		{isLaneCollapsed ? 'View branch' : `origin/${branch?.currentBranch}`}
	</Tag>
	{#if isLaneCollapsed}
		<PullRequestCard type="tag" {repository} {isLaneCollapsed} />
	{/if}
{/if}
