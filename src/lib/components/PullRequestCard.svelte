<script lang="ts">
	import { activeBranch, defaultBranch } from '$lib/stores/branch';
	import Tag from './Tag.svelte';
	import type { Repository } from '$lib/models/repository';
	// import Button from './Button.svelte';
	import { createRequestUrl } from '$lib/utils/url';
	import { Button } from './ui/button';

	export let isLaneCollapsed: boolean = false;
	export let type: 'tag' | 'button' = 'button';
	export let repository: Repository;

	let currentBranch = $activeBranch;

	activeBranch.subscribe((branch) => {
		currentBranch = branch;
	});
</script>

{#if currentBranch?.upstream && currentBranch?.ref !== $defaultBranch.ref}
	{#if type === 'tag'}
		<Tag
			clickable
			color="pop"
			icon="pr-small"
			verticalOrientation={isLaneCollapsed}
			on:click={() => createRequestUrl(repository, currentBranch.name)}
		>
			Open Pull Request
		</Tag>
	{:else}
		<Button
			icon="pr-small"
			color="pop"
			on:click={() => createRequestUrl(repository, currentBranch.name)}
		>
			<kbd
				class="pointer-events-none inline-flex select-none items-center gap-1 rounded px-1 leading-[15px] border border-gray-400 bg-gray-400/60 mr-1 font-mono text-base-10 font-medium opacity-60"
			>
				<span>⌘</span>R
			</kbd>
			Open Pull Request
		</Button>
	{/if}
{/if}
