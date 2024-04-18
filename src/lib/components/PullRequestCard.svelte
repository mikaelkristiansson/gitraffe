<script lang="ts">
	import { activeBranch, defaultBranch } from '$lib/stores/branch';
	import { open } from '@tauri-apps/api/shell';
	import { error } from '$lib/utils/toasts';
	import Tag from './Tag.svelte';
	import { setRepositoryURL } from '$lib/utils/remote';
	import type { Repository } from '$lib/models/repository';
	import Button from './Button.svelte';

	export let isLaneCollapsed: boolean = false;
	export let type: 'tag' | 'button' = 'button';
	export let repository: Repository;

	function setURLEnding(url: string) {
		switch (url) {
			case 'github':
				return 'pull/new/';
			case 'gitlab':
				return 'merge_requests/new?merge_request[source_branch]=';
			default:
				return '';
		}
	}

	async function setURL() {
		const baseUrl = await setRepositoryURL(repository);
		if (baseUrl) {
			return `${baseUrl.link}/${setURLEnding(baseUrl.gitURL.replace('git@', '').replace(/\..*/, ''))}${$activeBranch?.name}`;
		}
		return null;
	}
</script>

{#if $activeBranch?.upstream && $activeBranch.ref !== $defaultBranch.ref}
	{#if type === 'tag'}
		<Tag
			clickable
			color="success"
			icon="pr-small"
			filled
			verticalOrientation={isLaneCollapsed}
			on:click={async () => {
				const url = await setURL();
				if (url) {
					await open(url);
				} else {
					error('Failed to create pull request');
				}
			}}>Open Pull Request</Tag
		>
	{:else}
		<Button
			icon="pr-small"
			color="success"
			on:click={async () => {
				const url = await setURL();
				if (url) {
					await open(url);
				} else {
					error('Failed to create pull request');
				}
			}}>Open Pull Request</Button
		>
	{/if}
{/if}
