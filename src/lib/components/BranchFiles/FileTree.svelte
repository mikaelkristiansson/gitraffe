<script context="module" lang="ts">
	let fileTreeId = 0;
</script>

<script lang="ts">
	import TreeListFile from './TreeListFile.svelte';
	import TreeListFolder from './TreeListFolder.svelte';
	import type { TreeNode } from './filetree';
	import type { Writable } from 'svelte/store';
	import type { WorkingDirectoryFileChange } from '$lib/models/status';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository | undefined;
	export let expanded = true;
	export let node: TreeNode;
	export let isRoot = false;
	export let showCheckboxes = false;
	export let selectedFiles: Writable<WorkingDirectoryFileChange[]>;
	export let branchId: string;
	export let isUnapplied: boolean;
	export let readonly = false;
	export let files: WorkingDirectoryFileChange[];
	export let selected: WorkingDirectoryFileChange | undefined = undefined;
	export let setSelected: (
		file: WorkingDirectoryFileChange
	) => WorkingDirectoryFileChange | undefined = () => undefined;

	function toggle() {
		expanded = !expanded;
	}
</script>

{#if isRoot}
	<!-- Node is a root and should only render children! -->
	<ul id={`fileTree-${fileTreeId++}`}>
		{#each node.children as childNode}
			<li>
				<svelte:self
					node={childNode}
					{showCheckboxes}
					{selectedFiles}
					{branchId}
					{isUnapplied}
					{readonly}
					{selected}
					{files}
					{repository}
					{setSelected}
					on:checked
					on:unchecked
				/>
			</li>
		{/each}
	</ul>
{:else if node.file}
	{@const file = node.file}
	<!-- Node is a file -->
	<TreeListFile
		file={node.file}
		{repository}
		showCheckbox={showCheckboxes}
		{selected}
		on:click={(e) => {
			e.stopPropagation();
			setSelected(file);
		}}
	/>
{:else if node.children.length > 0}
	<!-- Node is a folder -->
	<TreeListFolder showCheckbox={showCheckboxes} {node} on:mousedown={toggle} {expanded} />

	<!-- We assume a folder cannot be empty -->
	{#if expanded}
		<div class="nested">
			<div class="line-wrapper">
				<div class="line" />
			</div>
			<div class="flex w-full flex-col overflow-hidden">
				{#each node.children as childNode}
					<svelte:self
						node={childNode}
						expanded={true}
						{showCheckboxes}
						{selectedFiles}
						{branchId}
						{isUnapplied}
						{readonly}
						{files}
						{repository}
						on:checked
						on:unchecked
					/>
				{/each}
			</div>
		</div>
	{/if}
{/if}

<style lang="postcss">
	.nested {
		display: flex;
	}
	.line-wrapper {
		position: relative;
		padding-left: var(--size-12);
		padding-right: var(--size-6);
	}
	.line {
		width: var(--size-2);
		height: 100%;
		border-left: 1px dashed var(--clr-theme-scale-ntrl-60);
	}
</style>
