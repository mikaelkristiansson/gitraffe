<script lang="ts">
	import '../styles/main.css';
	import { SETTINGS_CONTEXT, loadUserSettings } from '$lib/settings/userSettings';
	import { initTheme } from '$lib/utils/theme';
	import { onMount, setContext } from 'svelte';
	import { Toaster as Sonner } from '$lib/components/ui/sonner';
	import * as hotkeys from '$lib/utils/hotkeys';
	import { unsubscribe } from '$lib/utils/unsubscribe';

	const userSettings = loadUserSettings();
	initTheme(userSettings);
	setContext(SETTINGS_CONTEXT, userSettings);

	onMount(() => {
		return unsubscribe(
			hotkeys.on('Meta+T', () => {
				userSettings.update((s) => ({
					...s,
					theme: $userSettings.theme == 'light' ? 'dark' : 'light'
				}));
			}),
			hotkeys.on('Backspace', (e) => {
				// This prevent backspace from navigating back
				e.preventDefault();
			})
		);
	});
</script>

<div data-tauri-drag-region class="flex h-full select-none cursor-default">
	<slot />
</div>
<Sonner />

<!-- <AppUpdater /> -->
