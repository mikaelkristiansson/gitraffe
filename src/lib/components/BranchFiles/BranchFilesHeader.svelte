<script lang="ts">
	import { Checkbox } from '$lib/components/ui/checkbox';
	import type { ChangedFile } from '$lib/models/status';
	import type { Writable } from 'svelte/store';
	import { Badge } from '../ui/badge';

	export let files: ChangedFile[];
	export let showCheckboxes = false;
	export let selectedFiles: Writable<ChangedFile[]>;

	function isAllChecked(selectedCheckboxes: ChangedFile[]): boolean {
		return files.every((f) => selectedCheckboxes.some((box) => box.id === f.id));
	}

	$: checked = isAllChecked($selectedFiles);
</script>

<div class="flex items-center justify-between">
	<div class="flex gap-2 items-center">
		{#if showCheckboxes && files.length > 1}
			<Checkbox
				size="sm"
				{checked}
				onCheckedChange={(v) => {
					if (v) {
						selectedFiles.set(files);
					} else {
						selectedFiles.set([]);
					}
				}}
			/>
		{/if}
		<div class="flex items-center gap-1 text-sm font-semibold">
			<span>Changes</span>
			<Badge size="sm" variant="secondary">{files.length}</Badge>
		</div>
	</div>
</div>
