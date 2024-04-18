<script lang="ts">
	import FileContextMenu from './FileContextMenu.svelte';
	import FileStatusIcons from './FileStatusIcons.svelte';
	import Checkbox from '$lib/components/Checkbox.svelte';
	import { getVSIFileIcon } from '$lib/ext-icons';
	import { onDestroy } from 'svelte';
	import type { Writable } from 'svelte/store';
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository | undefined;
	export let branchId: string;
	export let file: WorkingDirectoryFileChange;
	export let isUnapplied: boolean;
	export let selected: boolean;
	export let files: WorkingDirectoryFileChange[];
	export let showCheckbox: boolean = false;
	export let selectedFiles: Writable<WorkingDirectoryFileChange[]>;
	export let setSelected: (
		file: WorkingDirectoryFileChange
	) => WorkingDirectoryFileChange | undefined;
	export let readonly = false;

	let checked = false;
	let indeterminate = false;

	$: if (file) {
		const fileId = file.id;
		checked = $selectedFiles.some((f) => f.id == fileId);
	}

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

<div class="list-item-wrapper">
	{#if showCheckbox}
		<Checkbox
			small
			{checked}
			{indeterminate}
			on:change={(e) => {
				selectedFiles.update((selectedF) => {
					if (e.detail) selectedF.push(file);
					if (!e.detail) selectedF = selectedF.filter((f) => f.id != file.id);
					return selectedF;
				});
			}}
		/>
	{/if}
	<div
		class="file-list-item"
		id={`file-${file.id}`}
		on:click
		on:keydown
		role="button"
		tabindex="0"
		class:selected
		on:contextmenu|preventDefault={(e) =>
			popupMenu.openByMouse(e, {
				file,
				files,
				setSelected
			})}
	>
		<div class="info-wrap">
			<div class="info">
				<img draggable="false" class="file-icon" src={getVSIFileIcon(file.path)} alt="js" />
				<span class="text-base-12 name">
					{file.path.split('/').pop()}
				</span>
				<span class="text-base-12 path">
					{file.path}
				</span>
			</div>
		</div>
		<FileStatusIcons {file} />
	</div>
</div>

<style lang="postcss">
	.list-item-wrapper {
		display: flex;
		align-items: center;
		gap: var(--size-8);
	}

	.file-list-item {
		flex: 1;
		display: flex;
		align-items: center;
		height: var(--size-28);
		padding: var(--size-4) var(--size-8);
		gap: var(--size-16);
		border-radius: var(--radius-s);
		max-width: 100%;
		overflow: hidden;
		text-align: left;
		user-select: none;
		outline: none;
		margin-bottom: var(--size-2);
		transition: background-color var(--transition-fast);
		background: var(--clr-theme-container-light);
		&:not(.selected-draggable):hover {
			transition: none;
			background-color: color-mix(
				in srgb,
				var(--clr-theme-container-light),
				var(--darken-tint-light)
			);
		}
	}

	.info-wrap {
		display: flex;
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		gap: var(--size-10);
		overflow: hidden;
	}
	.info {
		display: flex;
		align-items: center;
		flex-grow: 1;
		flex-shrink: 1;
		gap: var(--size-6);
		overflow: hidden;
	}

	.file-icon {
		width: var(--size-12);
	}
	.name {
		color: var(--clr-theme-scale-ntrl-0);
		white-space: nowrap;
		flex-shrink: 0;
		text-overflow: ellipsis;
		overflow: hidden;
		line-height: 120%;
	}
	.path {
		color: var(--clr-theme-scale-ntrl-0);
		line-height: 120%;
		flex-shrink: 1;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
		opacity: 0.3;
	}
	.selected {
		background-color: var(--clr-theme-scale-pop-80);

		&:hover {
			background-color: color-mix(in srgb, var(--clr-theme-scale-pop-80), var(--darken-extralight));
		}
	}
</style>
