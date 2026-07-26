import { getText } from '~utils';

test('should compile with the custom compiler passed via the compiler option', async () => {
	expect(await getText('#compiler-name')).toBe('custom');
});

test('should compile modules with the custom compiler compileModule', async () => {
	expect(await getText('#module-compiler-name')).toBe('custom');
});

test('should preprocess with the custom compiler preprocess', async () => {
	expect(await getText('#preprocess-marker')).toBe('custom');
});
