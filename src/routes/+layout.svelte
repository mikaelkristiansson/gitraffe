<script lang="ts">
	import { SETTINGS_CONTEXT, loadUserSettings } from '$lib/settings/userSettings';
	import { initTheme } from '$lib/utils/theme';
	import { setContext } from 'svelte';
	import '../styles/main.postcss';

	const userSettings = loadUserSettings();
	initTheme(userSettings);
	setContext(SETTINGS_CONTEXT, userSettings);
</script>

<div data-tauri-drag-region class="app-root">
	<slot />
</div>

<style lang="postcss">
	.app-root {
		display: flex;
		height: 100%;
		user-select: none;
		cursor: default;
	}
</style>
