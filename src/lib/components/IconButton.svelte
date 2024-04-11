<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { tooltip } from '$lib/utils/tooltip';
	import type iconsJson from '$lib/icons/icons.json';

	export let icon: keyof typeof iconsJson;
	export let size: 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl' = 'l';
	export let loading = false;
	export let help = '';
	export let width: string | undefined = undefined;

	let iconSize = 16;
	switch (size) {
		case 'xxs':
			iconSize = 12;
			break;
		case 'xs':
			iconSize = 14;
			break;
		case 's':
			iconSize = 16;
			break;
		case 'm':
			iconSize = 20;
			break;
		case 'l':
			iconSize = 24;
			break;
		case 'xl':
			iconSize = 32;
			break;
	}

	let className = '';
	let selected = false;
	export { className as class };
	export let title = '';
</script>

<button
	class="icon-btn {className}"
	class:selected
	class:xx-small={size == 'xxs'}
	class:x-small={size == 'xs'}
	class:small={size == 's'}
	class:medium={size == 'm'}
	class:large={size == 'l'}
	class:x-large={size == 'xl'}
	use:tooltip={help}
	{title}
	on:click
	on:mousedown
	style:width
>
	<Icon size={iconSize} name={loading ? 'spinner' : icon} />
</button>

<style lang="postcss">
	.icon-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-m);
		color: var(--clr-theme-scale-ntrl-50);
		cursor: pointer;
		transition:
			background-color var(--transition-fast),
			color var(--transition-fast);
		&:not(.selected):hover {
			background-color: color-mix(in srgb, transparent, var(--darken-tint-light));
			color: var(--clr-theme-scale-ntrl-40);
		}
	}
	.selected {
		background-color: color-mix(in srgb, transparent, var(--darken-tint-light));
		cursor: default;
	}
	.x-large {
		height: var(--size-control-xl);
		width: var(--size-control-xl);
		padding: var(--size-12);
	}
	.large {
		height: var(--size-control-l);
		width: var(--size-control-l);
		padding: var(--size-8);
	}
	.medium {
		height: var(--size-control-m);
		width: var(--size-control-m);
		padding: var(--size-4);
	}
	.small {
		height: var(--size-control-s);
		width: var(--size-control-s);
		padding: var(--size-2);
	}
	.x-small {
		height: var(--size-control-xs);
		width: var(--size-control-xs);
		padding: var(--size-2);
	}
	.xx-small {
		height: var(--size-control-xss);
		width: var(--size-control-xss);
		padding: var(--size-4);
	}
</style>
