<script lang="ts">
	import { unifiedMergeView } from '@codemirror/merge';
	import { basicSetup } from 'codemirror';
	import { EditorView, gutter, lineNumberMarkers, lineNumbers } from '@codemirror/view';
	import { EditorState, StateEffect, type Extension } from '@codemirror/state';
	import { onDestroy, onMount } from 'svelte';
	import { LanguageSupport, syntaxHighlighting } from '@codemirror/language';
	import { highlightStyle } from './CodeHighlighter';
	import type { IFileContents } from './helper';
	import type { ITextDiff } from '$lib/models/diff';

	export let diff: ITextDiff;
	export let lang: LanguageSupport | null | undefined = undefined;
	export let fileContents: IFileContents | null;

	let view: EditorView | null;
	let element: HTMLDivElement;

	function create_editor_state(value: string | null | undefined): EditorState {
		const unified = fileContents
			? unifiedMergeView({
					original: fileContents?.oldContents.join(''),
					mergeControls: false
				})
			: [];
		return EditorState.create({
			doc: value ?? undefined,
			extensions: [
				EditorView.editable.of(false),
				EditorState.readOnly.of(true),
				// lineNumbers(),
				EditorView.lineWrapping,
				syntaxHighlighting(highlightStyle),
				...(lang ? [lang] : [])
				// unified
			]
		});
	}

	function create_editor_view(): EditorView | null {
		if (!fileContents) {
			return null;
		}

		const editor = new EditorView({
			doc: diff.text,
			state: create_editor_state(diff.text),
			extensions: [basicSetup],
			parent: element
		});

		return editor;
	}

	onMount(() => {
		view = create_editor_view();
		// dispatch('ready', view);
	});
	onDestroy(() => view?.destroy());
</script>

<div class="codemirror-wrapper" bind:this={element} />
