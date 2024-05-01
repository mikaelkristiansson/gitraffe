<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Card from '$lib/components/ui/card';
	import ThemeSelector from './ThemeSelector.svelte';
	import { SETTINGS_CONTEXT, type SettingsStore } from '$lib/settings/userSettings';
	import { getContext } from 'svelte';

	// export let user: User | undefined;
	export let pop = false;
	export let isNavCollapsed = false;
	let dialogOpen = false;

	const userSettings = getContext(SETTINGS_CONTEXT) as SettingsStore;
</script>

<button
	class="btn"
	class:pop
	on:mousedown={() => (dialogOpen = true)}
	class:collapsed={isNavCollapsed}
>
	{#if !isNavCollapsed}
		<span class="name text-base-13 text-semibold">
			<!-- {#if user}
				{#if user.name}
					{user.name}
				{:else if user.given_name}
					{user.given_name}
				{:else if user.email}
					{user.email}
				{/if}
			{:else} -->
			Account
			<!-- {/if} -->
		</span>
	{/if}
	<!-- {#if user?.picture}
		<img class="profile-picture" src={user.picture} alt="Avatar" />
	{:else} -->
	<div class="anon-icon">
		<Icon name="profile" />
	</div>
	<!-- {/if} -->
</button>

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

<style lang="postcss">
	.btn {
		display: flex;
		align-items: center;
		overflow-x: hidden;
		gap: var(--size-8);

		height: var(--size-control-l);
		padding: var(--size-6) var(--size-8);
		border-radius: var(--radius-m);

		color: var(--clr-theme-scale-ntrl-50);
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast),
			filter var(--transition-fast);

		cursor: pointer;

		&.pop {
			color: var(--clr-theme-scale-pop-10);
			background: color-mix(
				in srgb,
				var(--clr-theme-scale-pop-80) 70%,
				var(--clr-theme-scale-ntrl-100)
			);

			&:hover {
				color: var(--clr-theme-scale-pop-10);
				background: color-mix(
					in srgb,
					var(--clr-theme-scale-pop-80) 40%,
					var(--clr-theme-scale-ntrl-100)
				);
			}
		}

		&:hover {
			background-color: color-mix(in srgb, transparent, var(--darken-tint-light));
			color: var(--clr-theme-scale-ntrl-40);
		}
	}
	.name {
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow-x: hidden;
	}
	.anon-icon,
	.profile-picture {
		border-radius: var(--radius-m);
		width: var(--size-20);
		height: var(--size-20);
	}
	.anon-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--size-2);
		background: var(--clr-theme-pop-element);
		color: var(--clr-theme-pop-on-element);
	}

	/* MODIFIERS */
	.btn.collapsed {
		overflow-x: initial;
		padding: var(--size-8);
		height: auto;

		& .anon-icon,
		.profile-picture {
			width: var(--size-24);
			height: var(--size-24);
		}
	}
</style>
