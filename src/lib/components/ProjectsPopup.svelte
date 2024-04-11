<script lang="ts">
	import ListItem from './ListItem.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { activeRepository, addRepository, repositories } from '$lib/repository';

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
		activeRepository.subscribe((repo) => {
			if (repo?.id === repository?.id) {
				if (repository) {
					goto(`/${repository.id}/board`);
				}
			}
		});
		return repository;
	}
</script>

{#if !hidden}
	<div class="popup" class:collapsed={isNavCollapsed}>
		{#if $repositories.length > 0}
			<div class="popup__projects">
				{#each $repositories as repository}
					{@const selected = repository.id == $page.params.repositoryId}
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
		margin-top: var(--size-6);
		border-radius: var(--m, 6px);
		border: 1px solid var(--clr-theme-container-outline-light);
		background: var(--clr-theme-container-light);
		/* shadow/s */
		box-shadow: 0px 7px 14px 0px rgba(0, 0, 0, 0.1);
	}
	.popup__actions {
		padding: var(--size-8);
		border-top: 1px solid var(--clr-theme-scale-ntrl-70);
	}
	.popup__projects {
		display: flex;
		flex-direction: column;
		gap: var(--size-2);
		padding: var(--size-8);
	}

	/* MODIFIERS */
	.popup.collapsed {
		width: 240px;
	}
</style>
