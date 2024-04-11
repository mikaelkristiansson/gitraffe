<script lang="ts">
	import { goto } from '$app/navigation';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	// import KeysForm from '$lib/components/KeysForm.svelte';
	import RemoveProjectButton from '$lib/components/RemoveProjectButton.svelte';
	import SectionCard from '$lib/components/SectionCard.svelte';
	import { activeRepository, repositories } from '$lib/repository';
	//   import { UserService } from "$lib/stores/user";
	//   import { getContextByClass } from "$lib/utils/context";
	import * as toasts from '$lib/utils/toasts';
	// import type { PageData } from './$types';

	// export let data: PageData;
	$: repository$ = $activeRepository;

	// $: projectService = data.projectService;
	// $: project$ = data.project$;
	// $: authService = data.authService;

	//   const userService = getContextByClass(UserService);
	//   const user = userService.user;

	let deleteConfirmationModal: RemoveProjectButton;
	let isDeleting = false;

	async function onDeleteClicked() {
		isDeleting = true;
		try {
			if (!repository$) return;
			repositories.remove(repository$.id);
			if ($repositories.length !== 0) {
				const firstRepository = $repositories[0];
				activeRepository.setActive(firstRepository.id);
				goto(`/${firstRepository.id}`);
			} else {
				activeRepository.removeActive();
				goto('/');
			}
			toasts.success('Project deleted');
		} catch (err: any) {
			console.error(err);
			toasts.error('Failed to delete project');
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if !repository$}
	<FullviewLoading />
{:else}
	<section class="content-wrapper">
		<div class="drag-region" data-tauri-drag-region>
			<div class="content" data-tauri-drag-region>
				<h1 class="title text-head-24">Project settings</h1>
				<!-- <KeysForm project={project$} /> -->
				<SectionCard>
					<svelte:fragment slot="title">Remove project</svelte:fragment>
					<svelte:fragment slot="caption">
						You can remove projects from Gitfox, your code remains safe as this only clears
						configuration.
					</svelte:fragment>
					<div>
						<RemoveProjectButton
							bind:this={deleteConfirmationModal}
							projectTitle={repository$?.name}
							{isDeleting}
							{onDeleteClicked}
						/>
					</div>
				</SectionCard>
			</div>
		</div>
	</section>
{/if}

<style lang="post-css">
	.content-wrapper {
		user-select: none;
		width: 100%;
		height: 100%;
		flex: 1;
		background-color: var(--clr-theme-container-pale);
	}

	.drag-region {
		width: 100%;
		min-height: 100vh;
	}

	.content {
		padding: var(--size-48) var(--size-32);
		display: flex;
		flex-direction: column;
		gap: var(--size-16);
		max-width: 40rem;
		width: 100%;
		margin: auto;
	}

	.title {
		color: var(--clr-theme-scale-ntrl-0);
		align-self: flex-start;
	}
</style>
