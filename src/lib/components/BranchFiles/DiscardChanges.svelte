<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { toast } from 'svelte-sonner';
	import type { ChangedFile } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';
	import { discardChanges } from '$lib/git/discard';
	import { workingBranch } from '$lib/stores/branch';
	import type { SetSelected } from '$lib/types';

	export let file: ChangedFile;
	export let repository: Repository;
	export let setSelected: SetSelected;
	export let dialogDiscardOpen = false;
</script>

<Dialog.Root bind:open={dialogDiscardOpen}>
	<Dialog.Content size="sm">
		<Dialog.Header>
			<Dialog.Title>Discard changes</Dialog.Title>
		</Dialog.Header>
		<p>Discarding changes to the following files:</p>
		<ul class="bg-muted rounded-md px-4 py-2 list-disc">
			<li class="ml-2">
				<pre class="whitespace-pre-wrap break-words">{file.path}</pre>
			</li>
		</ul>
		<Dialog.Footer>
			<Button variant="outline" on:click={() => (dialogDiscardOpen = false)}>Cancel</Button>
			<Button
				color="error"
				on:click={async () => {
					try {
						await discardChanges([file], repository);
						await workingBranch.setWorking(repository);
						setSelected(undefined);
						toast.success(`Changes discarded for ${file.path}`);
					} catch (e) {
						console.error('Failed to discard changes', e);
						toast.error('Failed to discard changes');
					} finally {
						dialogDiscardOpen = false;
					}
				}}
			>
				Confirm
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
