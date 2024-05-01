<script lang="ts">
	import Badge from '$lib/components/Badge.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import type { ChangedFile } from '$lib/models/status';
	import type { Writable } from 'svelte/store';

	export let files: ChangedFile[];
	export let showCheckboxes = false;
	export let selectedFiles: Writable<ChangedFile[]>;

	function isAllChecked(selectedCheckboxes: ChangedFile[]): boolean {
		return files.every((f) => selectedCheckboxes.some((box) => box.id === f.id));
	}

	$: checked = isAllChecked($selectedFiles);
</script>

<div class="header">
	<div class="header__left">
		{#if showCheckboxes && files.length > 1}
			<Checkbox
				small
				{checked}
				on:change={(e) => {
					if (e.detail) {
						selectedFiles.set(files);
					} else {
						selectedFiles.set([]);
					}
				}}
			/>
		{/if}
		<div class="header__title text-base-13 text-semibold">
			<span>Changes</span>
			<Badge count={files.length} />
		</div>
	</div>
</div>

<style lang="postcss">
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.header__title {
		display: flex;
		align-items: center;
		gap: var(--size-4);
		color: var(--clr-theme-scale-ntrl-0);
	}
	.header__left {
		display: flex;
		gap: var(--size-10);
	}
</style>
