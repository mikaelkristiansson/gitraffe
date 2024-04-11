<script lang="ts">
	import SectionCard from '$lib/components/SectionCard.svelte';
	import ThemeSelector from '$lib/components/ThemeSelector.svelte';
	import ContentWrapper from '$lib/components/settings/ContentWrapper.svelte';
	import ProfileSIdebar from '$lib/components/settings/ProfileSIdebar.svelte';
	import { SETTINGS_CONTEXT, type SettingsStore } from '$lib/settings/userSettings';
	import { getContext } from 'svelte';

	const userSettings = getContext(SETTINGS_CONTEXT) as SettingsStore;

	let currentSection: 'profile' | 'git-stuff' | 'telemetry' | 'integrations' | 'ai' = 'profile';
</script>

<section class="profile-page">
	<ProfileSIdebar bind:currentSection />
	{#if currentSection === 'profile'}
		<ContentWrapper title="Profile">
			<SectionCard>
				<svelte:fragment slot="title">Appearance</svelte:fragment>
				<ThemeSelector {userSettings} />
			</SectionCard>
		</ContentWrapper>
	{/if}
</section>

<style lang="postcss">
	.profile-page {
		display: flex;
		width: 100%;
	}

	.profile-form {
		display: flex;
		gap: var(--size-24);
	}

	.hidden-input {
		z-index: 1;
		position: absolute;
		background-color: red;
		width: 100%;
		height: 100%;
		opacity: 0;
	}

	.profile-pic-wrapper {
		position: relative;
		width: 100px;
		height: 100px;
		border-radius: var(--radius-m);
		overflow: hidden;
		background-color: var(--clr-theme-scale-pop-70);
		transition: opacity var(--transition-medium);

		&:hover,
		&:focus-within {
			& .profile-pic__edit-label {
				opacity: 1;
			}

			& .profile-pic {
				opacity: 0.8;
			}
		}
	}

	.profile-pic {
		width: 100%;
		height: 100%;

		object-fit: cover;
		background-color: var(--clr-theme-scale-pop-70);
	}

	.profile-pic__edit-label {
		position: absolute;
		bottom: var(--size-8);
		left: var(--size-8);
		color: var(--clr-core-ntrl-100);
		background-color: color-mix(in srgb, var(--clr-core-ntrl-0), transparent 30%);
		padding: var(--size-4) var(--size-6);
		border-radius: var(--radius-m);
		opacity: 0;
		transition: opacity var(--transition-medium);
	}

	.contact-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--size-20);
		align-items: flex-end;
	}

	.contact-info__fields {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: var(--size-12);
	}

	.row-buttons {
		display: flex;
		justify-content: flex-end;
		gap: var(--size-8);
	}
</style>
