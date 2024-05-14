<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation';
	import Welcome from '$lib/components/Welcome.svelte';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import { rune } from '$lib/stores/repository.svelte';
	import { activeBranch } from '$lib/stores/branch';

	let { store } = rune();
	$inspect('page component', store);
	// let repositoryStore = createRepositories();
	// let { activeRepository } = repositoryStore;
	// $inspect(repositoryStore);

	let redirect = store.activeRepository?.id || null;
	console.info('[ROUTE] index');
	$effect(() => {
		console.log('helo');
		console.log('$activeBranch', $activeBranch);
		if (store.activeRepository) {
			$inspect('if store.activeRepository update', store.activeRepository);
			if ($activeBranch) {
				goto(`/${store.activeRepository.id}/board/${$activeBranch.name}`);
			} else {
				goto(`/${store.activeRepository.id}/`);
			}
		}
	});
</script>

{#if redirect === undefined}
	<FullviewLoading />
{:else if redirect === null}
	<Welcome />
{/if}
