<svelte:options runes={true} />

<script lang="ts">
	import ListItem from './ListItem.svelte';
	import { goto } from '$app/navigation';
	import { createRepositories } from '$lib/stores/repository.svelte';

	let { isNavCollapsed }: { isNavCollapsed: boolean } = $props();

	let hidden = $state(true);
	let loading = $state(false);
	const repositoryStore = createRepositories();

	export function toggle() {
		hidden = !hidden;
		return !hidden;
	}

	export function hide() {
		hidden = true;
	}

	async function addNewRepository() {
		const repository = await repositoryStore.addRepository();
		if (repository) {
			goto(`/${repository.id}/board`);
		}
		// const unsubscribeActiveRepository = activeRepository.subscribe((repo) => {
		// 	if (repo?.id === repository?.id) {
		// 		if (repository) {
		// 			goto(`/${repository.id}/board`);
		// 		}
		// 	}
		// });
		// unsubscribeActiveRepository();
		// return repository;
	}
</script>

{#if !hidden}
	<div class="popup" class:collapsed={isNavCollapsed}>
		{#if repositoryStore.repositories.length > 0}
			<div class="popup__projects">
				{#each repositoryStore.repositories as repository (repository.id)}
					{@const selected = repository.id == repositoryStore.activeRepository.id}
					<ListItem
						{selected}
						icon={selected ? 'tick' : undefined}
						on:click={() => {
							hide();
							repositoryStore.setActive(repository);
							goto(`/${repository.id}/board`);
						}}
					>
						{repository.name}
					</ListItem>
				{/each}
			</div>
		{/if}
		<div class="popup__actions">
			<ListItem
				icon="plus"
				{loading}
				on:click={async () => {
					loading = true;
					try {
						await addNewRepository();
					} finally {
						loading = false;
						hide();
					}
				}}>Add new repository</ListItem
			>
		</div>
	</div>
{/if}

<style lang="postcss">
	.popup {
		position: absolute;
		top: 100%;
		z-index: 50;
		width: 100%;
		@apply bg-card border border-border mt-1 rounded-md;
		/* shadow/s */
		box-shadow: 0px 7px 14px 0px rgba(0, 0, 0, 0.1);
	}
	.popup__actions {
		@apply border-t p-2;
	}
	.popup__projects {
		display: flex;
		flex-direction: column;
		@apply p-2 gap-1;
	}

	/* MODIFIERS */
	.popup.collapsed {
		width: 240px;
	}
</style>
