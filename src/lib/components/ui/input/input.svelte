<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import type { InputEvents } from './index';
	import { cn } from '$lib/utils';
	import type iconsJson from '$lib/icons/icons.json';
	import Icon from '$lib/components/Icon.svelte';

	type $$Props = HTMLInputAttributes & {
		initialFocus?: boolean;
		icon?: keyof typeof iconsJson;
	};
	type $$Events = InputEvents;

	let className: $$Props['class'] = undefined;
	export let value: $$Props['value'] = undefined;
	export let initialFocus = false;
	export let icon: $$Props['icon'] = undefined;
	export { className as class };

	const init = (el: HTMLInputElement) => {
		// we have to wait for modal animation to finish before focusing
		requestAnimationFrame(() => {
			if (initialFocus) {
				el.focus();
			}
		});
	};

	// Workaround for https://github.com/sveltejs/svelte/issues/9305
	// Fixed in Svelte 5, but not backported to 4.x.
	export let readonly: $$Props['readonly'] = undefined;
</script>

<div class="relative h-8 w-full">
	{#if icon}
		<div
			class="absolute left-3 top-1/2 mt-[-2px] transform -translate-y-1/2 text-gray-500 z-10 pointer-events-none"
		>
			<Icon name={icon} />
		</div>
	{/if}
	<input
		class={cn(
			'flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
			icon && 'pl-8 pr-3',
			className
		)}
		bind:value
		use:init
		{readonly}
		on:blur
		on:change
		on:click
		on:focus
		on:focusin
		on:focusout
		on:keydown
		on:keypress
		on:keyup
		on:mouseover
		on:mouseenter
		on:mouseleave
		on:paste
		on:input
		on:wheel
		{...$$restProps}
	/>
</div>
