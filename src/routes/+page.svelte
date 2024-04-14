<script lang="ts">
	import { goto } from '$app/navigation';
	import Welcome from '$lib/components/Welcome.svelte';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import { activeRepository } from '$lib/stores/repository';

	let redirect = $activeRepository?.id || null;

	$: $activeRepository && goto(`/${$activeRepository.id}/`);
</script>

{#if redirect === undefined}
	<FullviewLoading />
{:else if redirect === null}
	<Welcome />
{/if}
