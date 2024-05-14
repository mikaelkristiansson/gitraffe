<svelte:options runes={true} />

<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import type { Repository } from '$lib/models/repository';
	import { createRepositories } from '$lib/stores/repository.svelte';
	import { toast } from 'svelte-sonner';

	let {
		repository,
		dialogSettingsOpen = $bindable()
	}: { repository: Repository; dialogSettingsOpen: boolean } = $props();
	// export let dialogSettingsOpen = false;
	// $inspect(dialogSettingsOpen);

	const repositoryStore = createRepositories();

	let isDeleting = $state(false);

	async function onDeleteClicked() {
		isDeleting = true;
		try {
			if (!repository) return;
			repositoryStore.removeRepository(repository.id);
			if (repositoryStore.repositories.length !== 0) {
				const firstRepository = repositoryStore.repositories[0];
				repositoryStore.setActive(firstRepository);
				goto(`/${firstRepository.id}`);
			} else {
				repositoryStore.removeActive();
				goto('/');
			}
			toast.success('Project deleted');
		} catch (err: any) {
			console.error(err);
			toast.error('Failed to delete project');
		} finally {
			isDeleting = false;
			dialogSettingsOpen = false;
		}
	}
</script>

{#if !repository}
	<FullviewLoading />
{:else}
	<section class="flex-1 select-none w-full h-full">
		<div class="flex flex-col gap-4">
			<Alert.Root>
				<Alert.Title>Remove repository</Alert.Title>
				<Alert.Description class="flex flex-col gap-4">
					<span
						>You can remove repositories from Gitraffe, your code remains safe as this only clears
						configuration.</span
					>
					<Button
						variant="destructive"
						icon="warning-small"
						on:click={onDeleteClicked}
						loading={isDeleting}>Remove {repository.name}</Button
					>
				</Alert.Description>
			</Alert.Root>
		</div>
	</section>
{/if}
