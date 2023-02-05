import NYC from 'nyc';
import runtests from './lib/runtests';
import precompileTestTemplates from './lib/precompile';


process.env.NODE_ENV = 'test';

const nyc = new NYC({
	exclude: ['*.min.js', 'scripts/**', 'tests/**'],
	reporter: ['text', 'html', 'lcovonly'],
	showProcessTree: true
});
nyc.reset();


let err;

precompileTestTemplates()
	.then(() => runtests())
	.catch((e) => {
		err = e;
		console.log(err); // eslint-disable-line no-console
	})
	.then(() => {
		nyc.writeCoverageFile();
		nyc.report();

		if (err) 
			process.exit(1);
	});
