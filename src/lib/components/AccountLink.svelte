<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Card from '$lib/components/ui/card';
	import ThemeSelector from './ThemeSelector.svelte';
	import { SETTINGS_CONTEXT, type SettingsStore } from '$lib/settings/userSettings';
	import { getContext } from 'svelte';
	import Button from './ui/button/button.svelte';

	// export let user: User | undefined;
	export let isNavCollapsed = false;
	let dialogOpen = false;

	const userSettings = getContext(SETTINGS_CONTEXT) as SettingsStore;
</script>

<Button
	variant="secondary"
	size={isNavCollapsed ? 'icon-lg' : 'default'}
	icon="profile"
	on:click={() => (dialogOpen = true)}
>
	{#if !isNavCollapsed}
		<!-- {#if user}
				{#if user.name}
					{user.name}
				{:else if user.given_name}
					{user.given_name}
				{:else if user.email}
					{user.email}
				{/if}
			{:else} -->
		<span class="text-xs font-semibold">Account</span>
		<!-- {/if} -->
	{/if}
	<!-- {#if user?.picture}
		<img class="profile-picture" src={user.picture} alt="Avatar" />
	{:else} -->
	<!-- <div class="anon-icon">
		<Icon name="profile" />
	</div> -->
	<!-- {/if} -->
</Button>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content size="lg">
		<Dialog.Header>
			<Dialog.Title>Settings</Dialog.Title>
		</Dialog.Header>

		<Card.Root>
			<Card.Header>
				<Card.Title>Appearance</Card.Title>
			</Card.Header>
			<Card.Content>
				<ThemeSelector {userSettings} />
			</Card.Content>
		</Card.Root>
	</Dialog.Content>
</Dialog.Root>
