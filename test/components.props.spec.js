import React from 'react';
import { parse } from 'react-docgen';
import Props, { Code } from 'rsg-components/Props/Props';
import Markdown from 'rsg-components/Markdown';

function render(propTypes, defaultProps = []) {
	const props = parse(`
		import { Component, PropTypes } from 'react';
		export default class Cmpnt extends Component {
			static propTypes = {
				${propTypes.join(',')}
			}
			static defaultProps = {
				${defaultProps.join(',')}
			}
			render() {
			}
		}
	`);
	return <Props props={props} />;
}

describe('Props', () => {
	it('should render PropTypes.string', () => {
		const result = render(['color: PropTypes.string']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>color</Code></td>
				<td><Code>string</Code></td>
				<td></td>
				<td><div /></td>
			</tr>
		);
	});

	it('should render PropTypes.string with a default value', () => {
		const result = render(['color: PropTypes.string'], ['color: "pink"']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>color</Code></td>
				<td><Code>string</Code></td>
				<td><Code>pink</Code></td>
				<td><div /></td>
			</tr>
		);
	});

	it('should render PropTypes.string.isRequired', () => {
		const result = render(['color: PropTypes.string.isRequired']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>color</Code></td>
				<td><Code>string</Code></td>
				<td><span>Required</span></td>
				<td><div /></td>
			</tr>
		);
	});

	it('should render PropTypes.arrayOf', () => {
		const result = render(['colors: PropTypes.arrayOf(PropTypes.string)']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>colors</Code></td>
				<td><Code>string[]</Code></td>
				<td></td>
				<td><div /></td>
			</tr>
		);
	});

	it('should render PropTypes.instanceOf', () => {
		const result = render(['num: PropTypes.instanceOf(Number)']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>num</Code></td>
				<td><Code>Number</Code></td>
				<td></td>
				<td><div /></td>
			</tr>
		);
	});

	it('should render PropTypes.shape', () => {
		const result = render(['foo: PropTypes.shape({bar: PropTypes.number.isRequired, baz: PropTypes.any})']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>foo</Code></td>
				<td><Code>shape</Code></td>
				<td></td>
				<td>
					<div>
						<div>
							<Code>bar</Code>: <Code>number</Code> — <span>Required</span>
						</div>
						<div>
							<Code>baz</Code>: <Code>any</Code>
						</div>
					</div>
				</td>
			</tr>
		);
	});

	it('should render description in Markdown', () => {
		const result = render(['/**\n * Label\n */\ncolor: PropTypes.string']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>color</Code></td>
				<td><Code>string</Code></td>
				<td></td>
				<td><div><Markdown text="Label" /></div></td>
			</tr>
		);
	});

	it('should render unknown proptype for a prop when a relevant proptype is not assigned', () => {
		const result = render([], ['color: "pink"']);
		expectReactShallow(result).to.contain(
			<tr>
				<td><Code>color</Code></td>
				<td><Code>unknown</Code></td>
				<td><Code>pink</Code></td>
				<td><div /></td>
			</tr>
		);
	});
});
