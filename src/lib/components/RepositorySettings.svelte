<script lang="ts">
	import { goto } from '$app/navigation';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	// import KeysForm from '$lib/components/KeysForm.svelte';
	import RemoveRepositoryButton from '$lib/components/RemoveRepositoryButton.svelte';
	import SectionCard from '$lib/components/SectionCard.svelte';
	import type { Repository } from '$lib/models/repository';
	import { activeRepository, repositories } from '$lib/stores/repository';
	//   import { UserService } from "$lib/stores/user";
	//   import { getContextByClass } from "$lib/utils/context";
	import * as toasts from '$lib/utils/toasts';
	// import type { PageData } from './$types';

	// export let data: PageData;
	export let repository: Repository | null;
	// $: repository = $activeRepository;

	// $: projectService = data.projectService;
	// $: project$ = data.project$;
	// $: authService = data.authService;

	//   const userService = getContextByClass(UserService);
	//   const user = userService.user;

	let deleteConfirmationModal: RemoveRepositoryButton;
	let isDeleting = false;

	async function onDeleteClicked() {
		isDeleting = true;
		try {
			if (!repository) return;
			repositories.remove(repository.id);
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

{#if !repository}
	<FullviewLoading />
{:else}
	<section class="content-wrapper">
		<div class="content">
			<!-- <KeysForm project={project$} /> -->
			<SectionCard>
				<svelte:fragment slot="title">Remove repository</svelte:fragment>
				<svelte:fragment slot="caption">
					You can remove repositories from Gitfox, your code remains safe as this only clears
					configuration.
				</svelte:fragment>
				<div>
					<RemoveRepositoryButton
						bind:this={deleteConfirmationModal}
						repositoryTitle={repository?.name}
						{isDeleting}
						{onDeleteClicked}
					/>
				</div>
			</SectionCard>
		</div>
	</section>
{/if}

<style lang="postcss">
	.content-wrapper {
		user-select: none;
		width: 100%;
		height: 100%;
		flex: 1;
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
