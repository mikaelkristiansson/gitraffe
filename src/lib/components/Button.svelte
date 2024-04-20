<script lang="ts" context="module">
	export type ButtonColor =
		| 'primary'
		| 'neutral'
		| 'error'
		| 'warn'
		| 'pop'
		| 'purple'
		| 'success'
		| 'ghost';
</script>

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { pxToRem } from '$lib/utils/pxToRem';
	import { tooltip } from '$lib/utils/tooltip';
	import { onMount } from 'svelte';
	import type iconsJson from '$lib/icons/icons.json';

	export let size: 'medium' | 'large' = 'medium';
	export let icon: keyof typeof iconsJson | undefined = undefined;
	export let iconAlign: 'left' | 'right' = 'right';
	export let color: ButtonColor = 'primary';
	export let kind: 'filled' | 'outlined' = 'filled';
	export let isDropdownChild = false;
	export let disabled = false;
	export let notClickable = false;
	export let id: string | undefined = undefined;
	export let loading = false;
	export let tabindex = 0;
	export let wide = false;
	export let grow = false;
	export let align: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline' | 'auto' = 'auto';
	export let help = '';
	export let width: number | undefined = undefined;

	export let element: HTMLAnchorElement | HTMLButtonElement | HTMLElement | null = null;

	const SLOTS = $$props.$$slots;

	onMount(() => {
		if (!element) return;
		element.ariaLabel = element.innerText?.trim();
	});
</script>

<button
	class="btn {$$props.class}"
	class:medium={size == 'medium'}
	class:large={size == 'large'}
	class:error-outline={color == 'error' && kind == 'outlined'}
	class:primary-outline={color == 'primary' && kind == 'outlined'}
	class:warn-outline={color == 'warn' && kind == 'outlined'}
	class:purple-outline={color == 'purple' && kind == 'outlined'}
	class:pop-outline={color == 'pop' && kind == 'outlined'}
	class:success-outline={color == 'success' && kind == 'outlined'}
	class:neutral-outline={color == 'neutral' && kind == 'outlined'}
	class:ghost-outline={color == 'ghost' && kind == 'outlined'}
	class:error-filled={color == 'error' && kind == 'filled'}
	class:primary-filled={color == 'primary' && kind == 'filled'}
	class:warn-filled={color == 'warn' && kind == 'filled'}
	class:purple-filled={color == 'purple' && kind == 'filled'}
	class:pop-filled={color == 'pop' && kind == 'filled'}
	class:success-filled={color == 'success' && kind == 'filled'}
	class:neutral-filled={color == 'neutral' && kind == 'filled'}
	class:ghost-filled={color == 'ghost' && kind == 'filled'}
	class:pointer-events-none={loading}
	class:icon-left={iconAlign == 'left'}
	class:wide
	class:grow
	class:not-clickable={notClickable}
	class:is-dropdown={isDropdownChild}
	style:align-self={align}
	style:width={width ? pxToRem(width) : undefined}
	use:tooltip={help}
	bind:this={element}
	disabled={disabled || loading}
	on:click
	on:mousedown
	{id}
	tabindex={notClickable ? -1 : tabindex}
>
	{#if SLOTS}
		<span class="label text-base-12 text-semibold">
			<slot />
		</span>
	{/if}
	{#if icon && !loading}
		<Icon name={icon} />
	{:else if loading}
		<Icon name="spinner" />
	{/if}
</button>

<style lang="postcss">
	.btn {
		z-index: 1;
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--size-4) var(--size-6);
		border-radius: var(--radius-m);
		flex-shrink: 0;
		gap: var(--size-2);
		height: var(--size-control-m);
		min-width: var(--size-control-m);
		background: transparent;
		transition: background-color var(--transition-fast);
		cursor: pointer;
		&:disabled {
			cursor: default;
			pointer-events: none;
			opacity: 0.6;
		}
		&.wide {
			display: flex;
			width: 100%;
		}
		&.grow {
			flex-grow: 1;
		}
		&.icon-left {
			flex-direction: row-reverse;
		}
		&.not-clickable {
			cursor: default;
			pointer-events: none;
		}
	}
	.label {
		display: inline-flex;
		padding: 0 var(--size-2);
		align-items: center;
	}

	.neutral-filled {
		color: var(--clr-theme-scale-ntrl-30);
		&:hover,
		&:focus {
			background: color-mix(in srgb, transparent, var(--darken-tint-light));
		}
	}
	.neutral-outline {
		color: var(--clr-theme-scale-ntrl-30);
		border: 1px solid var(--clr-theme-container-outline-light);
		&:hover,
		&:focus {
			background: color-mix(in srgb, transparent, var(--darken-tint-extralight));
			border: 1px solid
				color-mix(in srgb, var(--clr-theme-container-outline-light), var(--darken-tint-mid));
		}
	}

	.ghost-filled {
		color: var(--clr-theme-scale-ntrl-40);
		&:hover,
		&:focus {
			background: color-mix(in srgb, transparent, var(--darken-tint-light));
		}
	}
	.ghost-outline {
		color: var(--clr-theme-scale-ntrl-40);
		box-shadow: inset 0 0 0 1px var(--clr-theme-scale-ntrl-60);
		&:hover,
		&:focus {
			background: color-mix(in srgb, var(--clr-core-ntrl-50), transparent 90%);
		}
	}

	.primary-filled {
		background: var(--clr-theme-pop-element);
		color: var(--clr-theme-pop-on-element);
		&:hover,
		&:focus {
			background: color-mix(in srgb, var(--clr-theme-pop-element), var(--darken-mid));
		}
	}
	.primary-outline {
		color: var(--clr-theme-pop-outline);
		border: 1px solid var(--clr-theme-pop-outline);
		&:hover,
		&:focus {
			color: color-mix(in srgb, var(--clr-theme-pop-outline), var(--darken-mid));
			border: 1px solid color-mix(in srgb, var(--clr-theme-pop-outline), var(--darken-mid));
		}
	}

	.warn-filled {
		color: var(--clr-theme-warn-on-element);
		background: var(--clr-theme-warn-element);
		&:hover,
		&:focus {
			background: color-mix(in srgb, var(--clr-theme-warn-element), var(--darken-mid));
		}
	}
	.warn-outline {
		color: var(--clr-theme-warn-outline);
		border: 1px solid var(--clr-theme-warn-outline);
		&:hover,
		&:focus {
			color: color-mix(in srgb, var(--clr-theme-warn-outline), var(--darken-mid));
			border: 1px solid color-mix(in srgb, var(--clr-theme-warn-outline), var(--darken-mid));
		}
	}
	.error-filled {
		color: var(--clr-theme-err-on-element);
		background: var(--clr-theme-err-element);
		&:hover,
		&:focus {
			background: color-mix(in srgb, var(--clr-theme-err-element), var(--darken-mid));
		}
	}
	.error-outline {
		color: var(--clr-theme-err-outline);
		border: 1px solid var(--clr-theme-err-outline);
		&:hover,
		&:focus {
			color: color-mix(in srgb, var(--clr-theme-err-outline), var(--darken-mid));
			border: 1px solid color-mix(in srgb, var(--clr-theme-err-outline), var(--darken-mid));
		}
	}
	.purple-filled {
		color: var(--clr-theme-purple-on-element);
		background: var(--clr-theme-purple-element);
		&:hover,
		&:focus {
			background: color-mix(in srgb, var(--clr-theme-purple-element), var(--darken-mid));
		}
	}
	.purple-outline {
		color: var(--clr-theme-purple-outline);
		border: 1px solid var(--clr-theme-purple-outline);
		&:hover,
		&:focus {
			color: color-mix(in srgb, var(--clr-theme-purple-outline), var(--darken-mid));
			border: 1px solid color-mix(in srgb, var(--clr-theme-purple-outline), var(--darken-mid));
		}
	}
	.pop-filled {
		color: var(--clr-theme-pop-on-element);
		background: var(--clr-theme-pop-element);
		&:hover,
		&:focus {
			background: color-mix(in srgb, var(--clr-theme-pop-element), var(--darken-mid));
		}
	}
	.pop-outline {
		color: var(--clr-theme-pop-outline);
		border: 1px solid var(--clr-theme-pop-outline);
		&:hover,
		&:focus {
			color: color-mix(in srgb, var(--clr-theme-pop-outline), var(--darken-mid));
			border: 1px solid color-mix(in srgb, var(--clr-theme-pop-outline), var(--darken-mid));
		}
	}

	.success-filled {
		color: var(--clr-theme-succ-on-element);
		background: var(--clr-theme-succ-element);
		&:hover,
		&:focus {
			background: color-mix(in srgb, var(--clr-theme-succ-element), var(--darken-mid));
		}
	}
	.success-outline {
		color: var(--clr-theme-succ-outline);
		border: 1px solid var(--clr-theme-succ-outline);
		&:hover,
		&:focus {
			color: color-mix(in srgb, var(--clr-theme-succ-outline), var(--darken-mid));
			border: 1px solid color-mix(in srgb, var(--clr-theme-succ-outline), var(--darken-mid));
		}
	}

	/* SIZE MODIFIERS */

	.btn.medium {
		height: var(--size-control-m);
		padding: var(--size-4) var(--size-6);
	}

	.btn.large {
		height: var(--size-control-l);
		padding: var(--size-6) var(--size-8);
	}

	/* DROPDOWN */
	.is-dropdown {
		&:first-of-type {
			flex: 1;
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
			border-right: none;

			&.primary-filled {
				&:after {
					content: '';
					z-index: 2;
					position: absolute;
					top: 0;
					right: 0;
					width: 1px;
					height: 100%;
					background: var(--clr-theme-scale-ntrl-100);
					opacity: 0.4;
				}
			}
		}

		&:last-of-type {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
		}
	}
</style>
