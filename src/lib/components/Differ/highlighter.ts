/// <reference path="./globals.d.ts" />

// This doesn't import all of CodeMirror, instead it only imports
// a small subset. This hack is brought to you by webpack and you
// can read all about it in webpack.common.js.
// import { innerMode, StringStream } from 'codemirror/addon/runmode/runmode.node.js';
// import { StringStream, getMode, innerMode } from 'codemirror';
// import { getMode, innerMode, StringStream } from 'codemirror/addon/runmode/runmode-standalone.js';
import type { IHighlightRequest, ITokens } from './types';

// Known modes, by name and by MIME
// let modes: { [key: string]: any } = {},
// 	mimeModes: { [key: string]: any } = {};

// // Extra arguments are stored as the mode's dependencies, which is
// // used by (legacy) mechanisms like loadmode.js to automatically
// // load a mode. (Preferred mechanism is the require/define calls.)
// function defineMode(name: string, mode: any) {
// 	if (arguments.length > 2) {
// 		mode.dependencies = Array.prototype.slice.call(arguments, 2);
// 	}
// 	modes[name] = mode;
// }

// function defineMIME(mime: string, spec: any) {
// 	mimeModes[mime] = spec;
// }
// // This can be used to attach properties to mode objects from
// // outside the actual mode definition.
// let modeExtensions: { [key: string]: any } = {};

// function nothing() {}
// function copyObj(obj: any, target: any, overwrite?: boolean) {
// 	if (!target) {
// 		target = {};
// 	}
// 	for (var prop in obj) {
// 		if (obj.hasOwnProperty(prop) && (overwrite !== false || !target.hasOwnProperty(prop))) {
// 			target[prop] = obj[prop];
// 		}
// 	}
// 	return target;
// }

// function createObj(base: any, props: any) {
// 	var inst;
// 	if (Object.create) {
// 		inst = Object.create(base);
// 	} else {
// 		nothing.prototype = base;
// 		inst = nothing();
// 	}
// 	if (props) {
// 		copyObj(props, inst);
// 	}
// 	return inst;
// }
// // Given a MIME type, a {name, ...options} config object, or a name
// // string, return a mode config object.
// function resolveMode(spec: any) {
// 	if (typeof spec == 'string' && mimeModes.hasOwnProperty(spec)) {
// 		spec = mimeModes[spec];
// 	} else if (spec && typeof spec.name == 'string' && mimeModes.hasOwnProperty(spec.name)) {
// 		var found = mimeModes[spec.name];
// 		if (typeof found == 'string') {
// 			found = { name: found };
// 		}
// 		spec = createObj(found, spec);
// 		spec.name = found.name;
// 	} else if (typeof spec == 'string' && /^[\w\-]+\/[\w\-]+\+xml$/.test(spec)) {
// 		return resolveMode('application/xml');
// 	} else if (typeof spec == 'string' && /^[\w\-]+\/[\w\-]+\+json$/.test(spec)) {
// 		return resolveMode('application/json');
// 	}
// 	if (typeof spec == 'string') {
// 		return { name: spec };
// 	} else {
// 		return spec || { name: 'null' };
// 	}
// }

// // Given a mode spec (anything that resolveMode accepts), find and
// // initialize an actual mode object.
// function getMode(options: any, spec: any) {
// 	spec = resolveMode(spec);
// 	const mfactory = modes[spec.name];
// 	console.log('🚀 ~ getMode ~ mfactory:', mfactory);
// 	// if (!mfactory) {
// 	// 	return getMode(options, 'text/plain');
// 	// }
// 	const modeObj = mfactory(options, spec);
// 	if (modeExtensions.hasOwnProperty(spec.name)) {
// 		const exts = modeExtensions[spec.name];
// 		for (const prop in exts) {
// 			if (!exts.hasOwnProperty(prop)) {
// 				continue;
// 			}
// 			if (modeObj.hasOwnProperty(prop)) {
// 				modeObj['_' + prop] = modeObj[prop];
// 			}
// 			modeObj[prop] = exts[prop];
// 		}
// 	}
// 	modeObj.name = spec.name;
// 	if (spec.helperType) {
// 		modeObj.helperType = spec.helperType;
// 	}
// 	if (spec.modeProps) {
// 		for (const prop$1 in spec.modeProps) {
// 			modeObj[prop$1] = spec.modeProps[prop$1];
// 		}
// 	}

// 	return modeObj;
// }

// // Given a mode and a state (for that mode), find the inner mode and
// // state at the position that the state refers to.
function innerMode(mode: any, state: any) {
	var info;
	while (mode.innerMode) {
		info = mode.innerMode(state);
		if (!info || info.mode == mode) {
			break;
		}
		state = info.state;
		mode = info.mode;
	}
	return info || { mode: mode, state: state };
}

// defineMode('null', function () {
// 	return {
// 		token: function (stream: any) {
// 			return stream.skipToEnd();
// 		}
// 	};
// });
// defineMIME('text/plain', 'null');

interface StringStreamContext {
	lines: string[];
	line: number;
	lookAhead: (n: number) => string;
	baseToken?: (pos: number) => string;
}

class StringStream {
	pos: number;
	start: number;
	string: string;
	tabSize: number;
	lastColumnPos: number;
	lastColumnValue: number;
	lineStart: number;
	lineOracle: StringStreamContext | undefined;

	constructor(string: string, tabSize: number = 8, lineOracle?: StringStreamContext) {
		this.pos = this.start = 0;
		this.string = string;
		this.tabSize = tabSize;
		this.lastColumnPos = this.lastColumnValue = 0;
		this.lineStart = 0;
		this.lineOracle = lineOracle;
	}

	eol(): boolean {
		return this.pos >= this.string.length;
	}
	sol(): boolean {
		return this.pos === this.lineStart;
	}
	peek(): string | undefined {
		return this.string.charAt(this.pos) || undefined;
	}
	next(): string | undefined {
		if (this.pos < this.string.length) return this.string.charAt(this.pos++);
	}
	eat(match: string | any): string | undefined {
		const ch = this.string.charAt(this.pos);
		let ok: boolean;
		if (typeof match === 'string') {
			ok = ch === match;
		} else {
			ok = ch && (match.test ? match.test(ch) : match(ch));
		}
		if (ok) {
			++this.pos;
			return ch;
		}
	}
	eatWhile(match: RegExp): boolean {
		const start = this.pos;
		while (this.eat(match)) {}
		return this.pos > start;
	}
	eatSpace(): boolean {
		const start = this.pos;
		while (/[\s\u00a0]/.test(this.string.charAt(this.pos))) {
			++this.pos;
		}
		return this.pos > start;
	}
	skipToEnd(): void {
		this.pos = this.string.length;
	}
	skipTo(ch: string): boolean {
		const found = this.string.indexOf(ch, this.pos);
		if (found > -1) {
			this.pos = found;
			return true;
		}
		return false;
	}
	backUp(n: number): void {
		this.pos -= n;
	}
	column(): number {
		if (this.lastColumnPos < this.start) {
			this.lastColumnValue = countColumn(
				this.string,
				this.start,
				this.tabSize,
				this.lastColumnPos,
				this.lastColumnValue
			);
			this.lastColumnPos = this.start;
		}
		return (
			this.lastColumnValue -
			(this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
		);
	}
	indentation(): number {
		return (
			countColumn(this.string, null, this.tabSize) -
			(this.lineStart ? countColumn(this.string, this.lineStart, this.tabSize) : 0)
		);
	}
	match(
		pattern: string | RegExp,
		consume?: boolean,
		caseInsensitive?: boolean
	): RegExpMatchArray | boolean | null | undefined {
		if (typeof pattern === 'string') {
			const cased = (str: string) => (caseInsensitive ? str.toLowerCase() : str);
			const substr = this.string.substr(this.pos, pattern.length);
			if (cased(substr) === cased(pattern)) {
				if (consume !== false) {
					this.pos += pattern.length;
				}
				return true;
			}
		} else {
			const match = this.string.slice(this.pos).match(pattern);
			if (match && match.index !== undefined && match.index > 0) {
				return null;
			}
			if (match && consume !== false) {
				this.pos += match[0].length;
			}
			return match;
		}
	}
	current(): string {
		return this.string.slice(this.start, this.pos);
	}
	hideFirstChars(n: number, inner: () => any): any {
		this.lineStart += n;
		try {
			return inner();
		} finally {
			this.lineStart -= n;
		}
	}
	lookAhead(n: number): any {
		const oracle = this.lineOracle;
		return oracle && oracle.lookAhead(n);
	}
	baseToken(): any {
		const oracle = this.lineOracle;
		return oracle && oracle.baseToken && oracle.baseToken(this.pos);
	}
}

// Counts the column offset in a string, taking tabs into account.
// Used mostly to find indentation.
function countColumn(
	string: string,
	end: number | null,
	tabSize: number,
	startIndex?: number,
	startValue?: number
) {
	if (end == null) {
		end = string.search(/[^\s\u00a0]/);
		if (end == -1) {
			end = string.length;
		}
	}
	for (var i = startIndex || 0, n = startValue || 0; ; ) {
		var nextTab = string.indexOf('\t', i);
		if (nextTab < 0 || nextTab >= end) {
			return n + (end - i);
		}
		n += nextTab - i;
		n += tabSize - (n % tabSize);
		i = nextTab + 1;
	}
}
// function countColumn(string: string, start?: number, tabSize: number = 8, end?: number, startIndex?: number): number {
// 	let i = startIndex || 0;
// 	let n = 0;
// 	if (start == null) start = 0;
// 	if (end == null) end = string.length;
// 	for (let ch of string.slice(start, end)) {
// 			if (ch === "\t") n += tabSize - (n % tabSize);
// 			else ++n;
// 			++i;
// 	}
// 	return n;
// }

/**
 * A mode definition object is used to map a certain file
 * extension to a mode loader (see the documentation for
 * the install property).
 */
interface IModeDefinition {
	/**
	 * A function that, when called, will attempt to asynchronously
	 * load the required modules for a particular mode. This function
	 * is idempotent and can be called multiple times with no adverse
	 * effect.
	 */
	readonly install: () => Promise<void>;

	/**
	 * A map between file extensions (including the leading dot, i.e.
	 * ".jpeg") or basenames (i.e. "dockerfile") and the selected mime
	 * type to use when highlighting that extension as specified in
	 * the CodeMirror mode itself.
	 */
	readonly mappings: {
		readonly [key: string]: string;
	};
}

/**
 * Array describing all currently supported extensionModes and the file extensions
 * that they cover.
 */
const extensionModes: ReadonlyArray<IModeDefinition> = [
	{
		install: () => import('codemirror/mode/javascript/javascript'),
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
		install: () => import('codemirror/mode/coffeescript/coffeescript'),
		mappings: {
			'.coffee': 'text/x-coffeescript'
		}
	},
	{
		install: () => import('codemirror/mode/jsx/jsx'),
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
		install: () => import('codemirror/mode/htmlmixed/htmlmixed'),
		mappings: {
			'.html': 'text/html',
			'.htm': 'text/html'
		}
	},
	{
		install: () => import('codemirror/mode/htmlembedded/htmlembedded'),
		mappings: {
			'.aspx': 'application/x-aspx',
			'.cshtml': 'application/x-aspx',
			'.jsp': 'application/x-jsp'
		}
	},
	{
		install: () => import('codemirror/mode/css/css'),
		mappings: {
			'.css': 'text/css',
			'.scss': 'text/x-scss',
			'.less': 'text/x-less'
		}
	},
	{
		install: () => import('codemirror/mode/vue/vue'),
		mappings: {
			'.vue': 'text/x-vue'
		}
	},
	{
		install: () => import('codemirror/mode/markdown/markdown'),
		mappings: {
			'.markdown': 'text/x-markdown',
			'.md': 'text/x-markdown',
			'.mdx': 'text/x-markdown'
		}
	},
	{
		install: () => import('codemirror/mode/yaml/yaml'),
		mappings: {
			'.yaml': 'text/yaml',
			'.yml': 'text/yaml'
		}
	},
	{
		install: () => import('codemirror/mode/xml/xml'),
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
		install: () => import('codemirror/mode/diff/diff'),
		mappings: {
			'.diff': 'text/x-diff',
			'.patch': 'text/x-diff'
		}
	},
	{
		install: () => import('codemirror/mode/clike/clike'),
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
		install: () => import('codemirror/mode/mllike/mllike'),
		mappings: {
			'.ml': 'text/x-ocaml',
			'.fs': 'text/x-fsharp',
			'.fsx': 'text/x-fsharp',
			'.fsi': 'text/x-fsharp'
		}
	},
	{
		install: () => import('codemirror/mode/swift/swift'),
		mappings: {
			'.swift': 'text/x-swift'
		}
	},
	{
		install: () => import('codemirror/mode/shell/shell'),
		mappings: {
			'.sh': 'text/x-sh'
		}
	},
	{
		install: () => import('codemirror/mode/sql/sql'),
		mappings: {
			'.sql': 'text/x-sql'
		}
	},
	{
		install: () => import('codemirror/mode/cypher/cypher'),
		mappings: {
			'.cql': 'application/x-cypher-query'
		}
	},
	{
		install: () => import('codemirror/mode/go/go'),
		mappings: {
			'.go': 'text/x-go'
		}
	},
	{
		install: () => import('codemirror/mode/perl/perl'),
		mappings: {
			'.pl': 'text/x-perl'
		}
	},
	{
		install: () => import('codemirror/mode/php/php'),
		mappings: {
			'.php': 'application/x-httpd-php'
		}
	},
	{
		install: () => import('codemirror/mode/python/python'),
		mappings: {
			'.py': 'text/x-python',
			'.pyi': 'text/x-python',
			'.vpy': 'text/x-python'
		}
	},
	{
		install: () => import('codemirror/mode/ruby/ruby'),
		mappings: {
			'.rb': 'text/x-ruby'
		}
	},
	{
		install: () => import('codemirror/mode/clojure/clojure'),
		mappings: {
			'.clj': 'text/x-clojure',
			'.cljc': 'text/x-clojure',
			'.cljs': 'text/x-clojure',
			'.edn': 'text/x-clojure'
		}
	},
	{
		install: () => import('codemirror/mode/rust/rust'),
		mappings: {
			'.rs': 'text/x-rustsrc'
		}
	},
	// {
	// 	install: () => import('codemirror-mode-elixir'),
	// 	mappings: {
	// 		'.ex': 'text/x-elixir',
	// 		'.exs': 'text/x-elixir'
	// 	}
	// },
	{
		install: () => import('codemirror/mode/haxe/haxe'),
		mappings: {
			'.hx': 'text/x-haxe'
		}
	},
	{
		install: () => import('codemirror/mode/r/r'),
		mappings: {
			'.r': 'text/x-rsrc'
		}
	},
	{
		install: () => import('codemirror/mode/powershell/powershell'),
		mappings: {
			'.ps1': 'application/x-powershell'
		}
	},
	{
		install: () => import('codemirror/mode/vb/vb'),
		mappings: {
			'.vb': 'text/x-vb'
		}
	},
	{
		install: () => import('codemirror/mode/fortran/fortran'),
		mappings: {
			'.f': 'text/x-fortran',
			'.f90': 'text/x-fortran'
		}
	},
	{
		install: () => import('codemirror/mode/lua/lua'),
		mappings: {
			'.lua': 'text/x-lua'
		}
	},
	{
		install: () => import('codemirror/mode/crystal/crystal'),
		mappings: {
			'.cr': 'text/x-crystal'
		}
	},
	{
		install: () => import('codemirror/mode/julia/julia'),
		mappings: {
			'.jl': 'text/x-julia'
		}
	},
	{
		install: () => import('codemirror/mode/stex/stex'),
		mappings: {
			'.tex': 'text/x-stex'
		}
	},
	{
		install: () => import('codemirror/mode/sparql/sparql'),
		mappings: {
			'.rq': 'application/sparql-query'
		}
	},
	{
		install: () => import('codemirror/mode/stylus/stylus'),
		mappings: {
			'.styl': 'text/x-styl'
		}
	},
	{
		install: () => import('codemirror/mode/soy/soy'),
		mappings: {
			'.soy': 'text/x-soy'
		}
	},
	{
		install: () => import('codemirror/mode/smalltalk/smalltalk'),
		mappings: {
			'.st': 'text/x-stsrc'
		}
	},
	{
		install: () => import('codemirror/mode/slim/slim'),
		mappings: {
			'.slim': 'application/x-slim'
		}
	},
	{
		install: () => import('codemirror/mode/haml/haml'),
		mappings: {
			'.haml': 'text/x-haml'
		}
	},
	{
		install: () => import('codemirror/mode/sieve/sieve'),
		mappings: {
			'.sieve': 'application/sieve'
		}
	},
	{
		install: () => import('codemirror/mode/scheme/scheme'),
		mappings: {
			'.ss': 'text/x-scheme',
			'.sls': 'text/x-scheme',
			'.scm': 'text/x-scheme'
		}
	},
	{
		install: () => import('codemirror/mode/rst/rst'),
		mappings: {
			'.rst': 'text/x-rst'
		}
	},
	{
		install: () => import('codemirror/mode/rpm/rpm'),
		mappings: {
			'.rpm': 'text/x-rpm-spec'
		}
	},
	{
		install: () => import('codemirror/mode/q/q'),
		mappings: {
			'.q': 'text/x-q'
		}
	},
	{
		install: () => import('codemirror/mode/puppet/puppet'),
		mappings: {
			'.pp': 'text/x-puppet'
		}
	},
	{
		install: () => import('codemirror/mode/pug/pug'),
		mappings: {
			'.pug': 'text/x-pug'
		}
	},
	{
		install: () => import('codemirror/mode/protobuf/protobuf'),
		mappings: {
			'.proto': 'text/x-protobuf'
		}
	},
	{
		install: () => import('codemirror/mode/properties/properties'),
		mappings: {
			'.properties': 'text/x-properties',
			'.gitattributes': 'text/x-properties',
			'.gitignore': 'text/x-properties',
			'.editorconfig': 'text/x-properties',
			'.ini': 'text/x-ini'
		}
	},
	{
		install: () => import('codemirror/mode/pig/pig'),
		mappings: {
			'.pig': 'text/x-pig'
		}
	},
	{
		install: () => import('codemirror/mode/asciiarmor/asciiarmor'),
		mappings: {
			'.pgp': 'application/pgp'
		}
	},
	{
		install: () => import('codemirror/mode/oz/oz'),
		mappings: {
			'.oz': 'text/x-oz'
		}
	},
	{
		install: () => import('codemirror/mode/pascal/pascal'),
		mappings: {
			'.pas': 'text/x-pascal'
		}
	},
	{
		install: () => import('codemirror/mode/toml/toml'),
		mappings: {
			'.toml': 'text/x-toml'
		}
	},
	{
		install: () => import('codemirror/mode/dart/dart'),
		mappings: {
			'.dart': 'application/dart'
		}
	},
	// {
	//   install: () => import('codemirror-mode-zig'),
	//   mappings: {
	//     '.zig': 'text/x-zig',
	//   },
	// },
	{
		install: () => import('codemirror/mode/cmake/cmake'),
		mappings: {
			'.cmake': 'text/x-cmake'
		}
	}
];

/**
 * A map between file extensions and mime types, see
 * the 'mappings' property on the IModeDefinition interface
 * for more information
 */
const extensionMIMEMap = new Map<string, string>();

/**
 * Array describing all currently supported basenameModes and the file names
 * that they cover.
 */
const basenameModes: ReadonlyArray<IModeDefinition> = [
	{
		install: () => import('codemirror/mode/dockerfile/dockerfile'),
		mappings: {
			dockerfile: 'text/x-dockerfile'
		}
	}
];

/**
 * A map between file basenames and mime types, see
 * the 'basenames' property on the IModeDefinition interface
 * for more information
 */
const basenameMIMEMap = new Map<string, string>();

/**
 * A map between mime types and mode definitions. See the
 * documentation for the IModeDefinition interface
 * for more information
 */
const mimeModeMap = new Map<string, IModeDefinition>();

for (const extensionMode of extensionModes) {
	for (const [mapping, mimeType] of Object.entries(extensionMode.mappings)) {
		extensionMIMEMap.set(mapping, mimeType);
		mimeModeMap.set(mimeType, extensionMode);
	}
}

for (const basenameMode of basenameModes) {
	for (const [mapping, mimeType] of Object.entries(basenameMode.mappings)) {
		basenameMIMEMap.set(mapping, mimeType);
		mimeModeMap.set(mimeType, basenameMode);
	}
}

function guessMimeType(contents: ReadonlyArray<string>) {
	const firstLine = contents[0];

	if (firstLine.startsWith('<?xml')) {
		return 'text/xml';
	}

	if (firstLine.startsWith('#!')) {
		const m = /^#!.*?(ts-node|node|bash|sh|python(?:[\d.]+)?)/g.exec(firstLine);

		if (m) {
			switch (m[1]) {
				case 'ts-node':
					return 'text/typescript';
				case 'node':
					return 'text/javascript';
				case 'sh':
				case 'bash':
					return 'text/x-sh';
				case 'perl':
					return 'text/x-perl';
			}

			if (m[1].startsWith('python')) {
				return 'text/x-python';
			}
		}
	}

	return null;
}

// async function detectMode(request: IHighlightRequest): Promise<CodeMirror.Mode<{}> | null> {
// 	const mimeType =
// 		extensionMIMEMap.get('.' + request.extension.toLowerCase()) ||
// 		basenameMIMEMap.get(request.basename.toLowerCase()) ||
// 		guessMimeType(request.contentLines);

// 	if (!mimeType) {
// 		return null;
// 	}

// 	// const modeDefinition = mimeModeMap.get(mimeType);

// 	// if (modeDefinition === undefined) {
// 	// 	return null;
// 	// }

// 	// await modeDefinition.install();

// 	console.log('🚀 ~ detectMode ~ getMode({}, mimeType:', getMode({}, mimeType));
// 	return getMode({}, mimeType) || null;
// }

function getModeName(mode: CodeMirror.Mode<{}>): string | null {
	const name = (mode as any).name;
	return name && typeof name === 'string' ? name : null;
}

/**
 * Helper method to determine the name of the innermost (i.e. current)
 * mode. Think of this as an abstraction over CodeMirror's innerMode
 * with added type guards.
 */
function getInnerModeName(mode: CodeMirror.Mode<{}>, state: any): string | null {
	const inner = innerMode(mode, state);
	return inner && inner.mode ? getModeName(inner.mode) : null;
	return null;
}

/**
 * Extract the next token from the line stream or null if no token
 * could be extracted from the current position in the line stream.
 *
 * This method is more or less equal to the readToken method in
 * CodeMirror but since the readToken class in CodeMirror isn't included
 * in the Node runmode we're not able to use it.
 *
 * Worth noting here is that we're also replicated the workaround for
 * modes that aren't adhering to the rules of never returning without
 * advancing the line stream by trying it again (up to ten times). See
 * https://github.com/codemirror/CodeMirror/commit/2c60a2 for more
 * details on that.
 *
 * @param mode         The current (outer) mode
 * @param stream       The StringStream for the current line
 * @param state        The current mode state (if any)
 * @param addModeClass Whether or not to append the current (inner) mode name
 *                     as an extra CSS class to the token, indicating the mode
 *                     that produced it, prefixed with "cm-m-". For example,
 *                     tokens from the XML mode will get the cm-m-xml class.
 */
function readToken(
	mode: CodeMirror.Mode<{}>,
	stream: any, //StringStream,
	state: any,
	addModeClass: boolean
): string | null {
	for (let i = 0; i < 10; i++) {
		const innerModeName = addModeClass ? getInnerModeName(mode, state) : null;
		const token = mode.token(stream, state);

		if (stream.pos > stream.start) {
			return token && innerModeName ? `m-${innerModeName} ${token}` : token;
		}
	}

	throw new Error(`Mode ${getModeName(mode)} failed to advance stream.`);
}

onmessage = async (ev: MessageEvent) => {
	const request = ev.data as IHighlightRequest;
	console.log('🚀 ~ onmessage ~ request:', request);
	const tabSize = request.tabSize || 4;
	const addModeClass = request.addModeClass === true;

	// const mode = await detectMode(request);
	const mode = JSON.parse(request.mode);
	const startState = JSON.parse(request.startState);
	const blankLine = JSON.parse(request.blankLine);
	const innerMode = request.innerMode && JSON.parse(request.innerMode);
	const token = JSON.parse(request.token);
	mode.innerMode = innerMode;
	mode.token = token;
	mode.startState = startState;
	mode.blankLine = blankLine;
	console.log('🚀 ~ onmessage ~ mode:', mode);
	if (!mode) {
		postMessage({});
		return;
	}

	const lineFilter = request.lines && request.lines.length ? new Set<number>(request.lines) : null;

	// If we've got a set of requested lines we can keep track of the maximum
	// line we need so that we can bail immediately when we've reached it.
	const maxLine = lineFilter ? Math.max(...lineFilter) : null;

	const lines = request.contentLines.concat();
	const state: any = startState ? startState() : null;

	const tokens: ITokens = {};

	for (const [ix, line] of lines.entries()) {
		// No need to continue after the max line
		if (maxLine !== null && ix > maxLine) {
			break;
		}

		// For stateless modes we can optimize by only running
		// the tokenizer over lines we care about.
		if (lineFilter && !state) {
			if (!lineFilter.has(ix)) {
				continue;
			}
		}

		if (!line.length) {
			if (blankLine) {
				blankLine(state);
			}

			continue;
		}

		const lineCtx = {
			lines,
			line: ix,
			lookAhead: (n: number) => lines[ix + n]
		};
		const lineStream = new StringStream(line);

		while (!lineStream.eol()) {
			const token = readToken(mode, lineStream, state, addModeClass);

			if (token && (!lineFilter || lineFilter.has(ix))) {
				tokens[ix] = tokens[ix] || {};
				tokens[ix][lineStream.start] = {
					length: lineStream.pos - lineStream.start,
					token
				};
			}

			lineStream.start = lineStream.pos;
		}
	}

	postMessage(tokens);
};
