<script lang="ts">
	import newProjectSvg from '$lib/assets/no-projects/new-project.svg?raw';
	import { addRepository } from '$lib/repository';
	import WelcomeAction from './WelcomeAction.svelte';

	let newProjectLoading = false;

	async function onNewProject() {
		newProjectLoading = true;
		try {
			await addRepository();
		} finally {
			newProjectLoading = false;
		}
	}
</script>

<div class="welcome">
	<div class="welcome-content">
		<h1 class="welcome-title text-serif-40">Welcome to GitFox</h1>
		<div class="welcome__actions">
			<WelcomeAction
				title="Add new project"
				loading={newProjectLoading}
				on:mousedown={onNewProject}
			>
				<svelte:fragment slot="icon">
					{@html newProjectSvg}
				</svelte:fragment>
				<svelte:fragment slot="message">
					Verify valid Git repository in selected folder before importing.
				</svelte:fragment>
			</WelcomeAction>
			<!-- Using instance of user here to not hide after login -->
			<!-- <WelcomeSigninAction /> -->
		</div>
	</div>
</div>

<style lang="postcss">
	.welcome {
		width: 100%;
		cursor: default;
		user-select: none;
		display: flex;
		flex-grow: 1;
		background-color: var(--clr-theme-container-light);
	}

	.welcome-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--size-40);
		align-items: center;
		padding: var(--size-40) calc(var(--size-40) * 2);
		flex: 1.3;
		background-color: var(--clr-theme-container-light);
		overflow-y: auto;
	}

	.welcome-title {
		color: var(--clr-theme-scale-ntrl-0);
		text-align: center;
		text-transform: uppercase;
		line-height: 1;
	}

	.welcome__actions {
		display: flex;
		flex-direction: row;
		gap: var(--size-8);
		/* margin-top: var(--size-32); */
	}
</style>
