<script lang="ts">
	import { activeBranch, defaultBranch } from '$lib/stores/branch';
	import type { Repository } from '$lib/models/repository';
	import { createRequestUrl } from '$lib/utils/url';
	import { Button } from './ui/button';

	export let isLaneCollapsed: boolean = false;
	export let repository: Repository;

	let currentBranch = $activeBranch;

	activeBranch.subscribe((branch) => {
		currentBranch = branch;
	});
</script>

{#if currentBranch?.upstream && currentBranch?.ref !== $defaultBranch.ref}
	<Button
		icon="pr-small"
		vertical={isLaneCollapsed}
		on:click={() => createRequestUrl(repository, currentBranch.name)}
	>
		Open Pull Request
	</Button>
{/if}
