<script lang="ts">
	import FileStatusCircle from './FileStatusCircle.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import {
		isConflictedFileStatus,
		isConflictWithMarkers,
		type ChangedFile
	} from '$lib/models/status';

	export let file: ChangedFile;
</script>

<Tooltip.Root>
	<Tooltip.Trigger class="cursor-auto">
		<div class="flex items-center gap-1">
			{#if isConflictedFileStatus(file.status)}
				{#if isConflictWithMarkers(file.status) && file.status.conflictMarkerCount > 0}
					<Icon name="warning-small" color="error" />
				{:else}
					<Icon name="success-small" color="success" />
				{/if}
			{:else}
				<div class="mr-1">
					<FileStatusCircle status={file.status.kind} />
				</div>
			{/if}
		</div>
	</Tooltip.Trigger>
	<Tooltip.Content>{file.status.kind}</Tooltip.Content>
</Tooltip.Root>
