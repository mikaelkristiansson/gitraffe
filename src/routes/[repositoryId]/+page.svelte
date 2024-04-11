<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	$: repositoryId = $page.params.repositoryId;

	$: if (repositoryId) {
		goto(`/${repositoryId}/board`, { replaceState: true });
	}
</script>
