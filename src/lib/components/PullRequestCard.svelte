<script lang="ts">
	import { activeBranch, defaultBranch } from '$lib/stores/branch';
	import Tag from './Tag.svelte';
	import type { Repository } from '$lib/models/repository';
	import Button from './Button.svelte';
	import { createRequestUrl } from '$lib/utils/url';

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
			color="success"
			icon="pr-small"
			filled
			verticalOrientation={isLaneCollapsed}
			on:click={() => createRequestUrl(repository, currentBranch.name)}
		>
			Open Pull Request
		</Tag>
	{:else}
		<Button
			icon="pr-small"
			color="success"
			on:click={() => createRequestUrl(repository, currentBranch.name)}>Open Pull Request</Button
		>
	{/if}
{/if}
