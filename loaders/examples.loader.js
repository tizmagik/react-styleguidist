/* eslint-disable no-invalid-this */
const _ = require('lodash');
const hljs = require('highlight.js');
const createRenderer = require('../src/utils/markdown.js');
const loaderUtils = require('loader-utils');

const md = createRenderer();

const evalPlaceholder = '<%{#eval#}%>';
const codePlaceholder = '<%{#code#}%>';

// Need to supply the regex test as a string for reuse in unit tests
// Currently, trying to change flags throws a TypeError
// Slated for change in ES6, but not possible now:
// https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/RegExp#Description
const requireAnythingTest = 'require\\s*\\(([^)]+)\\)';
const requireAnythingRegex = new RegExp(requireAnythingTest, 'g');
const simpleStringRegex = /^"([^"]+)"$|^'([^']+)'$/;

function readExamples(markdown) {
	const codeChunks = [];

	// Collect code blocks and replace them with placeholders
	md.renderer.rules.code_block = md.renderer.rules.fence = function(tokens, idx) {
		const token = tokens[idx];
		const code = tokens[idx].content.trim();
		if (token.type === 'fence' && token.info && token.info !== 'example') {
			// Render fenced blocks with language flag as regular Markdown code snippets
			let highlighted;
			try {
				highlighted = hljs.highlight(token.info, code).value;
			}
			catch (err) {
				highlighted = err.message;
			}
			return '```' + token.info + '\n' + highlighted + '\n```';
		}
		codeChunks.push(code);
		return codePlaceholder;
	};

	const rendered = md.render(markdown);

	const chunks = [];
	const textChunks = rendered.split(codePlaceholder);
	textChunks.forEach(function(chunk) {
		if (chunk) {
			chunks.push({ type: 'markdown', content: chunk });
		}
		const code = codeChunks.shift();
		if (code) {
			chunks.push({ type: 'code', content: code, evalInContext: evalPlaceholder });
		}
	});

	return chunks;
}

// Returns a list of all strings used in require(...) calls in the given source code.
// If there is any other expression inside the require call, it throws an error.
function findRequires(codeString) {
	const requires = {};
	codeString.replace(requireAnythingRegex, function(requireExprMatch, requiredExpr) {
		const requireStrMatch = simpleStringRegex.exec(requiredExpr.trim());
		if (!requireStrMatch) {
			throw new Error('Requires using expressions are not supported in examples. (Used: ' + requireExprMatch + ')');
		}
		const requiredString = requireStrMatch[1] ? requireStrMatch[1] : requireStrMatch[2];
		requires[requiredString] = true;
	});
	return Object.keys(requires);
}

function examplesLoader(source /* , map*/) {
	if (this.cacheable) {
		this.cacheable();
	}

	// Replace __COMPONENT__ placeholders with the passed-in componentName
	const componentName = loaderUtils.parseQuery(this.query).componentName || '__COMPONENT__';
	const examples = readExamples(source.replace(/__COMPONENT__/g, componentName));

	// We're analysing the examples' source code to figure out the require statements. We do it manually with regexes,
	// because webpack unfortunately doesn't expose its smart logic for rewriting requires
	// (https://webpack.github.io/docs/context.html). Note that we can't just use require(...) directly in runtime,
	// because webpack changes its name to __webpack__require__ or sth.
	const codeFromAllExamples = _.map(_.filter(examples, { type: 'code' }), 'content').join('\n');
	const requiresFromExamples = findRequires(codeFromAllExamples);

	return [
		'if (module.hot) {',
		'	module.hot.accept([]);',
		'}',
		'var requireMap = {',
		requiresFromExamples.map(function(requireRequest) {
			return JSON.stringify(requireRequest) + ': require(' + JSON.stringify(requireRequest) + ')';
		}).join(',\n'),
		'};',
		'function requireInRuntime(path) {',
		'	if (!requireMap.hasOwnProperty(path)) {',
		'		throw new Error("require() statements can be added only by editing a Markdown example file.")',
		'	}',
		'	return requireMap[path];',
		'}',
		'module.exports = ' + JSON.stringify(examples).replace(
			new RegExp(_.escapeRegExp(JSON.stringify(evalPlaceholder)), 'g'),
			'function(code, setState) {' +
			'   var require = requireInRuntime;' +
			'   return eval(code);' +
			'}'
		) + ';',
	].join('\n');
}

_.assign(examplesLoader, {
	requireAnythingTest,
	requireAnythingRegex,
	simpleStringRegex,
	readExamples,
	findRequires,
});

module.exports = examplesLoader;
