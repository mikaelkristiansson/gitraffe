<script lang="ts">
	import { Label } from '$lib/components/ui/label';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import * as Card from '$lib/components/ui/card';
	import type { Branch } from '$lib/models/branch';
	import * as Dialog from './ui/dialog';
	import { checkoutAndBringChanges, checkoutAndLeaveChanges } from '$lib/utils/branch';
	import { updateCurrentBranch } from '$lib/store-updater';
	import { goto } from '$app/navigation';
	import { activeBranch, workingBranch } from '$lib/stores/branch';
	import { createRepositories } from '$lib/stores/repository.svelte';
	import { Button } from './ui/button';
	import { toast } from 'svelte-sonner';

	export let branch: Branch;
	export let href: string;
	export let dialogSwitchOpen = false;

	const repositoryStore = createRepositories();

	let form: HTMLFormElement;
	let selectedChangeBranchType = 'stashed';

	$: branch$ = branch;

	function onFormChange(form: HTMLFormElement) {
		const formData = new FormData(form);
		selectedChangeBranchType = formData.get('changeBranch') as KeyType;
	}

	const onShow = () => {
		selectedChangeBranchType = 'stashed';
		requestAnimationFrame(() => {
			form.changeBranch.value = selectedChangeBranchType;
		});
	};
	$: dialogSwitchOpen && onShow();
</script>

<Dialog.Root bind:open={dialogSwitchOpen}>
	<Dialog.Content size="md">
		<Dialog.Header>
			<Dialog.Title>Manage Branch</Dialog.Title>
		</Dialog.Header>
		<div class="flex flex-col gap-4">
			<span class="text-sm font-normal"
				>You have changes on the branch that are not committed. What would you like to do?</span
			>
			<form bind:this={form} on:change={(e) => onFormChange(e.currentTarget)}>
				<RadioGroup.Root bind:value={selectedChangeBranchType} class="gap-0">
					<Card.Root class="rounded-b-none hover:bg-muted">
						<Card.Content class="flex items-center gap-3 pt-4">
							<Label for="stash" class="cursor-pointer font-normal">
								<p class="text-sm font-bold">Leave my changes on {$activeBranch.name}</p>
								Your in-progress work will be stashed on this branch for you to return to later</Label
							>
							<RadioGroup.Item name="changeBranch" value="stashed" id="stash" />
						</Card.Content>
					</Card.Root>
					<Card.Root class="rounded-t-none border-t-0 hover:bg-muted">
						<Card.Content class="flex items-center gap-3 pt-4">
							<Label for="bring-changes" class="cursor-pointer font-normal">
								<p class="text-sm font-bold">Bring my changes to {branch$.name}</p>
								Your in-progress work will follow you to the new branch
							</Label>
							<RadioGroup.Item name="changeBranch" value="bringChanges" id="bring-changes" />
						</Card.Content>
					</Card.Root>
				</RadioGroup.Root>
			</form>
		</div>
		<Dialog.Footer>
			<Button variant="outline" on:click={() => (dialogSwitchOpen = false)}>Cancel</Button>
			<Button
				variant="default"
				on:click={async () => {
					if (repositoryStore.activeRepository && $workingBranch?.workingDirectory) {
						if (selectedChangeBranchType === 'stashed') {
							await checkoutAndLeaveChanges(
								repositoryStore.activeRepository,
								branch$,
								$activeBranch,
								$workingBranch.workingDirectory,
								null
							);
						} else {
							try {
								await checkoutAndBringChanges(
									repositoryStore.activeRepository,
									branch$,
									$workingBranch?.workingDirectory,
									null
								);
							} catch (e) {
								console.error(e);
								toast.error('Failed to switch branch');
							}
						}
						await updateCurrentBranch(repositoryStore.activeRepository, branch$);
						if (href) goto(href);
					}
					dialogSwitchOpen = false;
				}}
			>
				Confirm
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
