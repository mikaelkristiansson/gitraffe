<script lang="ts">
	import ListItem from './ListItem.svelte';
	import { goto } from '$app/navigation';
	import { activeRepository, addRepository, repositories } from '$lib/stores/repository';

	export let isNavCollapsed: boolean;

	let hidden = true;
	let loading = false;

	export function toggle() {
		hidden = !hidden;
		return !hidden;
	}

	export function hide() {
		hidden = true;
	}

	async function addNewRepository() {
		const repository = await addRepository();
		const unsubscribeActiveRepository = activeRepository.subscribe((repo) => {
			if (repo?.id === repository?.id) {
				if (repository) {
					goto(`/${repository.id}/board`);
				}
			}
		});
		unsubscribeActiveRepository();
		return repository;
	}
</script>

{#if !hidden}
	<div class="popup" class:collapsed={isNavCollapsed}>
		{#if $repositories.length > 0}
			<div class="popup__projects">
				{#each $repositories as repository}
					{@const selected = repository.id == $activeRepository?.id}
					<ListItem
						{selected}
						icon={selected ? 'tick' : undefined}
						on:click={() => {
							hide();
							activeRepository.setActive(repository.id);
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
