<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import Check from 'lucide-svelte/icons/check';
	import Minus from 'lucide-svelte/icons/minus';
	import { cn } from '$lib/utils.js';

	type $$Props = CheckboxPrimitive.Props & { size?: 'sm' | 'default' | 'lg' };
	type $$Events = CheckboxPrimitive.Events;

	let className: $$Props['class'] = undefined;
	export let checked: $$Props['checked'] = false;
	export { className as class };
	export let size: $$Props['size'] = 'default';
</script>

<CheckboxPrimitive.Root
	class={cn(
		'peer box-content h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[disabled=true]:cursor-not-allowed data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[disabled=true]:opacity-50',
		size === 'sm' && 'h-3 w-3',
		size === 'lg' && 'h-5 w-5',
		className
	)}
	bind:checked
	{...$$restProps}
	on:click
>
	<CheckboxPrimitive.Indicator
		class={cn(
			'flex h-4 w-4 items-center justify-center text-current',
			size === 'sm' && 'h-3 w-3',
			size === 'lg' && 'h-5 w-5'
		)}
		let:isChecked
		let:isIndeterminate
	>
		{#if isChecked}
			<Check
				class={cn('h-3.5 w-3.5', size === 'sm' && 'h-2.5 w-2.5', size === 'lg' && 'h-4.5 w-4.5')}
			/>
		{:else if isIndeterminate}
			<Minus
				class={cn('h-3.5 w-3.5', size === 'sm' && 'h-2.5 w-2.5', size === 'lg' && 'h-4.5 w-4.5')}
			/>
		{/if}
	</CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
