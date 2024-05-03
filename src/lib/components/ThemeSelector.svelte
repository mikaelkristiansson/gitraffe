<script lang="ts">
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import SunMoon from 'lucide-svelte/icons/sun-moon';
	import type { SettingsStore } from '$lib/settings/userSettings';
	import { cn } from '$lib/utils';

	export let userSettings: SettingsStore;

	const themes = [
		{
			name: 'Light',
			value: 'light'
		},
		{
			name: 'Dark',
			value: 'dark'
		},
		{
			name: 'System preference',
			value: 'system'
		}
	];
</script>

<fieldset class="cards-group gap-3">
	{#each themes as theme}
		<label
			class={cn(
				'border cursor-pointer flex flex-col items-center gap-2 hover:bg-muted p-1 rounded-md',
				theme.value === $userSettings.theme && 'bg-muted'
			)}
			for="theme-{theme.value}"
		>
			<input
				class="hidden-input"
				type="radio"
				id="theme-{theme.value}"
				value={$userSettings.theme || 'system'}
				checked={theme.value === $userSettings.theme}
				on:change={() => userSettings.update((s) => ({ ...s, theme: theme.value }))}
			/>
			<div class="theme-card__preview flex justify-center">
				{#if theme.value === 'light'}
					<Sun />
				{:else if theme.value === 'dark'}
					<Moon />
				{:else}
					<SunMoon />
				{/if}
			</div>

			<span class="text-center text-xs font-semibold">{theme.name}</span>
		</label>
	{/each}
</fieldset>

<style lang="postcss">
	.cards-group {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		/* gap: var(--size-16); */
	}

	.theme-card__preview {
		position: relative;
		width: 100%;
		height: auto;
		overflow: hidden;
	}

	.hidden-input {
		position: absolute;
		width: 0;
		height: 0;
		z-index: -1;
	}
</style>
