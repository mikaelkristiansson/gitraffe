<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation';
	import { allBranches, defaultBranch, workingBranch } from '$lib/stores/branch';
	import Navigation from '$lib/components/Navigation.svelte';
	import FolderX from 'lucide-svelte/icons/folder-x';
	// import type { Repository } from '$lib/models/repository';
	import { createRepositories, updatingRepositories } from '$lib/stores/repository.svelte';
	import { commitStore, loadLocalCommits } from '$lib/stores/commits';
	import { appWindow } from '@tauri-apps/api/window';
	import { onDestroy, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Alert from '$lib/components/ui/alert';

	// let repository$: Repository | null = null;
	const repositoryStore = createRepositories();
	let { children } = $props();

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
		if (repositoryStore.activeRepository) {
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
				const base = newRepo
					? await defaultBranch.setDefault(repositoryStore.activeRepository)
					: $defaultBranch;
				const allBranches$ = await allBranches.fetch(repositoryStore.activeRepository, {
					prevBranches: $allBranches
				});
				let activeBranch = await workingBranch.setWorking(
					repositoryStore.activeRepository,
					$workingBranch
				);
				let updatePath = JSON.stringify(activeBranch) !== JSON.stringify($workingBranch);

				const currentBranch = allBranches$.find((b) => b.name === activeBranch?.currentBranch);

				const commits = await loadLocalCommits(
					repositoryStore.activeRepository,
					currentBranch || null
				);
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
					goto(`/${repositoryStore.activeRepository.id}/board/${activeBranch?.currentBranch}`);
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
		if (repositoryStore.activeRepository?.path) {
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

{#if !repositoryStore.activeRepository}
	<div class="flex w-full flex-col justify-center items-center h-full">
		<div class="flex">
			<Alert.Root>
				<FolderX class="h-5 w-5" />
				<Alert.Title>Project not found!</Alert.Title>
				<Alert.Description>
					<p>The project you are looking for does not exist.</p>
					<Button class="mt-2" onclick={() => goto('/')}>Go back</Button>
				</Alert.Description>
			</Alert.Root>
		</div>
	</div>
{:else if $defaultBranch === null}
	{@render children()}
{:else}
	<div class="flex relative w-full" role="group">
		<!-- user={$user$} -->
		<Navigation repository={repositoryStore.activeRepository} />
		{@render children()}
	</div>
{/if}
