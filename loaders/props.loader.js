/* eslint-disable no-console */
const path = require('path');
const reactDocs = require('react-docgen');
const config = require('../src/utils/config');
const isArray = require('lodash/isArray');

const requirePlaceholder = '<%{#require#}%>';

module.exports = function(source) {
	this.cacheable && this.cacheable(); // eslint-disable-line

	const defaultPropsParser = function(filePath, source) {
		return reactDocs.parse(source, config.resolver, config.handlers);
	};

	let jsonProps;
	let file;
	try {
		file = this.request.split('!').pop();
		const propsParser = config.propsParser || defaultPropsParser;
		const props = propsParser(file, source);

		jsonProps = (isArray(props) ? props : [props]).map(function(doc) {
			if (doc.description) {
				doc.doclets = reactDocs.utils.docblock.getDoclets(doc.description);
				doc.description = doc.description.replace(/^@(\w+)(?:$|\s((?:[^](?!^@\w))*))/gmi, '');
			}
			else {
				doc.doclets = {};
			}

			if (doc.doclets.example) {
				doc.example = requirePlaceholder;
			}

			return JSON.stringify(doc).replace(
				'"' + requirePlaceholder + '"',
				doc.doclets.example && 'require(' + JSON.stringify('examples!' + doc.doclets.example) + ')'
			);
		});
	}
	catch (err) {
		console.log('Error when parsing', path.relative(process.cwd(), file));
		console.log(err.toString());
		console.log();
		jsonProps = [];
	}

	return [
		'if (module.hot) {',
		'	module.hot.accept([]);',
		'}',
		'module.exports = [' + jsonProps.join(',') + '];',
	].join('\n');
};
