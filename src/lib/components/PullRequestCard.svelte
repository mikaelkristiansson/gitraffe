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
		{#if !isLaneCollapsed}
			<kbd
				class="pointer-events-none inline-flex select-none items-center gap-1 rounded px-1 leading-[15px] border border-gray-400 bg-gray-400/60 mr-1 font-mono text-base-10 font-medium opacity-60"
			>
				<span>⌘</span>R
			</kbd>
		{/if}
		Open Pull Request
	</Button>
{/if}
