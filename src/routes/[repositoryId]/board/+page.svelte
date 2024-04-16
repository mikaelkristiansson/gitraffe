<script lang="ts">
	import { goto } from '$app/navigation';
	import { activeBranch } from '$lib/stores/branch';
	import type { PageData } from './$types';

	export let data: PageData;
	console.info('[ROUTE] board');
	$: if (!data.repositoryId) {
		goto(`/`, { replaceState: true });
	}

	activeBranch.subscribe((branch) => {
		if (!branch) return;
		goto(`/${data.repositoryId}/board/${branch.name}`, { replaceState: true });
	});
</script>
