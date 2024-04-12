<script lang="ts">
	import BaseBranchCard from './BaseBranchCard.svelte';
	import Branches from './Branches.svelte';
	import DomainButton from './DomainButton.svelte';
	import Footer from './Footer.svelte';
	import ProjectSelector from './ProjectSelector.svelte';
	// import { SETTINGS_CONTEXT, type SettingsStore } from '$lib/settings/userSettings';
	// import * as hotkeys from '$lib/utils/hotkeys';
	// import { unsubscribe } from '$lib/utils/random';
	// import { platform } from '@tauri-apps/api/os';
	// import { onMount } from 'svelte';
	// import { getContext } from 'svelte';
	// import type { User } from '$lib/backend/cloud';
	// import Button from './Button.svelte';
	// import { goto } from '$app/navigation';
	import type { Repository } from '$lib/models/repository';
	import type { Branch } from '$lib/models/branch';

	export let repository: Repository;
	export let defaultBranch: Branch;
	// export let user: User | undefined;

	const minResizerWidth = 280;
	const minResizerRatio = 150;
	// const platformName = platform();
	// const userSettings = getContext<SettingsStore>(SETTINGS_CONTEXT);
	const defaultTrayWidthRem = undefined;

	let viewport: HTMLDivElement;
	let isResizerHovered = false;
	let isResizerDragging = false;
	let isScrollbarDragging = false;

	$: isNavCollapsed = false;

	function toggleNavCollapse() {
		isNavCollapsed = !isNavCollapsed;
	}

	// onMount(() =>
	// 	unsubscribe(
	// 		hotkeys.on('Meta+/', () => {
	// 			toggleNavCollapse();
	// 		})
	// 	)
	// );
</script>

<aside class="navigation-wrapper" class:hide-fold-button={isScrollbarDragging}>
	<div
		class="resizer-wrapper"
		tabindex="0"
		role="button"
		class:folding-button_folded={isNavCollapsed}
	>
		<button
			class="folding-button"
			class:resizer-hovered={isResizerHovered || isResizerDragging}
			on:mousedown={toggleNavCollapse}
		>
			<svg viewBox="0 0 7 23" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path
					d="M6 1L1.81892 9.78026C1.30084 10.8682 1.30084 12.1318 1.81892 13.2197L6 22"
					stroke-width="1.5"
					vector-effect="non-scaling-stroke"
				/>
			</svg>
		</button>
	</div>
	<div
		class="navigation"
		class:collapsed={isNavCollapsed}
		style:width={defaultTrayWidthRem && !isNavCollapsed ? defaultTrayWidthRem + 'rem' : null}
		bind:this={viewport}
		role="menu"
		tabindex="0"
	>
		<div class="navigation-top">
			<div class="drag-region" data-tauri-drag-region />
			<ProjectSelector {repository} {isNavCollapsed} />
			<div class="domains">
				<BaseBranchCard {repository} {isNavCollapsed} />
				<DomainButton
					href={`/${repository.id}/board`}
					domain="workspace"
					label="Workspace"
					iconSrc="/images/domain-icons/working-branches.svg"
					{isNavCollapsed}
				/>
			</div>
		</div>
		{#if !isNavCollapsed}
			<Branches
				{repository}
				{defaultBranch}
				on:scrollbarDragging={(e) => (isScrollbarDragging = e.detail)}
			/>
		{/if}
		<Footer repositoryId={repository.id} {isNavCollapsed} />
	</div>
</aside>

<style lang="postcss">
	.navigation-wrapper {
		display: flex;
		position: relative;

		&:hover:not(.hide-fold-button) {
			& .folding-button {
				pointer-events: auto;
				opacity: 1;
				right: calc(var(--size-6) * -1);
			}
		}
	}

	.navigation {
		width: 17.5rem;
		display: flex;
		flex-direction: column;
		position: relative;
		background: var(--clr-theme-container-light);
		max-height: 100%;
		border-right: 1px solid var(--clr-theme-container-outline-light);
		user-select: none;
	}

	.drag-region {
		flex-shrink: 0;
		height: var(--size-32);
	}
	.navigation-top {
		display: flex;
		flex-direction: column;
		padding-bottom: var(--size-24);
		padding-left: var(--size-14);
		padding-right: var(--size-14);
	}
	.domains {
		display: flex;
		flex-direction: column;
		gap: var(--size-4);
	}

	.resizer-wrapper {
		position: absolute;
		top: 0;
		right: 0;
		height: 100%;
		width: var(--size-4);
	}

	/* FOLDING BUTTON */

	.folding-button {
		z-index: 42;
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		right: calc(var(--size-4) * -1);
		top: 50%;
		width: 0.875rem;
		height: var(--size-36);
		background: var(--clr-theme-container-light);
		border-radius: var(--radius-m);
		border: 1px solid var(--clr-theme-container-outline-light);
		pointer-events: none;
		opacity: 0;
		transition:
			background-color var(--transition-fast),
			border-color var(--transition-fast),
			opacity var(--transition-medium),
			right var(--transition-fast);

		& svg {
			stroke: var(--clr-theme-scale-ntrl-60);
			transition: stroke var(--transition-fast);
			width: 45%;
		}

		&:hover {
			border-color: color-mix(
				in srgb,
				var(--clr-theme-container-outline-light),
				var(--darken-tint-dark)
			);

			& svg {
				stroke: var(--clr-theme-scale-ntrl-50);
			}
		}
	}

	.folding-button_folded {
		& svg {
			transform: rotate(180deg) translateX(-0.0625rem);
		}
	}

	/* MODIFIERS */

	.navigation.collapsed {
		width: auto;
		justify-content: space-between;
		padding-bottom: var(--size-16);
	}

	.resizer-hovered {
		background-color: var(--resizer-color);
		border: 1px solid var(--resizer-color);
		transition-delay: 0.1s;

		& svg {
			stroke: var(--clr-theme-scale-ntrl-100);
			transition-delay: 0.1s;
		}
	}
</style>
