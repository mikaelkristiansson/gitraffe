<script lang="ts">
	// import { unifiedMergeView } from '@codemirror/merge';
	import CodeMirror, { Doc, type Editor, type EditorConfiguration } from 'codemirror';
	// import { EditorView, gutter, lineNumberMarkers, lineNumbers } from '@codemirror/view';
	// import { EditorState, StateEffect, type Extension } from '@codemirror/state';
	import { onDestroy, onMount } from 'svelte';
	// import { LanguageSupport, syntaxHighlighting } from '@codemirror/language';
	import { highlightStyle } from './CodeHighlighter';
	// Required for us to be able to customize the foreground color of selected text
	import 'codemirror/addon/selection/mark-selection';
	import 'codemirror/mode/javascript/javascript';
	import 'codemirror/mode/diff/diff';
	import {
		createNoNewlineIndicatorWidget,
		getLineFilters,
		getLineWidthFromDigitCount,
		getNumberOfDigits,
		highlightContents,
		type IFileContents
	} from './helper';
	import {
		DiffHunkExpansionType,
		DiffLine,
		DiffLineType,
		type DiffHunk,
		type ITextDiff
	} from '$lib/models/diff';
	import { DiffSyntaxMode, type IDiffSyntaxModeSpec } from './diff-syntax-mode';
	import { diffLineInfoForIndex, lineNumberForDiffLine } from './diff-explorer';

	type SelectionKind = 'hunk' | 'range';

	interface ISelection {
		readonly from: number;
		readonly to: number;
		readonly kind: SelectionKind;
		readonly isSelected: boolean;
	}

	export let diff: ITextDiff;
	export let fileContents: IFileContents | null;
	export let readOnly: boolean = true;

	let view: Editor;
	let element: HTMLDivElement;

	const diffGutterName = 'diff-gutter';

	const defaultEditorOptions: EditorConfiguration = {
		lineNumbers: false,
		readOnly: true,
		showCursorWhenSelecting: false,
		cursorBlinkRate: -1,
		lineWrapping: true,
		mode: { name: DiffSyntaxMode.ModeName },
		// Make sure CodeMirror doesn't capture Tab (and Shift-Tab) and thus destroy tab navigation
		// extraKeys: {
		// 	Tab: false,
		// 	Home: 'goDocStart',
		// 	End: 'goDocEnd',
		// 	'Shift-Tab': false
		// 	// Steal the default key binding so that we can launch our
		// 	// custom search UI.
		// 	// [__DARWIN__ ? 'Cmd-F' : 'Ctrl-F']: showSearch,
		// 	// // Disable all other search-related shortcuts so that they
		// 	// // don't interfere with global app shortcuts.
		// 	// [__DARWIN__ ? 'Cmd-G' : 'Ctrl-G']: false, // findNext
		// 	// [__DARWIN__ ? 'Shift-Cmd-G' : 'Shift-Ctrl-G']: false, // findPrev
		// 	// [__DARWIN__ ? 'Cmd-Alt-F' : 'Shift-Ctrl-F']: false, // replace
		// 	// [__DARWIN__ ? 'Shift-Cmd-Alt-F' : 'Shift-Ctrl-R']: false, // replaceAll
		// 	// Down: scrollEditorVertically(1, 'line'),
		// 	// Up: scrollEditorVertically(-1, 'line'),
		// 	// PageDown: scrollEditorVertically(1, 'page'),
		// 	// PageUp: scrollEditorVertically(-1, 'page'),
		// },
		scrollbarStyle: 'null',
		lineSeparator: '\n',
		specialChars: /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff]/,
		gutters: [diffGutterName]
	};

	const initDiffSyntaxMode = async (editor: Editor) => {
		if (!editor) {
			return;
		}

		const contents = fileContents;

		if (contents === null) {
			return;
		}

		// Store the current props and state to that we can see if anything
		// changes from underneath us as we're making asynchronous
		// operations that makes our data stale or useless.
		// const propsSnapshot = this.props
		// const stateSnapshot = this.state

		const lineFilters = getLineFilters(diff.hunks);
		const tsOpt = view.getOption('tabSize');
		const tabSize = typeof tsOpt === 'number' ? tsOpt : 4;

		const tokens = await highlightContents(contents, tabSize, lineFilters);

		// if (
		//   !highlightParametersEqual(
		//     this.props,
		//     propsSnapshot,
		//     this.state,
		//     stateSnapshot
		//   )
		// ) {
		//   return
		// }

		const spec: IDiffSyntaxModeSpec = {
			name: DiffSyntaxMode.ModeName,
			hunks: diff.hunks,
			oldTokens: tokens.oldTokens,
			newTokens: tokens.newTokens
		};

		if (editor) {
			editor.setOption('mode', spec);
		}
	};

	/**
	 * Returns an array of line numbers that should be marked as lacking a
	 * new line. Memoized such that even if `hunks` changes we don't have
	 * to re-run getCodeMirrorDocument needlessly.
	 */
	const getNoNewlineIndicatorLines = (hunks: ReadonlyArray<DiffHunk>) => {
		const lines = new Array<number>();
		for (const hunk of hunks) {
			for (const line of hunk.lines) {
				if (line.noTrailingNewLine) {
					lines.push(lineNumberForDiffLine(line, hunks));
				}
			}
		}
		return lines;
	};

	const getCodeMirrorDocument = (text: string, noNewlineIndicatorLines: ReadonlyArray<number>) => {
		const { mode, firstLineNumber, lineSeparator } = defaultEditorOptions;
		// If the text looks like it could have been formatted using Windows
		// line endings (\r\n) we need to massage it a bit before we hand it
		// off to CodeMirror. That's because CodeMirror has two ways of splitting
		// lines, one is the built in which splits on \n, \r\n and \r. The last
		// one is important because that will match carriage return characters
		// inside a diff line. The other way is when consumers supply the
		// lineSeparator option. That option only takes a string meaning we can
		// either make it split on '\r\n', '\n' or '\r' but not what we would like
		// to do, namely '\r?\n'. We want to keep CR characters inside of a diff
		// line so that we can mark them using the specialChars attribute so
		// we convert all \r\n to \n and remove any trailing \r character.
		if (text.indexOf('\r') !== -1) {
			// Capture the \r if followed by (positive lookahead) a \n or
			// the end of the string. Note that this does not capture the \n.
			text = text.replace(/\r(?=\n|$)/g, '');
		}

		const doc = new Doc(text, mode, firstLineNumber, lineSeparator ?? undefined);

		for (const noNewlineLine of noNewlineIndicatorLines) {
			doc.setBookmark(
				{ line: noNewlineLine, ch: Infinity },
				{ widget: createNoNewlineIndicatorWidget() }
			);
		}

		return doc;
	};

	const canExpandDiff = () => {
		return (
			fileContents !== null && fileContents.canBeExpanded && fileContents.newContents.length > 0
		);
	};

	const getGutterLineClassNameInfo = (
		hunk: DiffHunk,
		diffLine: DiffLine
	): { [className: string]: boolean } => {
		const isIncludeable = diffLine.isIncludeableLine();
		const isIncluded = isIncludeable && diffLine.originalLineNumber !== null;
		const hover = isIncludeable && diffLine.originalLineNumber !== null;

		const shouldEnableDiffExpansion = canExpandDiff();

		return {
			'diff-line-gutter': true,
			'diff-add': diffLine.type === DiffLineType.Add,
			'diff-delete': diffLine.type === DiffLineType.Delete,
			'diff-context': diffLine.type === DiffLineType.Context,
			'diff-hunk': diffLine.type === DiffLineType.Hunk,
			'read-only': readOnly,
			'diff-line-selected': isIncluded,
			'diff-line-hover': hover,
			'expandable-down':
				shouldEnableDiffExpansion && hunk.expansionType === DiffHunkExpansionType.Down,
			'expandable-up': shouldEnableDiffExpansion && hunk.expansionType === DiffHunkExpansionType.Up,
			'expandable-both':
				shouldEnableDiffExpansion && hunk.expansionType === DiffHunkExpansionType.Both,
			'expandable-short':
				shouldEnableDiffExpansion && hunk.expansionType === DiffHunkExpansionType.Short,
			includeable: isIncludeable && !readOnly
		};
	};

	const getGutterLineID = (index: number) => {
		return `diff-line-gutter-${index}`;
	};

	const updateGutterMarker = (
		index: number,
		marker: HTMLElement,
		hunk: DiffHunk,
		diffLine: DiffLine
	) => {
		const classNameInfo = getGutterLineClassNameInfo(hunk, diffLine);
		for (const [className, include] of Object.entries(classNameInfo)) {
			if (include) {
				marker.classList.add(className);
			} else {
				marker.classList.remove(className);
			}
		}

		marker.id = getGutterLineID(index);

		const hunkExpandWholeHandle = marker.getElementsByClassName('hunk-expand-whole-handle')[0];
		if (hunkExpandWholeHandle !== undefined) {
			if (classNameInfo['expandable-short'] === true) {
				hunkExpandWholeHandle.setAttribute('title', 'Expand All');
			} else if (classNameInfo['expandable-both'] !== true) {
				if (classNameInfo['expandable-down']) {
					hunkExpandWholeHandle.setAttribute('title', 'Expand Down');
				} else {
					hunkExpandWholeHandle.setAttribute('title', 'Expand Up');
				}
			}
		}

		const isIncludeableLine = !readOnly && diffLine.isIncludeableLine();

		if (diffLine.type === DiffLineType.Hunk || isIncludeableLine) {
			marker.setAttribute('role', 'button');
		} else {
			marker.removeAttribute('role');
		}

		const [oldLineNumber, newLineNumber] = marker.childNodes;
		oldLineNumber.textContent = `${diffLine.oldLineNumber ?? ''}`;
		newLineNumber.textContent = `${diffLine.newLineNumber ?? ''}`;
	};

	const createGutterMarker = (
		index: number,
		hunks: ReadonlyArray<DiffHunk>,
		hunk: DiffHunk,
		diffLine: DiffLine,
		digitCount: number
	) => {
		const diffSize = getLineWidthFromDigitCount(digitCount);

		const marker = document.createElement('div');
		marker.style.width = `${diffSize * 2}px`;
		marker.style.margin = '0px';
		marker.className = 'diff-line-gutter';

		// marker.addEventListener(
		//   'mousedown',
		//   this.onDiffLineGutterMouseDown.bind(this, index)
		// )

		const oldLineNumber = document.createElement('div');
		oldLineNumber.classList.add('diff-line-number', 'before');
		oldLineNumber.style.width = `${diffSize}px`;
		marker.appendChild(oldLineNumber);

		const newLineNumber = document.createElement('div');
		newLineNumber.classList.add('diff-line-number', 'after');
		newLineNumber.style.width = `${diffSize}px`;
		marker.appendChild(newLineNumber);

		const hunkHandle = document.createElement('div');
		// hunkHandle.addEventListener('mouseenter', this.onHunkHandleMouseEnter)
		// hunkHandle.addEventListener('mouseleave', this.onHunkHandleMouseLeave)
		// hunkHandle.addEventListener('mousedown', this.onHunkHandleMouseDown)
		hunkHandle.classList.add('hunk-handle');
		marker.appendChild(hunkHandle);

		if (canExpandDiff()) {
			const hunkExpandUpHandle = document.createElement('button');
			hunkExpandUpHandle.classList.add('hunk-expander', 'hunk-expand-up-handle');
			hunkExpandUpHandle.title = 'Expand Up';
			// hunkExpandUpHandle.addEventListener(
			//   'click',
			//   this.onHunkExpandHalfHandleMouseDown.bind(this, hunks, hunk, 'up')
			// )
			marker.appendChild(hunkExpandUpHandle);

			// hunkExpandUpHandle.appendChild(
			//   createOcticonElement(octicons.foldUp, 'hunk-expand-icon')
			// )

			const hunkExpandDownHandle = document.createElement('button');
			hunkExpandDownHandle.classList.add('hunk-expander', 'hunk-expand-down-handle');
			hunkExpandDownHandle.title = 'Expand Down';
			// hunkExpandDownHandle.addEventListener(
			//   'click',
			//   this.onHunkExpandHalfHandleMouseDown.bind(this, hunks, hunk, 'down')
			// )
			marker.appendChild(hunkExpandDownHandle);

			// hunkExpandDownHandle.appendChild(
			//   createOcticonElement(octicons.foldDown, 'hunk-expand-icon')
			// )

			const hunkExpandWholeHandle = document.createElement('button');
			hunkExpandWholeHandle.classList.add('hunk-expander', 'hunk-expand-whole-handle');
			hunkExpandWholeHandle.title = 'Expand whole';
			// hunkExpandWholeHandle.addEventListener(
			//   'click',
			//   this.onHunkExpandWholeHandleMouseDown.bind(this, hunks, hunk)
			// )
			marker.appendChild(hunkExpandWholeHandle);

			// hunkExpandWholeHandle.appendChild(
			//   createOcticonElement(
			//     octicons.foldDown,
			//     'hunk-expand-icon',
			//     'hunk-expand-down-icon'
			//   )
			// )

			// hunkExpandWholeHandle.appendChild(
			//   createOcticonElement(
			//     octicons.foldUp,
			//     'hunk-expand-icon',
			//     'hunk-expand-up-icon'
			//   )
			// )

			// hunkExpandWholeHandle.appendChild(
			//   createOcticonElement(
			//     octicons.unfold,
			//     'hunk-expand-icon',
			//     'hunk-expand-short-icon'
			//   )
			// )
		}

		updateGutterMarker(index, marker, hunk, diffLine);

		return marker;
	};

	// function create_editor_state(value: string | null | undefined): EditorState {
	// 	const unified = fileContents
	// 		? unifiedMergeView({
	// 				original: fileContents?.oldContents.join(''),
	// 				mergeControls: false
	// 			})
	// 		: [];
	// 	return EditorState.create({
	// 		doc: value ?? undefined,
	// 		extensions: [
	// 			EditorView.editable.of(false),
	// 			EditorState.readOnly.of(true),
	// 			// lineNumbers(),
	// 			EditorView.lineWrapping,
	// 			syntaxHighlighting(highlightStyle),
	// 			...(lang ? [lang] : [])
	// 			// unified
	// 		]
	// 	});
	// }

	const onUpdate = (editor: Editor) => {
		const { from, to } = editor.getViewport();
		const doc = editor.getDoc();
		const batchedOps = new Array<Function>();
		doc.eachLine(from, to, (line) => {
			const lineNumber = doc.getLineNumber(line);

			if (lineNumber !== null) {
				const diffLineInfo = diffLineInfoForIndex(diff.hunks, lineNumber);

				if (diffLineInfo !== null) {
					const { hunk, line: diffLine } = diffLineInfo;
					const lineInfo = editor.lineInfo(line);

					if (lineInfo.gutterMarkers && diffGutterName in lineInfo.gutterMarkers) {
						const marker = lineInfo.gutterMarkers[diffGutterName];
						if (marker instanceof HTMLElement) {
							updateGutterMarker(lineInfo.line, marker, hunk, diffLine);
						}
					} else {
						batchedOps.push(() => {
							const marker = createGutterMarker(
								lineNumber,
								diff.hunks,
								hunk,
								diffLine,
								getNumberOfDigits(diff.maxLineNumber)
							);
							editor.setGutterMarker(line, diffGutterName, marker);
						});
					}
				}
			}
		});

		// Updating a gutter marker doesn't affect layout or rendering
		// as far as CodeMirror is concerned so we only run an operation
		// (which will trigger a CodeMirror refresh) when we have gutter
		// markers to create.
		if (batchedOps.length > 0) {
			editor.operation(() => batchedOps.forEach((x) => x()));
		}

		const diffSize = getLineWidthFromDigitCount(getNumberOfDigits(diff.maxLineNumber));

		const gutterParentElement = editor.getGutterElement();
		const gutterElement = gutterParentElement.getElementsByClassName(diffGutterName)[0];

		const newStyle = `width: ${diffSize * 2}px;`;
		const currentStyle = gutterElement?.getAttribute('style');
		if (newStyle !== currentStyle) {
			gutterElement?.setAttribute('style', newStyle);
			editor.refresh();
		}
	};

	function create_editor_view(): { editor: Editor; doc: Doc } {
		const doc = getCodeMirrorDocument(diff.text, getNoNewlineIndicatorLines(diff.hunks));

		const editor = CodeMirror(element, defaultEditorOptions);

		return { editor, doc };

		// const editor = new EditorView({
		// 	doc: diff.text,
		// 	state: create_editor_state(diff.text),
		// 	extensions: [basicSetup],
		// 	parent: element
		// });

		// return editor;
	}

	onMount(() => {
		let { editor, doc } = create_editor_view();
		view = editor;
		if (typeof doc === 'string') {
			view.setValue(doc);
		} else {
			view.swapDoc(doc);
		}
		initDiffSyntaxMode(view);
		onUpdate(view);
		view.on('viewportChange', onUpdate);
		view.on('swapDoc', () => console.log('swapped doc'));
		// dispatch('ready', view);
	});
	// onDestroy(() => view?.destroy());
</script>

<div class="diff-code-mirror" bind:this={element} />
