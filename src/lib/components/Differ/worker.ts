import { getMode } from 'codemirror';
import type { IHighlightRequest, ITokens } from './types';

const highlightWorkers = new Array<Worker>();
const maxIdlingWorkers = 2;
const workerMaxRunDuration = 5 * 1000;

const extensionModes: ReadonlyArray<{ mappings: { [key: string]: string } }> = [
	{
		mappings: {
			'.ts': 'text/typescript',
			'.mts': 'text/typescript',
			'.cts': 'text/typescript',
			'.js': 'text/javascript',
			'.mjs': 'text/javascript',
			'.cjs': 'text/javascript',
			'.json': 'application/json'
		}
	},
	{
		mappings: {
			'.coffee': 'text/x-coffeescript'
		}
	},
	{
		mappings: {
			'.tsx': 'text/typescript-jsx',
			'.mtsx': 'text/typescript-jsx',
			'.ctsx': 'text/typescript-jsx',
			'.jsx': 'text/jsx',
			'.mjsx': 'text/jsx',
			'.cjsx': 'text/jsx'
		}
	},
	{
		mappings: {
			'.html': 'text/html',
			'.htm': 'text/html'
		}
	},
	{
		mappings: {
			'.aspx': 'application/x-aspx',
			'.cshtml': 'application/x-aspx',
			'.jsp': 'application/x-jsp'
		}
	},
	{
		mappings: {
			'.css': 'text/css',
			'.scss': 'text/x-scss',
			'.less': 'text/x-less'
		}
	},
	{
		mappings: {
			'.vue': 'text/x-vue'
		}
	},
	{
		mappings: {
			'.markdown': 'text/x-markdown',
			'.md': 'text/x-markdown',
			'.mdx': 'text/x-markdown'
		}
	},
	{
		mappings: {
			'.yaml': 'text/yaml',
			'.yml': 'text/yaml'
		}
	},
	{
		mappings: {
			'.xml': 'text/xml',
			'.xaml': 'text/xml',
			'.xsd': 'text/xml',
			'.csproj': 'text/xml',
			'.fsproj': 'text/xml',
			'.vcxproj': 'text/xml',
			'.vbproj': 'text/xml',
			'.svg': 'text/xml',
			'.resx': 'text/xml',
			'.props': 'text/xml',
			'.targets': 'text/xml'
		}
	},
	{
		mappings: {
			'.diff': 'text/x-diff',
			'.patch': 'text/x-diff'
		}
	},
	{
		mappings: {
			'.m': 'text/x-objectivec',
			'.scala': 'text/x-scala',
			'.sc': 'text/x-scala',
			'.cs': 'text/x-csharp',
			'.cake': 'text/x-csharp',
			'.java': 'text/x-java',
			'.c': 'text/x-c',
			'.h': 'text/x-c',
			'.cpp': 'text/x-c++src',
			'.hpp': 'text/x-c++src',
			'.cc': 'text/x-c++src',
			'.hh': 'text/x-c++src',
			'.hxx': 'text/x-c++src',
			'.cxx': 'text/x-c++src',
			'.ino': 'text/x-c++src',
			'.kt': 'text/x-kotlin'
		}
	},
	{
		mappings: {
			'.ml': 'text/x-ocaml',
			'.fs': 'text/x-fsharp',
			'.fsx': 'text/x-fsharp',
			'.fsi': 'text/x-fsharp'
		}
	},
	{
		mappings: {
			'.swift': 'text/x-swift'
		}
	},
	{
		mappings: {
			'.sh': 'text/x-sh'
		}
	},
	{
		mappings: {
			'.sql': 'text/x-sql'
		}
	},
	{
		mappings: {
			'.cql': 'application/x-cypher-query'
		}
	},
	{
		mappings: {
			'.go': 'text/x-go'
		}
	},
	{
		mappings: {
			'.pl': 'text/x-perl'
		}
	},
	{
		mappings: {
			'.php': 'application/x-httpd-php'
		}
	},
	{
		mappings: {
			'.py': 'text/x-python',
			'.pyi': 'text/x-python',
			'.vpy': 'text/x-python'
		}
	},
	{
		mappings: {
			'.rb': 'text/x-ruby'
		}
	},
	{
		mappings: {
			'.clj': 'text/x-clojure',
			'.cljc': 'text/x-clojure',
			'.cljs': 'text/x-clojure',
			'.edn': 'text/x-clojure'
		}
	},
	{
		mappings: {
			'.rs': 'text/x-rustsrc'
		}
	},
	// {
	// 	mappings: {
	// 		'.ex': 'text/x-elixir',
	// 		'.exs': 'text/x-elixir'
	// 	}
	// },
	{
		mappings: {
			'.hx': 'text/x-haxe'
		}
	},
	{
		mappings: {
			'.r': 'text/x-rsrc'
		}
	},
	{
		mappings: {
			'.ps1': 'application/x-powershell'
		}
	},
	{
		mappings: {
			'.vb': 'text/x-vb'
		}
	},
	{
		mappings: {
			'.f': 'text/x-fortran',
			'.f90': 'text/x-fortran'
		}
	},
	{
		mappings: {
			'.lua': 'text/x-lua'
		}
	},
	{
		mappings: {
			'.cr': 'text/x-crystal'
		}
	},
	{
		mappings: {
			'.jl': 'text/x-julia'
		}
	},
	{
		mappings: {
			'.tex': 'text/x-stex'
		}
	},
	{
		mappings: {
			'.rq': 'application/sparql-query'
		}
	},
	{
		mappings: {
			'.styl': 'text/x-styl'
		}
	},
	{
		mappings: {
			'.soy': 'text/x-soy'
		}
	},
	{
		mappings: {
			'.st': 'text/x-stsrc'
		}
	},
	{
		mappings: {
			'.slim': 'application/x-slim'
		}
	},
	{
		mappings: {
			'.haml': 'text/x-haml'
		}
	},
	{
		mappings: {
			'.sieve': 'application/sieve'
		}
	},
	{
		mappings: {
			'.ss': 'text/x-scheme',
			'.sls': 'text/x-scheme',
			'.scm': 'text/x-scheme'
		}
	},
	{
		mappings: {
			'.rst': 'text/x-rst'
		}
	},
	{
		mappings: {
			'.rpm': 'text/x-rpm-spec'
		}
	},
	{
		mappings: {
			'.q': 'text/x-q'
		}
	},
	{
		mappings: {
			'.pp': 'text/x-puppet'
		}
	},
	{
		mappings: {
			'.pug': 'text/x-pug'
		}
	},
	{
		mappings: {
			'.proto': 'text/x-protobuf'
		}
	},
	{
		mappings: {
			'.properties': 'text/x-properties',
			'.gitattributes': 'text/x-properties',
			'.gitignore': 'text/x-properties',
			'.editorconfig': 'text/x-properties',
			'.ini': 'text/x-ini'
		}
	},
	{
		mappings: {
			'.pig': 'text/x-pig'
		}
	},
	{
		mappings: {
			'.pgp': 'application/pgp'
		}
	},
	{
		mappings: {
			'.oz': 'text/x-oz'
		}
	},
	{
		mappings: {
			'.pas': 'text/x-pascal'
		}
	},
	{
		mappings: {
			'.toml': 'text/x-toml'
		}
	},
	{
		mappings: {
			'.dart': 'application/dart'
		}
	},
	// {
	//   mappings: {
	//     '.zig': 'text/x-zig',
	//   },
	// },
	{
		mappings: {
			'.cmake': 'text/x-cmake'
		}
	}
];
// const workerUri = encodePathAsUrl(__dirname, 'highlighter.js')
// const worker = new Worker(new URL('./highlighter.js', import.meta.url), {
//   type: 'module'
// })

/**
 * Request an automatic detection of the language and highlight
 * the contents provided.
 *
 * @param contents  The actual contents which is to be used for
 *                  highlighting.
 * @param basename  The file basename of the path in question as returned
 *                  by node's basename() function (i.e. without a leading dot).
 * @param extension The file extension of the path in question as returned
 *                  by node's extname() function (i.e. with a leading dot).
 * @param tabSize   The width of a tab character. Defaults to 4. Used by the
 *                  stream to count columns. See CodeMirror's StringStream
 *                  class for more details.
 * @param lines     An optional filter of lines which needs to be tokenized.
 *
 *                  If undefined or empty all lines will be tokenized
 *                  and returned. By passing an explicit set of lines we can
 *                  both minimize the size of the response object (which needs
 *                  to be serialized over the IPC boundary) and, for stateless
 *                  modes we can significantly speed up the highlight process.
 */
export function highlight(
	contentLines: ReadonlyArray<string>,
	basename: string,
	extension: string,
	tabSize: number,
	lines: Array<number>
): Promise<ITokens> {
	// Bail early if there's no content to highlight or if we don't
	// need any lines from this file.
	if (!contentLines.length || !lines.length) {
		return Promise.resolve({});
	}
	const mimeType = extensionModes.find((mode) => mode.mappings['.' + extension])?.mappings[
		'.' + extension
	];
	const mode = getMode({}, mimeType) as CodeMirror.Mode<{}> | null;
	console.log('🚀 ~ mode:', mode);
	const startState = JSON.stringify(mode?.startState);
	const blankLine = JSON.stringify(mode?.blankLine);
	const token = JSON.stringify(mode?.token);
	// @ts-ignore
	const innerMode = JSON.stringify(mode?.innerMode);

	// Get an idle worker or create a new one if none exist.
	const worker =
		highlightWorkers.shift() ||
		new Worker(new URL('./highlighter.ts', import.meta.url), {
			type: 'module'
		});

	return new Promise<ITokens>((resolve, reject) => {
		let timeout: null | number = null;

		const clearTimeout = () => {
			if (timeout) {
				window.clearTimeout(timeout);
				timeout = null;
			}
		};

		worker.onerror = (ev) => {
			clearTimeout();
			worker.terminate();
			reject(ev.error || new Error(ev.message));
		};

		worker.onmessage = (ev) => {
			clearTimeout();
			if (highlightWorkers.length < maxIdlingWorkers) {
				highlightWorkers.push(worker);
			} else {
				worker.terminate();
			}
			resolve(ev.data as ITokens);
		};

		const request: IHighlightRequest = {
			contentLines,
			basename,
			extension,
			tabSize,
			lines,
			addModeClass: true,
			mode: JSON.stringify(mode),
			startState,
			blankLine,
			innerMode,
			token
		};

		worker.postMessage(request);

		timeout = window.setTimeout(() => {
			worker.terminate();
			reject(new Error('timed out'));
		}, workerMaxRunDuration);
	});
}
