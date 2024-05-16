<script lang="ts">
	import { unifiedMergeView } from '@codemirror/merge';
	import { basicSetup } from 'codemirror';
	import { EditorView, gutter, lineNumberMarkers, lineNumbers } from '@codemirror/view';
	import { EditorState, StateEffect, type Extension } from '@codemirror/state';
	import { onDestroy, onMount } from 'svelte';
	import { LanguageSupport, syntaxHighlighting } from '@codemirror/language';
	import { highlightStyle } from './CodeHighlighter';

	export let value: string;
	export let lang: LanguageSupport | null | undefined = undefined;

	let view: EditorView;
	let element: HTMLDivElement;

	function create_editor_state(value: string | null | undefined): EditorState {
		return EditorState.create({
			doc: value ?? undefined,
			extensions: [
				EditorView.editable.of(false),
				EditorState.readOnly.of(true),
				lineNumbers(),
				EditorView.lineWrapping,
				syntaxHighlighting(highlightStyle),
				...(lang ? [lang] : [])
			]
		});
	}

	function create_editor_view(): EditorView {
		const unified = unifiedMergeView({ original: value, mergeControls: false });
		const editor = new EditorView({
			doc: value,
			state: create_editor_state(value),
			extensions: [basicSetup, unified],
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
