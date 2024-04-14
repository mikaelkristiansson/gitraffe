<script lang="ts">
	import { activeBranch } from '$lib/branch';
	import { getRemoteURL } from '$lib/git/remote';
	import { activeRepository } from '$lib/repository';
	import { open } from '@tauri-apps/api/shell';

	import Button from './Button.svelte';
	import { error } from '$lib/utils/toasts';

	// export let branch: Branch;
	export let isLaneCollapsed: boolean = false;

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

	function setURL() {
		if ($activeRepository) {
			return getRemoteURL($activeRepository, 'origin').then((url) => {
				if (url) {
					const regex = /(git@[\w.]+):(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
					const match = String(url.trim()).match(regex)?.slice(1);
					const [gitURL, repo] = match as string[];
					const extractUrl = gitURL.replace('git@', 'https://');
					const link = `${extractUrl}/${repo}/${setURLEnding(gitURL.replace('git@', '').replace(/\..*/, ''))}${$activeBranch?.name}`;
					return link;
				}
				return null;
			});
		}
	}
</script>

{#if $activeBranch?.upstream}
	<Button
		on:click={async () => {
			const url = await setURL();
			if (url) {
				await open(url);
			} else {
				error('Failed to create pull request');
			}
		}}>Create Pull Request</Button
	>
{/if}
