<script lang="ts">
	import Tag from '$lib/components/Tag.svelte';
	import type { IStatusResult } from '$lib/git/status';
	import { normalizeBranchName } from '$lib/utils/branch';
	// import { openExternalUrl } from '$lib/utils/url';

	export let branch: IStatusResult | undefined;
	export let isUnapplied = false;
	export let hasIntegratedCommits = false;
	export let isLaneCollapsed: boolean = false;
</script>

{#if !isUnapplied && !isLaneCollapsed}
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
{/if}
<Tag
	color="dark"
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
	on:click={(e) => {
		// const url = $baseBranch?.branchUrl(branch.upstream?.name);
		// if (url) openExternalUrl(url);
		e.preventDefault();
		e.stopPropagation();
	}}
>
	{isLaneCollapsed ? 'View branch' : `origin/${branch?.currentBranch}`}
</Tag>
<!-- {/if} -->
