<script lang="ts">
	import { goto } from '$app/navigation';
	import { activeBranch } from '$lib/stores/branch';
	import { onDestroy } from 'svelte';
	import type { PageData } from './$types';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';

	export let data: PageData;
	console.info('[ROUTE] board');
	$: if (!data.repositoryId) {
		goto(`/`, { replaceState: true });
	}

	const unsubscribeActiveBranch = activeBranch.subscribe((branch) => {
		if (!branch) return;
		goto(`/${data.repositoryId}/board/${branch.name}`, { replaceState: true });
	});

	onDestroy(() => {
		unsubscribeActiveBranch();
	});
</script>

<FullviewLoading />
