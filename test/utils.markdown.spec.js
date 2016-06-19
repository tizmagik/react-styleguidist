import createRenderer from '../src/utils/markdown';

describe('markdown', () => {
	it('should render only block level code in Markdown');

	it('should render PropTypes.string.isRequired', () => {
		const markdown = `
# Header

Text with *some* **formatting** and a [link](/foo).

![Image](/bar.png)

	<div/>

Text with some \`code\`.

\`\`\`
<span/>
\`\`\`
`;
		const expected = `
# Header

Text with *some* **formatting** and a [link](/foo).

![Image](/bar.png)
<pre><code>&lt;div/&gt;
</code></pre>

Text with some \`code\`.
<pre><code>&lt;span/&gt;
</code></pre>
`;
		const result = createRenderer().render(markdown);
		expect(result).to.eql(expected);
	});
});
