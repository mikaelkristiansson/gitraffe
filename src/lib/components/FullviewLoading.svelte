<script lang="ts">
	import Spinner from '$lib/icons/Spinner.svelte';
</script>

<div class="loading" data-tauri-drag-region><Spinner size={32} opacity={0.5} /></div>

<style>
	.loading {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100%;
		width: 100%;
	}
</style>
