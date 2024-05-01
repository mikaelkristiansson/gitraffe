<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';

	export let dialogOpen = false;
	export let onSubmit: (branchName: string) => void;
	export let submitText = 'Save';
	export let name = '';

	const submit = (e: Event) => {
		e.preventDefault();
		const formData = new FormData(form as HTMLFormElement);
		const branchName = formData.get('name') as string;
		onSubmit(branchName);
	};

	let form: HTMLFormElement;
</script>

<Dialog.Root bind:open={dialogOpen}>
	<Dialog.Content size="sm">
		<form bind:this={form} on:submit={submit} class="grid gap-6">
			<Dialog.Header>
				<Dialog.Title>Create New Branch</Dialog.Title>
			</Dialog.Header>
			<div class="flex w-full flex-col gap-1.5">
				<Label for="name">Branch name</Label>
				<Input
					type="text"
					initialFocus
					value={name}
					id="name"
					name="name"
					placeholder="Enter branch name"
				/>
			</div>
			<Dialog.Footer>
				<Button variant="outline" on:click={() => (dialogOpen = false)}>Cancel</Button>
				<Button type="submit">{submitText}</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
