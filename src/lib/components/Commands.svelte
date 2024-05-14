<script lang="ts">
	import Command from 'lucide-svelte/icons/command';

	import * as Alert from './ui/alert';
</script>

<Alert.Root>
	<Command class="h-4 w-4 stroke-gray-500" />
	<Alert.Title class="text-gray-500">Useful commands</Alert.Title>
	<Alert.Description>
		<ul class="text-gray-500">
			<li>
				<span class="text-gray-500 font-light text-sm"
					>Push latest changes to the remote branch:</span
				>
				<kbd
					class="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[10px] font-medium text-foreground opacity-100"
				>
					<span class="text-xs">⌘</span>
				</kbd>
				<kbd
					class="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[10px] font-medium text-foreground opacity-100"
				>
					<span class="text-xs">P</span>
				</kbd>
			</li>
			<li>
				<span class="text-gray-500 font-light text-sm">Create pull request:</span>
				<kbd
					class="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[10px] font-medium text-foreground opacity-100"
				>
					<span class="text-xs">⌘</span>
				</kbd>
				<kbd
					class="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[10px] font-medium text-foreground opacity-100"
				>
					<span class="text-xs">R</span>
				</kbd>
			</li>
			<li>
				<span class="text-gray-500 font-light text-sm">Switch between light and dark mode:</span>
				<kbd
					class="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[10px] font-medium text-foreground opacity-100"
				>
					<span class="text-xs">⌘</span>
				</kbd>
				<kbd
					class="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border px-1 font-mono text-[10px] font-medium text-foreground opacity-100"
				>
					<span class="text-xs">T</span>
				</kbd>
			</li>
		</ul>
	</Alert.Description>
</Alert.Root>
