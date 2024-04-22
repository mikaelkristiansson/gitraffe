<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import { createBranch } from '$lib/git/branch';
	import type { Repository } from '$lib/models/repository';
	import { allBranches, defaultBranch } from '$lib/stores/branch';
	import { success } from '$lib/utils/toasts';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import TextBox from './TextBox.svelte';

	export let count: number | string | undefined;
	export let repository: Repository;

	let createBranchModal: Modal;
	let form: HTMLFormElement;

	const createNewBranch = async (e: Event) => {
		e?.preventDefault();
		const formData = new FormData(form as HTMLFormElement);
		const branchName = formData.get('name') as string;
		await createBranch(repository, branchName, null);
		createBranchModal.close();
		success(`Creating branch ${branchName}`);
		await allBranches.fetch(repository, {
			defaultBranchUpstreamName: $defaultBranch.upstream || 'HEAD'
		});
	};
</script>

<div class="header">
	<div class="branches-title">
		<span class="text-base-14 text-semibold">Branches</span>

		{#if count !== undefined}
			<Badge {count} />
		{/if}
	</div>
	<div class="header__new-btn">
		<Button
			color="neutral"
			kind="outlined"
			icon="plus-small"
			on:mousedown={() => createBranchModal.show()}>Create branch</Button
		>
	</div>
</div>
<Modal width="small" title="Create New Branch" bind:this={createBranchModal}>
	<form bind:this={form} on:submit={createNewBranch}>
		<TextBox initialFocus label="Branch name" name="name" placeholder="Enter branch name" />
	</form>
	<svelte:fragment slot="controls" let:close>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
		<Button color="success" on:click={createNewBranch}>Create</Button>
	</svelte:fragment>
</Modal>

<style lang="postcss">
	.header {
		display: flex;
		color: var(--clr-theme-scale-ntrl-0);
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: var(--size-14) var(--size-14) var(--size-12) var(--size-14);
		gap: var(--size-8);
		border-bottom: 1px solid transparent;
		transition: border-bottom var(--transition-fast);
		position: relative;
	}
	.branches-title {
		display: flex;
		align-items: center;
		gap: var(--size-4);
	}
	.header__new-btn {
		position: relative;
	}
</style>
