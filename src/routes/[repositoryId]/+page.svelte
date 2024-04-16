<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	$: repositoryId = $page.params.repositoryId;
	console.info('[ROUTE] RepositoryId:', repositoryId);
	$: if (repositoryId) {
		goto(`/${repositoryId}/board`, { replaceState: true });
	}
</script>
