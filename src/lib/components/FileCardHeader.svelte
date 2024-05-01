<script lang="ts">
	import FileStatusTag from './FileStatusTag.svelte';
	import Tag from './Tag.svelte';
	import X from 'lucide-svelte/icons/x';
	import { getVSIFileIcon } from '$lib/ext-icons';
	import { createEventDispatcher } from 'svelte';
	import type { ChangedFile } from '$lib/models/status';
	import { Button } from './ui/button';
	import Separator from './ui/separator/separator.svelte';

	export let file: ChangedFile;
	export let fileStats: { added: number; removed: number };

	const dispatch = createEventDispatcher<{ close: void }>();

	function boldenFilename(filepath: string): { filename: string; path: string } {
		const parts = filepath.split('/');
		if (parts.length === 0) return { filename: '', path: '' };

		const filename = parts[parts.length - 1];
		const path = parts.slice(0, -1).join('/');

		return { filename, path };
	}

	$: fileTitle = boldenFilename(file.path);
</script>

<div class="flex gap-3 px-4 py-3">
	<div class="header__inner">
		<img src={getVSIFileIcon(file.path)} alt="js" width="13" height="13" class="icon" />
		<div class="header__info truncate">
			<div class="header__filetitle text-base-13 truncate">
				<span class="header__filename">{fileTitle.filename}</span>
				<span class="header__filepath">{fileTitle.path}</span>
			</div>
			<div class="header__tags">
				{#if file.status.kind === 'Conflicted'}
					<div class="header__tag-group">
						{#if file.status.kind === 'Conflicted'}
							<Tag icon="warning-small" color="error">Has conflicts</Tag>
						{/if}
					</div>
				{/if}
				<div class="header__tag-group">
					{#if fileStats.added}
						<Tag color="success">+{fileStats.added}</Tag>
					{/if}
					{#if fileStats.removed}
						<Tag color="error">-{fileStats.removed}</Tag>
					{/if}
					{#if file.status.kind}
						<FileStatusTag status={file.status.kind} />
					{/if}
				</div>
			</div>
		</div>
	</div>
	<Button
		size="icon"
		variant="ghost"
		class="opacity-70 hover:opacity-100"
		on:click={() => dispatch('close')}
	>
		<X class="h-4 w-4" />
		<span class="sr-only">Close</span>
	</Button>
</div>
<Separator />

<style lang="postcss">
	.header__inner {
		display: flex;
		flex-grow: 1;
		gap: var(--size-6);
		overflow: hidden;
	}
	.header__info {
		display: flex;
		flex-direction: column;
		gap: var(--size-8);
		width: 100%;
	}
	.header__tags {
		display: flex;
		gap: var(--size-6);
	}
	.header__tag-group {
		display: flex;
		gap: var(--size-2);
	}
	.header__filetitle {
		width: 100%;
		user-select: text;
	}
	.header__filename {
		/* color: var(--clr-theme-scale-ntrl-0); */
		line-height: 120%;
	}
	.header__filepath {
		/* color: var(--clr-theme-scale-ntrl-50); */
	}
	.icon {
		flex-shrink: 0;
		width: var(--size-14);
		height: var(--size-14);
		margin-top: calc(var(--size-2) / 2);
	}
</style>
