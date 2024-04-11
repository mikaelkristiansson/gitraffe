<script lang="ts">
	import FileStatusCircle from './FileStatusCircle.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import { tooltip } from '$lib/utils/tooltip';

	export let file: WorkingDirectoryFileChange;
	$: isLocked = false; //file.hunks.some((h) => h.locked);
</script>

<div class="file-status" use:tooltip={{ delay: 400, text: file.status.kind }}>
	<div class="file-status__icons">
		{#if isLocked}
			<div class="locked">
				<Icon name="locked-small" color="warn" />
			</div>
		{/if}
		{#if file.status.kind === 'Conflicted'}
			<div class="conflicted">
				<Icon name="warning-small" color="error" />
			</div>
		{/if}
	</div>
	<div class="status">
		<FileStatusCircle status={file.status.kind} />
	</div>
</div>

<style lang="postcss">
	.file-status {
		display: flex;
		align-items: center;
		gap: var(--size-4);
	}
	.file-status__icons {
		display: flex;
	}
</style>
