<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation';
	import { allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import Navigation from '$lib/components/Navigation.svelte';
	// import type { Repository } from '$lib/models/repository';
	import { repositoryStore, updatingRepositories } from '$lib/stores/repository.svelte';
	import { commitStore, loadLocalCommits } from '$lib/stores/commits';
	import { appWindow } from '@tauri-apps/api/window';
	import { onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	// let repository$: Repository | null = null;
	let { activeRepository } = repositoryStore;

	// const unsubscribeActiveRepository = activeRepository.subscribe(async (repo) => {
	// 	if (repo) {
	// 		repository$ = repo;
	// 	}
	// 	if (!$defaultBranch && repo) {
	// 		await defaultBranch.setDefault(repo);
	// 	}
	// });
	let unlisten = () => {};
	let time = new Date().getTime();
	let timeoutId: number;

	async function update(newRepo: boolean = false, isFocus: boolean = true) {
		if (activeRepository) {
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
				const base = newRepo ? await defaultBranch.setDefault(activeRepository) : $defaultBranch;
				const allBranches$ = await allBranches.fetch(activeRepository, {
					prevBranches: $allBranches
				});
				let activeBranch = await workingBranch.setWorking(activeRepository, $workingBranch);
				let updatePath = JSON.stringify(activeBranch) !== JSON.stringify($workingBranch);

				const currentBranch = allBranches$.find((b) => b.name === activeBranch?.currentBranch);

				const commits = await loadLocalCommits(activeRepository, currentBranch || null);
				const commitsSorted = commits.localCommitSHAs.slice().sort();
				if (
					!(
						$commitStore.localCommitSHAs.length === commits.localCommitSHAs.length &&
						$commitStore.localCommitSHAs
							.slice()
							.sort()
							.every(function (value, index) {
								return value === commitsSorted[index];
							})
					)
				) {
					commitStore.set(commits);
				}
				if (updatePath) {
					goto(`/${activeRepository.id}/board/${activeBranch?.currentBranch}`);
				}
			} catch (e) {
				console.error(e);
				toast.error('Failed to fetch branches');
			} finally {
				updatingRepositories.set(false);
			}
		}
	}

	// $: activeRepository?.path && update(true);
	$effect(() => {
		if (activeRepository?.path) {
			update(true);
		}
	});

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
		// unsubscribeActiveRepository();
		clearTimeout(timeoutId);
	});
</script>

{#if !activeRepository}
	<p>Project not found!</p>
	<button on:click={() => goto('/')}>Go back</button>
{:else if $defaultBranch === null}
	<slot />
{:else}
	<div class="flex relative w-full" role="group" on:dragover|preventDefault>
		<!-- user={$user$} -->
		<Navigation repository={activeRepository} />
		<slot />
	</div>
{/if}
