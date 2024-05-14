<svelte:options runes={true} />

<script lang="ts">
	import newProjectSvg from '$lib/assets/illu/space-rover.svg?raw';
	import giraffeSvg from '$lib/assets/giraffe.svg?raw';
	import { createRepositories } from '$lib/stores/repository.svelte';
	import WelcomeAction from './WelcomeAction.svelte';

	const repositoryStore = createRepositories();
	let newProjectLoading = $state(false);

	async function onNewProject() {
		newProjectLoading = true;
		try {
			await repositoryStore.addRepository();
		} finally {
			newProjectLoading = false;
		}
	}
</script>

<div class="welcome z-10">
	<div class="welcome-content" data-tauri-drag-region>
		<h1 class="text-center text-4xl font-bold">Welcome to Gitraffe</h1>
		<div class="[&>svg]:fill-gray-900 [&>svg]:dark:fill-gray-50 opacity-80">
			{@html giraffeSvg}
		</div>
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
		align-items: center;
		@apply gap-10 py-10 px-20;
		flex: 1.3;
		overflow-y: auto;
	}

	.welcome__actions {
		display: flex;
		flex-direction: row;
		@apply gap-2;
	}
</style>
