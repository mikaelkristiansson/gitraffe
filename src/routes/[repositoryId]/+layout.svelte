<script lang="ts">
	import { goto } from '$app/navigation';
	import { allBranches, defaultBranch, workingBranch } from '$lib/branch';
	import Navigation from '$lib/components/Navigation.svelte';
	import type { Repository } from '$lib/models/repository';
	import { activeRepository, updatingRepositories } from '$lib/repository';
	import { appWindow } from '@tauri-apps/api/window';
	import { onDestroy, onMount } from 'svelte';

	let repository$: Repository | undefined | null = undefined;
	activeRepository.subscribe((repo) => {
		if (repo) {
			repository$ = repo;
		}
		if (!$defaultBranch && repo) {
			defaultBranch.setDefault(repo, $allBranches);
		}
	});
	let unlisten = () => {};
	let time = new Date().getTime();

	async function update(newRepo: boolean = false) {
		if (repository$) {
			console.info('UPDATING');
			if (newRepo) {
				updatingRepositories.set(true);
			}
			await allBranches.fetch(repository$);
			await defaultBranch.setDefault(repository$, $allBranches);
			workingBranch.setWorking(repository$.path);
			updatingRepositories.set(false);
		}
	}

	$: repository$?.path && update(true);

	onMount(async () => {
		unlisten = await appWindow.onFocusChanged(({ payload: focused }) => {
			if (focused) {
				if (time + 10000 < new Date().getTime()) {
					console.log('fetching branches');
					update();
					time = new Date().getTime();
				}
			}
		});
	});

	// you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
	onDestroy(() => {
		unlisten();
	});
	$: baseError = null;
</script>

{#if !repository$}
	<p>Project not found!</p>
	<button on:click={() => goto('/')}>Go back</button>
{:else if $defaultBranch === null}
	<slot />
{:else if $baseError}
	<p>Error in base</p>
{:else}
	<div class="view-wrap" role="group" on:dragover|preventDefault>
		<!-- user={$user$} -->
		<Navigation repository={repository$} />
		<slot />
	</div>
{/if}

<style>
	.view-wrap {
		position: relative;
		display: flex;
		width: 100%;
	}
</style>
