<script lang="ts">
	import type iconsJson from '$lib/icons/icons.json';
	import { type Variant, badgeVariants, type Size } from './index';
	import { cn } from '$lib/utils';
	import Icon from '$lib/components/Icon.svelte';

	let className: string | undefined | null = undefined;
	export let href: string | undefined = undefined;
	export let variant: Variant = 'default';
	export let size: Size = 'default';
	export let icon: keyof typeof iconsJson | undefined = undefined;
	export let vertical = false;
	export { className as class };
</script>

<svelte:element
	this={href ? 'a' : 'span'}
	{href}
	class={cn(
		badgeVariants({ variant, size, className }),
		vertical && 'rotate-180 h-max w-2 px-2 py-2 [writing-mode:vertical-lr]'
	)}
	{...$$restProps}
>
	{#if icon}
		<Icon name={icon} class={cn(vertical && 'rotate-90')} />
	{/if}
	<slot />
</svelte:element>
