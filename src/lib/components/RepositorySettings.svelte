<script lang="ts">
	import * as Alert from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import FullviewLoading from '$lib/components/FullviewLoading.svelte';
	import type { Repository } from '$lib/models/repository';
	import { activeRepository, repositories } from '$lib/stores/repository';
	import { toast } from 'svelte-sonner';

	export let repository: Repository;

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
			toast.success('Project deleted');
		} catch (err: any) {
			console.error(err);
			toast.error('Failed to delete project');
		} finally {
			isDeleting = false;
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
				<Alert.Description>
					<span
						>You can remove repositories from Gitraffe, your code remains safe as this only clears
						configuration.</span
					>
					<Button
						variant="destructive"
						icon="warning-small"
						class="mt-2"
						on:click={onDeleteClicked}
						loading={isDeleting}>Remove {repository.name}</Button
					>
				</Alert.Description>
			</Alert.Root>
		</div>
	</section>
{/if}
