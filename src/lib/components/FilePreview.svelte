<script lang="ts">
	import type { Repository } from '$lib/models/repository';
	import type { ChangedFile } from '$lib/models/status';
	import noSelectSvg from '$lib/assets/illu/galaxy.svg?raw';
	import { slide } from 'svelte/transition';
	import FileCard from './FileCard.svelte';
	import { quintOut } from 'svelte/easing';
	import type { SetSelected } from '$lib/types';

	export let selected: ChangedFile | undefined;
	export let setSelected: SetSelected;
	export let repository: Repository;
	export let isCommitedFile: boolean;
</script>

{#if selected}
	{#key selected.id}
		<div
			class="flex relative w-full h-full overflow-hidden items-start"
			in:slide={{ duration: 180, easing: quintOut, axis: 'x' }}
		>
			<FileCard
				file={selected}
				{isCommitedFile}
				{repository}
				readonly={selected.status.kind !== 'Conflicted'}
				on:close={() => {
					selected = undefined;
					setSelected(undefined);
				}}
			/>
		</div>
	{/key}
{:else}
	<div
		class="flex flex-grow flex-col items-center text-center justify-center h-full cursor-default select-none text-card-foreground/30"
	>
		<div class="[&>svg]:w-40 [&>svg]:h-40 [&>svg>path]:fill-muted-foreground opacity-20 mb-3">
			{@html noSelectSvg}
		</div>
		<h2 class="text-muted-foreground text-center text-xs opacity-60">No selected file</h2>
	</div>
{/if}
