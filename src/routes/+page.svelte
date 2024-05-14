<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation';
	import Welcome from '$lib/components/Welcome.svelte';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import { activeBranch } from '$lib/stores/branch';
	import { createRepositories } from '$lib/stores/repository.svelte';

	const repositoryStore = createRepositories();

	let redirect = repositoryStore.activeRepository?.id || null;
	console.info('[ROUTE] index');
	$effect(() => {
		if (repositoryStore.activeRepository) {
			if ($activeBranch) {
				goto(`/${repositoryStore.activeRepository.id}/board/${$activeBranch.name}`);
			} else {
				goto(`/${repositoryStore.activeRepository.id}/`);
			}
		}
	});
</script>

{#if redirect === undefined}
	<FullviewLoading />
{:else if redirect === null}
	<Welcome />
{/if}
