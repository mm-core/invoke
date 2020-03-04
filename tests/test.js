const test = require('ava');
const { promises: { copyFile, unlink } } = require('fs');

const { default: f } = require('../dist/index');

test('invoke', async (t) => {
	await copyFile('./tests/atom', './dist/atom.js');
	const v = await f(process.cwd(), './atom', { foo: 'bar' }, 'testactionid');
	await unlink('./dist/atom.js');
	t.is(v, 'bar-testactionid');
});
