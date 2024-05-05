<script lang="ts" context="module">
	export type TagColor =
		| 'success'
		| 'error'
		| 'warning'
		| 'ghost'
		| 'light'
		| 'dark'
		| 'pop'
		| 'purple'
		| 'neutral';
</script>

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import type iconsJson from '$lib/icons/icons.json';

	export let icon: keyof typeof iconsJson | undefined = undefined;
	export let reversedDirection = false;
	export let color: TagColor = 'light';
	export let size: 'small' | 'medium' | 'large' = 'small';
	export let border = false;
	export let filled = false;
	export let disabled = false;
	export let clickable = false;
	export let loading = false;
	export let shrinkable = false;
	export let verticalOrientation = false;
	export let wide = false;
</script>

<div
	class="tag text-xs font-semibold"
	class:ghost={color == 'ghost'}
	class:neutral={color == 'neutral'}
	class:light={color == 'light'}
	class:dark={color == 'dark'}
	class:success={color == 'success'}
	class:error={color == 'error'}
	class:warning={color == 'warning'}
	class:purple={color == 'purple'}
	class:pop={color == 'pop'}
	class:tag-border={border}
	class:filled
	class:disabled
	class:shrinkable
	class:iconLeft={reversedDirection}
	class:verticalOrientation
	class:not-button={!clickable}
	class:medium={size == 'medium'}
	class:large={size == 'large'}
	on:click
	on:mousedown
	on:contextmenu
	role={clickable ? 'button' : undefined}
	class:clickable
>
	<span class="label" class:verticalLabel={verticalOrientation} class:wide>
		<slot />
	</span>
	{#if loading}
		<Icon name="spinner" />
	{:else if icon}
		<div class="icon" class:verticalIcon={verticalOrientation}>
			<Icon name={icon} spinnerRadius={3.5} />
		</div>
	{/if}
</div>

<style lang="postcss">
	.tag {
		cursor: default;
		display: flex;
		align-items: center;
		justify-content: center;
		@apply py-1 px-2 rounded-md h-5;
		transition: background-color 0.3s;
	}
	.tag.medium {
		@apply px-1 py-2 h-7;
	}
	.tag.large {
		@apply px-2 py-3 h-8;
	}
	.icon {
		flex-shrink: 0;
	}
	.label {
		white-space: nowrap;
		display: inline-block;
		@apply px-0.5 py-0;
	}
	.clickable {
		cursor: pointer;
	}

	/* colors */

	.ghost {
		@apply text-muted-foreground bg-transparent;
		/* color: var(--clr-theme-scale-ntrl-40); */
		&:not(.not-button):hover {
			/* background: color-mix(in srgb, var(--clr-core-ntrl-50), transparent 90%); */
			@apply bg-muted/90;
		}
		&.tag-border {
			/* box-shadow: inset 0 0 0 1px var(--clr-theme-scale-ntrl-60); */
			@apply shadow-inner;
		}
	}
	.neutral {
		color: var(--clr-theme-scale-ntrl-30);
		&:not(.not-button):hover {
			background: color-mix(in srgb, var(--clr-core-ntrl-40), transparent 90%);
		}
		&.tag-border {
			box-shadow: inset 0 0 0 1px var(--clr-theme-scale-ntrl-50);
		}
	}

	.light {
		color: var(--clr-theme-scale-ntrl-40);
		background: color-mix(in srgb, var(--clr-core-ntrl-50), transparent 85%);
		&:not(.not-button):hover {
			background: color-mix(in srgb, var(--clr-core-ntrl-50), transparent 75%);
		}
		&.tag-border {
			box-shadow: inset 0 0 0 1px var(--clr-theme-scale-ntrl-60);
		}
	}

	.dark {
		color: var(--clr-theme-scale-ntrl-100);
		background: var(--clr-theme-scale-ntrl-40);
		&:not(.not-button):hover {
			background: var(--clr-theme-scale-ntrl-30);
		}
	}

	.success {
		/* color: var(--clr-theme-scale-succ-20); */
		@apply bg-green-200/80 text-green-900;
		/* background: color-mix(in srgb, var(--clr-core-succ-50), transparent 80%); */
		&:not(.not-button):hover {
			@apply bg-green-200/70;
			/* background: color-mix(in srgb, var(--clr-core-succ-50), transparent 70%); */
		}
		&.tag-border {
			box-shadow: inset 0 0 0 1px var(--clr-theme-scale-succ-60);
		}
		&.filled {
			color: var(--clr-theme-succ-on-element);
			background: var(--clr-theme-succ-element);
			&:not(.not-button):hover {
				background: color-mix(in srgb, var(--clr-theme-succ-element), var(--darken-mid));
			}
		}
	}

	.error {
		@apply bg-red-200/80 text-red-900;
		/* color: var(--clr-theme-scale-err-20);
		background: color-mix(in srgb, var(--clr-core-err-50), transparent 80%); */
		&:not(.not-button):hover {
			@apply bg-red-200/70;
			/* background: color-mix(in srgb, var(--clr-core-err-50), transparent 70%); */
		}
		&.tag-border {
			box-shadow: inset 0 0 0 1px var(--clr-theme-scale-err-60);
		}
		&.filled {
			color: var(--clr-theme-err-on-element);
			background: var(--clr-theme-err-element);
			&:not(.not-button):hover {
				background: color-mix(in srgb, var(--clr-theme-err-element), var(--darken-mid));
			}
		}
	}

	.warning {
		@apply bg-orange-200/80 text-orange-900;
		/* color: var(--clr-theme-scale-warn-20);
		background: color-mix(in srgb, var(--clr-core-warn-50), transparent 80%); */
		&:not(.not-button):hover {
			@apply bg-orange-200/70;
			/* background: color-mix(in srgb, var(--clr-core-warn-50), transparent 70%); */
		}
		&.tag-border {
			box-shadow: inset 0 0 0 1px var(--clr-theme-scale-warn-60);
		}
		&.filled {
			color: var(--clr-theme-warn-on-element);
			background: var(--clr-theme-warn-element);
			&:not(.not-button):hover {
				background: color-mix(in srgb, var(--clr-theme-warn-element), var(--darken-mid));
			}
		}
	}

	.purple {
		@apply bg-purple-200/80 text-purple-900;
		/* color: var(--clr-theme-scale-purple-20);
		background: color-mix(in srgb, var(--clr-core-purple-50), transparent 80%); */
		&:not(.not-button):hover {
			@apply bg-purple-200/70;
			/* background: color-mix(in srgb, var(--clr-core-purple-50), transparent 70%); */
		}
		&.tag-border {
			box-shadow: inset 0 0 0 1px var(--clr-theme-scale-purple-60);
		}
		&.filled {
			color: var(--clr-theme-purple-on-element);
			background: var(--clr-theme-purple-element);
			&:not(.not-button):hover {
				background: color-mix(in srgb, var(--clr-theme-purple-element), var(--darken-mid));
			}
		}
	}

	.pop {
		@apply bg-cyan-200/80 text-cyan-900;
		/* color: var(--clr-theme-scale-pop-20);
		background: color-mix(in srgb, var(--clr-core-pop-50), transparent 80%); */
		&:not(.not-button):hover {
			@apply bg-cyan-200/70;
			/* background: color-mix(in srgb, var(--clr-core-pop-50), transparent 70%); */
		}
		&.tag-border {
			box-shadow: inset 0 0 0 1px var(--clr-theme-scale-pop-60);
		}
		&.filled {
			color: var(--clr-theme-pop-on-element);
			background: var(--clr-theme-pop-element);
			&:not(.not-button):hover {
				background: color-mix(in srgb, var(--clr-theme-pop-element), var(--darken-mid));
			}
		}
	}

	/* modifiers */

	.not-button {
		user-select: none;
	}

	.disabled {
		@apply bg-muted/10 text-muted-foreground;
		/* background-color: color-mix(in srgb, var(--clr-theme-scale-ntrl-50) 10%, transparent); */
		/* color: var(--clr-core-ntrl-50); */
	}

	.iconLeft {
		flex-direction: row-reverse;
	}

	.shrinkable {
		overflow: hidden;

		& span {
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.wide {
		width: 100%;
		display: flex;
		justify-content: space-between;
	}

	.verticalOrientation {
		writing-mode: vertical-rl;
		height: max-content;
		@apply w-5 px-0.5 py-1;
		/* width: var(--size-control-s); */
		/* padding: var(--size-4) var(--size-2); */
		transform: rotate(180deg);
	}

	.verticalIcon {
		transform: rotate(90deg);
	}

	.verticalLabel {
		padding: var(--size-2) 0;
	}
</style>
