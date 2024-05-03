<script lang="ts">
	import ProjectAvatar from './ProjectAvatar.svelte';
	import ProjectsPopup from './ProjectsPopup.svelte';
	import { clickOutside } from '$lib/utils/clickOutside';
	import Icon from '$lib/components/Icon.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import type { Repository } from '$lib/models/repository';

	export let repository: Repository;
	export let isNavCollapsed: boolean;

	let popup: ProjectsPopup;
	let visible: boolean = false;

	$: ({ name } = repository);
</script>

<div
	class="wrapper"
	use:clickOutside={{
		handler: () => {
			popup.hide();
			visible = false;
		},
		enabled: visible
	}}
>
	<Tooltip.Root>
		<Tooltip.Trigger asChild={!isNavCollapsed} class="cursor-auto w-full">
			<button
				class="button"
				on:mousedown={(e) => {
					visible = popup.toggle();
					e.preventDefault();
				}}
			>
				<ProjectAvatar {name} />
				{#if !isNavCollapsed}
					<span class="button__label text-sm font-bold">{name}</span>
					<div class="button__icon">
						<Icon name="select-chevron" />
					</div>
				{/if}
			</button>
		</Tooltip.Trigger>
		<Tooltip.Content>
			{isNavCollapsed ? name : ''}
		</Tooltip.Content>
	</Tooltip.Root>
	<ProjectsPopup bind:this={popup} {isNavCollapsed} />
</div>

<style lang="postcss">
	.wrapper {
		position: relative;
		/* margin-bottom: var(--size-16); */
		@apply mb-4;
		height: fit-content;
	}

	.button {
		display: flex;
		/* gap: var(--size-10); */
		width: 100%;
		/* padding: var(--size-10); */
		/* border-radius: var(--radius-m); */
		@apply bg-muted/60 rounded-md p-2 gap-2;

		align-items: center;
		justify-content: space-between;

		transition: background-color var(--transition-fast);

		&:focus,
		&:hover {
			@apply bg-muted;

			& .button__icon {
				opacity: 0.4;
			}
		}
	}

	.button__label {
		flex-grow: 1;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.button__icon {
		opacity: 0.3;
		display: flex;
	}
</style>
