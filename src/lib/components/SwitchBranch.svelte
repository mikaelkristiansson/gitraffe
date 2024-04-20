<script lang="ts">
	import { onMount } from 'svelte';
	import Button from './Button.svelte';
	import Modal from './Modal.svelte';
	import RadioButton from './RadioButton.svelte';
	import SectionCard from './SectionCard.svelte';
	import type { Branch } from '$lib/models/branch';
	import { untracked } from '$lib/stores/modal';
	import { checkoutAndBringChanges, checkoutAndLeaveChanges } from '$lib/utils/branch';
	import { updateCurrentBranch } from '$lib/store-updater';
	import { goto } from '$app/navigation';
	import { activeBranch, workingBranch } from '$lib/stores/branch';
	import { activeRepository } from '$lib/stores/repository';

	export let branch: Branch;
	export let href: string;
	let untrackedModal: Modal;

	let form: HTMLFormElement;
	let selectedChangeBranchType = 'stashed';

	$: branch$ = branch;

	function onFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		selectedChangeBranchType = formData.get('changeBranch') as KeyType;
	}

	function onShow(e: any) {
		branch$ = e.detail.branch;
		selectedChangeBranchType = 'stashed';
		requestAnimationFrame(() => {
			form.changeBranch.value = selectedChangeBranchType;
		});
	}

	onMount(() => {
		untracked.set(untrackedModal);
	});
</script>

<Modal width="default" title="Manage Branch" bind:this={untrackedModal} on:open={onShow}>
	<div class="flex flex-col gap-4">
		You have changes on the branch that are not committed. What would you like to do?
		<form class="git-radio" bind:this={form} on:change={(e) => onFormChange(e.currentTarget)}>
			<SectionCard roundedTop={true} roundedBottom={false} orientation="row" labelFor="stash">
				<svelte:fragment slot="title">Leave my changes on {$activeBranch.name}</svelte:fragment>

				<svelte:fragment slot="actions">
					<RadioButton name="changeBranch" id="stash" value="stashed" />
				</svelte:fragment>

				<svelte:fragment slot="caption">
					Your in-progress work will be stashed on this branch for you to return to later
				</svelte:fragment>
			</SectionCard>

			<SectionCard
				roundedTop={false}
				roundedBottom={true}
				orientation="row"
				labelFor="bring-changes"
			>
				<svelte:fragment slot="title">Bring my changes to {branch$.name}</svelte:fragment>

				<svelte:fragment slot="caption">
					Your in-progress work will follow you to the new branch
				</svelte:fragment>

				<svelte:fragment slot="actions">
					<RadioButton name="changeBranch" value="bringChanges" id="bring-changes" />
				</svelte:fragment>
			</SectionCard>
		</form>
	</div>
	<svelte:fragment slot="controls" let:close>
		<Button kind="outlined" color="neutral" on:click={close}>Cancel</Button>
		<Button
			color="error"
			on:click={async () => {
				if ($activeRepository && $workingBranch?.workingDirectory) {
					if (selectedChangeBranchType === 'stashed') {
						await checkoutAndLeaveChanges(
							$activeRepository,
							branch$,
							$activeBranch,
							$workingBranch.workingDirectory,
							null
						);
					} else {
						await checkoutAndBringChanges(
							$activeRepository,
							branch$,
							$workingBranch?.workingDirectory,
							null
						);
					}
					await updateCurrentBranch($activeRepository, branch$);
					if (href) goto(href);
				}
				untrackedModal.close();
			}}
		>
			Confirm
		</Button>
	</svelte:fragment>
</Modal>