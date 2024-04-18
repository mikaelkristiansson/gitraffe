<script lang="ts">
	import { type DiffLine, DiffLineType } from '$lib/models/diff';
	import { create } from '$lib/components/Differ/CodeHighlighter';
	// import { createEventDispatcher } from 'svelte';

	export let line: DiffLine;
	export let sectionType: DiffLineType;
	export let filePath: string;
	export let minWidth = 1.75;
	export let selectable: boolean = false;
	// export let selected: boolean = true;
	export let readonly: boolean = false;

	// const dispatch = createEventDispatcher<{ selected: boolean }>();

	function toTokens(codeString: string): string[] {
		function sanitize(text: string) {
			var element = document.createElement('div');
			element.innerText = text;
			return element.innerHTML;
		}

		let highlighter = create(codeString, filePath);
		let tokens: string[] = [];
		highlighter.highlight((text, classNames) => {
			const token = classNames
				? `<span class=${classNames}>${sanitize(text)}</span>`
				: sanitize(text);

			tokens.push(token);
		});
		return tokens;
	}

	$: bgColor = selectable
		? 'bg-blue-400 border-blue-500 text-white dark:border-blue-700 dark:bg-blue-800'
		: 'bg-light-50 border-light-300 dark:bg-dark-700 dark:border-dark-400';
</script>

<div class="code-line text-sm" role="group" on:contextmenu|preventDefault>
	<div class="code-line__numbers-line">
		<!-- on:click={() => selectable && dispatch('selected', !selected)} -->
		<button
			class="text-color-4 border-color-4 shrink-0 select-none border-r px-0.5 text-right text-xs {bgColor}"
			style:min-width={minWidth + 'rem'}
		>
			{line.oldLineNumber || ''}
		</button>
		<!-- on:click={() => selectable && dispatch('selected', !selected)} -->
		<button
			class="text-color-4 border-color-4 shrink-0 select-none border-r px-0.5 text-right text-xs {bgColor}"
			style:min-width={minWidth + 'rem'}
		>
			{line.newLineNumber || ''}
		</button>
	</div>
	<div
		class="line"
		class:readonly
		class:diff-line-deletion={sectionType === DiffLineType.Delete}
		class:diff-line-addition={sectionType === DiffLineType.Add}
	>
		<span class="selectable-wrapper" data-no-drag>
			{@html toTokens(line.content).join('')}
		</span>
	</div>
</div>

<style lang="postcss">
	.code-line {
		display: flex;
		width: 100%;
		min-width: max-content;
		font-family: monospace;
		background-color: var(----clr-theme-container-light);
		white-space: pre;
	}

	.line {
		flex-grow: 1;
	}

	.code-line__numbers-line {
		position: sticky;
		left: 0;
		display: flex;
	}

	.selectable-wrapper {
		cursor: text;
		display: inline-block;
		text-indent: var(--size-4);
		margin-right: var(--size-4);
	}
</style>
