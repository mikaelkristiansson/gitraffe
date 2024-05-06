<script lang="ts">
	import AccountLink from '$lib/components/AccountLink.svelte';
	import * as Dialog from './ui/dialog';
	import RepositorySettings from './RepositorySettings.svelte';
	import type { Repository } from '$lib/models/repository';
	import { cn } from '$lib/utils';
	import { Button } from './ui/button';

	export let repository: Repository;
	export let isNavCollapsed: boolean;

	let dialogSettingsOpen = false;
</script>

<div
	class={cn(
		'flex justify-between border-t p-4',
		isNavCollapsed && 'flex-col items-start border-0 gap-1'
	)}
>
	<div class="flex gap-0.5">
		<Button
			variant="ghost"
			icon="settings"
			size={isNavCollapsed ? 'icon-lg' : 'icon'}
			on:click={() => (dialogSettingsOpen = true)}
		/>
	</div>
	<AccountLink {isNavCollapsed} />
</div>

<Dialog.Root bind:open={dialogSettingsOpen}>
	<Dialog.Content size="lg">
		<Dialog.Header>
			<Dialog.Title>Repository settings</Dialog.Title>
		</Dialog.Header>
		<RepositorySettings {repository} bind:dialogSettingsOpen />
	</Dialog.Content>
</Dialog.Root>
