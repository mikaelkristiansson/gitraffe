import { cpp } from '@codemirror/lang-cpp';
import { css } from '@codemirror/lang-css';
import { sass } from '@codemirror/lang-sass';
import { html } from '@codemirror/lang-html';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';
import { python } from '@codemirror/lang-python';
// import { svelte } from '@replit/codemirror-lang-svelte';
import { csharp } from '@replit/codemirror-lang-csharp';
import { rust } from '@codemirror/lang-rust';
import { vue } from '@codemirror/lang-vue';
import { wast } from '@codemirror/lang-wast';
import { xml } from '@codemirror/lang-xml';
import { HighlightStyle, LanguageSupport, StreamLanguage } from '@codemirror/language';

export function languageFromFilename(filename: string): LanguageSupport | null {
	const ext = filename.split('.').pop();
	switch (ext) {
		case 'jsx':
		case 'js':
			// We intentionally allow JSX in normal .js as well as .jsx files,
			// because there are simply too many existing applications and
			// examples out there that use JSX within .js files, and we don't
			// want to break them.
			return javascript({ jsx: true });
		case 'ts':
			return javascript({ typescript: true });
		case 'tsx':
			return javascript({ typescript: true, jsx: true });

		case 'css':
			return css();

		case 'scss':
			return sass();

		case 'html':
			return html({ selfClosingTags: true });

		case 'xml':
			return xml();

		case 'wasm':
			return wast();

		case 'cpp':
		case 'c++':
		case 'hpp':
		case 'h++':
			return cpp();

		case 'cs':
			return csharp();

		// case 'text/x-go':
		//     return new LanguageSupport(await CodeMirror.go());

		case 'java':
			return java();

		// case 'text/x-kotlin':
		//     return new LanguageSupport(await CodeMirror.kotlin());

		case 'json':
			return json();

		case 'php':
			return php();

		case 'py':
		case 'python':
			return python();

		case 'md':
			return markdown();

		// case 'text/x-sh':
		//     return new LanguageSupport(await CodeMirror.shell());

		// case 'text/x-coffeescript':
		//     return new LanguageSupport(await CodeMirror.coffeescript());

		// case 'text/x-clojure':
		//     return new LanguageSupport(await CodeMirror.clojure());

		// case 'application/vnd.dart':
		//     return new LanguageSupport(await CodeMirror.dart());

		// case 'text/x-gss':
		//     return new LanguageSupport(await CodeMirror.gss());

		// case 'text/x-less':
		//     return new CodeMirror.LanguageSupport(await CodeMirror.less());

		// case 'text/x-sass':
		//     return new LanguageSupport(await CodeMirror.sass());

		// case 'text/x-scala':
		//     return new LanguageSupport(await CodeMirror.scala());

		// case 'text/x-scss':
		//     return new LanguageSupport(await CodeMirror.scss());

		case 'svelte':
			// TODO: is codemirror-lang-svelte broken or just not used correctly?
			// return svelte();

			// highlighting svelte with js + jsx works much better than the above
			return javascript({ typescript: true, jsx: true });

		case 'vue':
			return vue();

		case 'rs':
			return rust();

		// case 'rb':
		// 	return StreamLanguage.define(ruby).parser;

		default:
			return null;
	}
}
