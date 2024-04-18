<script lang="ts">
	import FileStatusCircle from './FileStatusCircle.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import {
		isConflictedFileStatus,
		isConflictWithMarkers,
		type WorkingDirectoryFileChange
	} from '$lib/models/status';
	import { tooltip } from '$lib/utils/tooltip';

	export let file: WorkingDirectoryFileChange;
</script>

<div class="file-status" use:tooltip={{ delay: 400, text: file.status.kind }}>
	{#if isConflictedFileStatus(file.status)}
		{#if isConflictWithMarkers(file.status) && file.status.conflictMarkerCount > 0}
			<Icon name="warning-small" color="error" />
		{:else}
			<Icon name="success-small" color="success" />
		{/if}
	{:else}
		<div class="file-status__circle">
			<FileStatusCircle status={file.status.kind} />
		</div>
	{/if}
</div>

<style lang="postcss">
	.file-status {
		display: flex;
		align-items: center;
		gap: var(--size-4);
	}
	.file-status__circle {
		margin-right: var(--size-4);
	}
</style>
