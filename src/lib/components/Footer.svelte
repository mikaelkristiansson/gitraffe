<script lang="ts">
	import AccountLink from '$lib/components/AccountLink.svelte';
	import IconButton from '$lib/components/IconButton.svelte';
	// import type { User } from '$lib/backend/cloud';
	// import { goto } from '$app/navigation';
	import Modal from './Modal.svelte';
	import RepositorySettings from './RepositorySettings.svelte';
	import type { Repository } from '$lib/models/repository';
	import Button from './Button.svelte';

	// export let user: User | undefined;
	export let repository: Repository;
	export let isNavCollapsed: boolean;

	let repositorySettingsModal: Modal;
</script>

<div class="footer" class:collapsed={isNavCollapsed}>
	<div class="left-btns">
		<IconButton
			icon="settings"
			help="Project settings"
			size={isNavCollapsed ? 'l' : 'm'}
			width={isNavCollapsed ? '100%' : undefined}
			on:mousedown={() => repositorySettingsModal.show()}
		/>
	</div>
	<AccountLink {isNavCollapsed} />
</div>

<Modal width="default" title="Repository settings" bind:this={repositorySettingsModal}>
	<RepositorySettings {repository} />
	<svelte:fragment slot="controls" let:close>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	.footer {
		display: flex;
		justify-content: space-between;
		padding: var(--size-12);
		border-top: 1px solid var(--clr-theme-container-outline-light);
		border-color: var(--clr-theme-container-outline-light);
	}

	.left-btns {
		display: flex;
		gap: var(--size-2);
	}

	.footer.collapsed {
		flex-direction: column;
		padding: 0 var(--size-14);
		align-items: flex-start;
		gap: var(--size-4);
		border: none;

		& .left-btns {
			flex-direction: column;
		}
	}
</style>
