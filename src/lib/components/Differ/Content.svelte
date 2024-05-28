<script lang="ts">
	import { cn } from '$lib/utils';
	import { Ban } from 'lucide-svelte';
	import { syntaxHighlightLine, type IDiffRowData } from './diff-helper';
	import { DiffRowPrefix } from './types';

	export let data: Pick<IDiffRowData, 'content' | 'noNewLineIndicator' | 'tokens'>;
	export let prefix: DiffRowPrefix = DiffRowPrefix.Nothing;
</script>

<!-- on:contextmenu={onContextMenuText} -->
<div class="content">
	<div class="prefix px-2">{prefix}</div>
	<div class="content-wrapper">
		<!-- {#if data.content.length === 0}
			<br />
		{/if} -->

		{#if data.content}
			{@const elements = syntaxHighlightLine(data.content, data.tokens)}
			{#each elements as element}
				{#if element.tokens.size === 0}
					<span>{element.content}</span>
				{:else}
					<span class={cn([...element.tokens.keys()].map((name) => `cm-${name}`))}
						>{element.content}</span
					>
				{/if}
			{/each}
		{/if}
		{#if data.noNewLineIndicator}
			<Ban class="h-2 w-2 inline-block stroke-red-500" />
		{/if}
	</div>
</div>
