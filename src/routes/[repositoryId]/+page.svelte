<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';

	export let data: PageData;
	console.info('[ROUTE] RepositoryId:', data.repositoryId);
	$: if (data.repositoryId) {
		goto(`/${data.repositoryId}/board`, { replaceState: true });
	}
</script>

<FullviewLoading />
