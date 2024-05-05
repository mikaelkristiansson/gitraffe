<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';

	export let ahead: number | undefined;
	export let behind: number | undefined;

	$: behindMessage = `${behind} commit${behind != 1 ? 's' : ''} behind`;
	$: aheadMessage = `${ahead} commit${ahead != 1 ? 's' : ''} ahead`;
</script>

{#if ahead !== undefined && behind !== undefined}
	<div class="flex items-center">
		<div
			class="flex overflow-hidden flex-shrink-0 rounded-sm bg-muted font-semibold text-muted-foreground dark:text-primary text-[0.6rem] leading-tight"
		>
			<Tooltip.Root>
				<Tooltip.Trigger class="cursor-auto">
					<div class={cn('p-1 min-w-3 border-r', behind === 0 && 'text-muted-foreground/60')}>
						{behind}
					</div>
				</Tooltip.Trigger>
				<Tooltip.Content>
					{behindMessage}
				</Tooltip.Content>
			</Tooltip.Root>
			<Tooltip.Root>
				<Tooltip.Trigger class="cursor-auto">
					<div class={cn('p-1 min-w-3', ahead === 0 && 'text-muted-foreground/60')}>
						{ahead}
					</div>
				</Tooltip.Trigger>
				<Tooltip.Content>
					{aheadMessage}
				</Tooltip.Content>
			</Tooltip.Root>
		</div>
	</div>
{/if}
