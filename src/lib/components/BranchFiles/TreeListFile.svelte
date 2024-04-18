<script lang="ts">
	import FileContextMenu from './FileContextMenu.svelte';
	import FileStatusIcons from './FileStatusIcons.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { getVSIFileIcon } from '$lib/ext-icons/index';
	import { onDestroy } from 'svelte';
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository | undefined;
	export let file: WorkingDirectoryFileChange;
	export let selected: WorkingDirectoryFileChange | undefined;
	export let showCheckbox: boolean = false;

	let checked = false;
	let indeterminate = false;

	function updateContextMenu() {
		if (popupMenu) popupMenu.$destroy();
		return new FileContextMenu({
			target: document.body,
			props: { repository }
		});
	}

	$: popupMenu = updateContextMenu();

	onDestroy(() => {
		if (popupMenu) {
			popupMenu.$destroy();
		}
	});
</script>

<div
	on:contextmenu|preventDefault={(e) =>
		popupMenu.openByMouse(e, {
			file
		})}
	on:click
	on:keydown
	class="draggable-wrapper"
	role="button"
	tabindex="0"
>
	<div
		class="tree-list-file"
		class:selected={selected?.id === file.id}
		role="listitem"
		on:contextmenu|preventDefault
	>
		<div class="content-wrapper">
			{#if showCheckbox}
				<Checkbox small {checked} {indeterminate} />
			{/if}
			<div class="name-wrapper">
				<img src={getVSIFileIcon(file.path)} alt="js" style="width: var(--size-12)" class="icon" />
				<span class="name text-base-12">
					{file.path}
				</span>
				<FileStatusIcons {file} />
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.draggable-wrapper {
		display: inline-block;
		width: 100%;
		margin-bottom: var(--size-2);
		&:last-child {
			margin-bottom: 0;
		}
	}
	.tree-list-file {
		display: inline-flex;
		align-items: center;
		height: var(--size-control-m);
		padding: var(--size-6) var(--size-8) var(--size-6) var(--size-6);
		gap: var(--size-6);
		border-radius: var(--radius-s);
		width: 100%;
		max-width: 100%;
		outline: none;
		background: var(--clr-theme-container-light);
		&:not(.selected):hover {
			background-color: color-mix(
				in srgb,
				var(--clr-theme-container-light),
				var(--darken-tint-light)
			);
		}
		overflow: hidden;
	}
	.content-wrapper {
		display: flex;
		align-items: center;
		gap: var(--size-10);
		overflow: hidden;
	}
	.name-wrapper {
		display: flex;
		align-items: center;
		gap: var(--size-6);
		overflow: hidden;
	}
	.name {
		color: var(--clr-theme-scale-ntrl-0);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}
	.selected {
		background-color: var(--clr-theme-scale-pop-80);

		&:hover {
			background-color: color-mix(in srgb, var(--clr-theme-scale-pop-80), var(--darken-extralight));
		}
	}
</style>
