<script lang="ts">
	import Content from './Content.svelte';
	import type { ILineTokens } from './types';

	export let content: string;
	export let tokens: ReadonlyArray<ILineTokens> = [];
	//   prefix: DiffRowPrefix = DiffRowPrefix.Nothing
	const noNewLineIndicator = false;
</script>

<Content data={{ content, tokens, noNewLineIndicator }} />
