<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { type Events, type Props, buttonVariants } from './index';
	import { cn } from '$lib/utils';
	import Icon from '$lib/components/Icon.svelte';

	type $$Props = Props;
	type $$Events = Events;

	let className: $$Props['class'] = undefined;
	export let variant: $$Props['variant'] = 'default';
	export let size: $$Props['size'] = 'default';
	export let builders: $$Props['builders'] = [];
	export let icon: $$Props['icon'] = undefined;
	export let iconPosition: $$Props['iconPosition'] = 'right';
	export let loading = false;
	export let vertical = false;
	export { className as class };
</script>

<ButtonPrimitive.Root
	{builders}
	class={cn(
		buttonVariants({ variant, size, className }),
		vertical && 'flex flex-col gap-1 rotate-180 h-max w-2 px-3 py-2',
		iconPosition === 'left' && 'flex-row-reverse gap-1'
	)}
	type="button"
	{...$$restProps}
	on:click
	on:keydown
>
	<span class={cn(vertical && '[writing-mode:vertical-lr]')}>
		<slot />
	</span>
	{#if icon && !loading}
		<Icon name={icon} class={cn(vertical && 'rotate-90')} />
	{:else if loading}
		<Icon name="spinner" class={cn(vertical && 'rotate-90')} />
	{/if}
</ButtonPrimitive.Root>
