<script lang="ts">
	import BaseBranchCard from './BaseBranchCard.svelte';
	import Branches from './Branches.svelte';
	import Footer from './Footer.svelte';
	import ProjectSelector from './ProjectSelector.svelte';
	import type { Repository } from '$lib/models/repository';
	import { cn } from '$lib/utils';

	export let repository: Repository;

	let isNavCollapsed = false;

	function toggleNavCollapse() {
		isNavCollapsed = !isNavCollapsed;
	}
</script>

<aside class="relative flex group">
	<div class="absolute top-0 right-0 w-1 h-full" tabindex="0" role="button">
		<button
			class="group-hover:opacity-100 flex opacity-0 items-center justify-center absolute -right-1.5 top-1/2 transform -translate-y-1/2 w-3 h-8 border rounded-md bg-background z-10"
			on:mousedown={toggleNavCollapse}
		>
			<svg
				viewBox="0 0 7 23"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				class={cn(
					'w-[45%] stroke-gray-600 dark:stroke-gray-200',
					isNavCollapsed && 'transform rotate-180'
				)}
			>
				<path
					d="M6 1L1.81892 9.78026C1.30084 10.8682 1.30084 12.1318 1.81892 13.2197L6 22"
					stroke-width="1.5"
					vector-effect="non-scaling-stroke"
				/>
			</svg>
		</button>
	</div>
	<div
		class={cn('border-r bg-background flex flex-col relative max-h-full', {
			'w-72': !isNavCollapsed,
			'w-auto': isNavCollapsed
		})}
		role="menu"
		tabindex="0"
	>
		<div class="flex flex-col px-4 pb-4">
			<div class="shrink-0 h-8" data-tauri-drag-region></div>
			<ProjectSelector {repository} {isNavCollapsed} />
			<BaseBranchCard {repository} {isNavCollapsed} />
		</div>
		<Branches {repository} {isNavCollapsed} />
		<Footer {repository} {isNavCollapsed} />
	</div>
</aside>
