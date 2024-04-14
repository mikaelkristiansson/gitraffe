<script lang="ts">
	import { goto } from '$app/navigation';
	import { allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import Navigation from '$lib/components/Navigation.svelte';
	import type { Repository } from '$lib/models/repository';
	import { activeRepository, updatingRepositories } from '$lib/stores/repository';
	import { loadLocalCommits } from '$lib/stores/commits';
	import { error } from '$lib/utils/toasts';
	import { appWindow } from '@tauri-apps/api/window';
	import { onDestroy, onMount } from 'svelte';

	let repository$: Repository | undefined | null = undefined;
	activeRepository.subscribe(async (repo) => {
		if (repo) {
			repository$ = repo;
		}
		if (!$defaultBranch && repo) {
			await defaultBranch.setDefault(repo);
		}
	});
	let unlisten = () => {};
	let time = new Date().getTime();
	let timeoutId: number;

	async function update(newRepo: boolean = false, isFocus: boolean = true) {
		if (repository$) {
			console.info('UPDATING');
			if (isFocus) {
				clearTimeout(timeoutId);
				timeoutId = window.setTimeout(async () => {
					const isInFocus = await appWindow.isFocused();
					update(false, isInFocus);
				}, 10000);
			}
			if (newRepo) {
				updatingRepositories.set(true);
			}
			try {
				const base = await defaultBranch.setDefault(repository$);
				const allBranches$ = await allBranches.fetch(repository$, base?.upstream || 'HEAD');
				const wb = await workingBranch.setWorking(repository$);
				const currentBranch = allBranches$.find((b) => b.name === wb?.currentBranch);
				await loadLocalCommits(repository$, currentBranch || null);
				if (wb) {
					goto(`/${repository$.id}/board/${wb.currentBranch}`);
				}
			} catch (e) {
				console.error(e);
				error('Failed to fetch branches');
			} finally {
				updatingRepositories.set(false);
			}
		}
	}

	$: repository$?.path && update(true);

	onMount(async () => {
		unlisten = await appWindow.onFocusChanged(({ payload: focused }) => {
			if (focused) {
				if (time + 10000 < new Date().getTime()) {
					update(false, true);
					time = new Date().getTime();
				}
			}
		});
	});

	// you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
	onDestroy(() => {
		unlisten();
		clearTimeout(timeoutId);
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
