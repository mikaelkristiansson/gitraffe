<script lang="ts">
	import newProjectSvg from '$lib/assets/book.svg?raw';
	import giraffeSvg from '$lib/assets/giraffe.svg?raw';
	import { addRepository } from '$lib/stores/repository';
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

<div class="welcome z-10">
	<div class="welcome-content">
		<h1 class="text-center text-4xl font-extrabold">Welcome to Gitraffe</h1>
		<div class="[&>svg]:fill-primary opacity-80">{@html giraffeSvg}</div>
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
	}

	.welcome-content {
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--size-40);
		align-items: center;
		padding: var(--size-40) calc(var(--size-40) * 2);
		flex: 1.3;
		overflow-y: auto;
	}

	.welcome-title {
		text-align: center;
		text-transform: uppercase;
		line-height: 1;
	}

	.welcome__actions {
		display: flex;
		flex-direction: row;
		gap: var(--size-8);
	}
</style>
