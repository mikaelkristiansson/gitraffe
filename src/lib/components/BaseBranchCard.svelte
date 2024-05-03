<script lang="ts">
	import SyncButton from './SyncButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import Icon from '$lib/components/Icon.svelte';
	import { defaultBranch } from '$lib/stores/branch';
	import type { Repository } from '$lib/models/repository';
	import type { Branch } from '$lib/models/branch';
	import { onDestroy } from 'svelte';

	export let repository: Repository;
	export let isNavCollapsed: boolean;

	let base: Branch | undefined = $defaultBranch;

	const unsubscribeDefaultBranch = defaultBranch.subscribe((branch) => {
		base = branch;
	});

	onDestroy(() => {
		unsubscribeDefaultBranch();
	});
</script>

<Tooltip.Root>
	<Tooltip.Trigger class="cursor-default">
		<div class="relative flex rounded-md gap-2 p-2 pr-0">
			{#if isNavCollapsed}
				{#if (base?.aheadBehind.behind || 0) > 0}
					<Badge size="sm" variant="secondary"
						><span class="font-bold">{base?.aheadBehind.behind || 0}</span></Badge
					>
				{/if}
			{/if}
			<img class="h-5 w-5 flex-shrink-0 rounded-sm" src="/images/domain-icons/trunk.svg" alt="" />

			{#if !isNavCollapsed}
				<div class="flex flex-col flex-grow gap-2">
					<div class="flex items-center justify-between gap-1">
						<div class="flex gap-1 items-center">
							<span class="text-base font-semibold">Base</span>
							{#if (base?.aheadBehind.behind || 0) > 0}
								<Badge size="sm" variant="secondary"
									><span class="font-bold">{base?.aheadBehind.behind || 0}</span></Badge
								>
							{/if}
						</div>
						<SyncButton {repository} />
					</div>
					<div class="flex items-center gap-1 text-xs font-light text-muted-foreground">
						<Icon name="branch" />
						{base?.upstream || base?.name}
					</div>
				</div>
			{/if}
		</div>
	</Tooltip.Trigger>
	<Tooltip.Content>
		Base branch <span class="font-semibold">{base?.upstream || base?.name}</span>
	</Tooltip.Content>
</Tooltip.Root>
