<svelte:options runes={true} />

<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { type Props, buttonVariants } from './index';
	import { cn } from '$lib/utils';
	import Icon from '$lib/components/Icon.svelte';

	let {
		variant = 'default',
		size = 'default',
		builders = [],
		icon,
		iconPosition,
		loading,
		vertical,
		class: className = undefined,
		children,
		type = 'button',
		...rest
	}: Props = $props();
</script>

<ButtonPrimitive.Root
	{builders}
	class={cn(
		buttonVariants({ variant, size, className }),
		iconPosition === 'left' && 'flex-row-reverse gap-1',
		icon && !!children && 'gap-1',
		'overflow-hidden'
	)}
	{...rest}
>
	{#if !!children}
		<span class={cn('overflow-hidden text-ellipsis', vertical && '[writing-mode:vertical-lr]')}>
			{@render children()}
		</span>
	{/if}
	{#if icon && !loading}
		<Icon name={icon} class={cn(vertical && 'rotate-90')} />
	{:else if loading}
		<Icon name="spinner" class={cn(vertical && 'rotate-90')} />
	{/if}
</ButtonPrimitive.Root>
