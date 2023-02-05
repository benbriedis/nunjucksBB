import mochaPhantom from './mocha-phantomjs';
import {spawn} from 'child_process';
import getStaticServer from './static-server';
import path from 'path';
import utils, {lookup,promiseSequence} from './utils';


function mochaRun({ cliTest = false } = {}) 
{
	// We need to run the cli test without nyc because of weird behavior
	// with spawn-wrap
	const bin = lookup(cliTest ? '.bin/mocha' : '.bin/nyc', true);
	const runArgs = cliTest ? [] :
		[
			'--require', '@babel/register',
			'--exclude',
			'tests/**',
			'--silent',
			'--no-clean',
			require.resolve('mocha/bin/mocha'),
		];

	const mochaArgs = cliTest ?
		['tests/cli.js'] :
		['--grep', 'precompile cli', '--invert', 'tests'];

	return new Promise((resolve, reject) => {
		try {
			const proc = spawn(bin, [
				...runArgs,
				'-R', 'spec',
				'-r', 'tests/setup',
				'-r', '@babel/register',
				...mochaArgs,
			], {
				cwd: path.join(__dirname, '../..'),
				env: process.env
			});

			proc.stdout.pipe(process.stdout);
			proc.stderr.pipe(process.stderr);

			proc.on('error', (err) => reject(err));

			proc.on('exit', (code) => {
				if (code === 0) {
					resolve(null);
				} else {
					reject(new Error('test failed. nyc/mocha exit code: ' + code));
				}
			});
		} catch (err) {
			reject(err);
		}
	});
}

export default function runtests() 
{
	return new Promise((resolve, reject) => {
		var server;

		const mochaPromise = promiseSequence([
			() => mochaRun({ cliTest: false }),
			() => mochaRun({ cliTest: true }),
		]);

		return mochaPromise.then(() => {
			return getStaticServer().then((args) => {
				server = args[0];
				const port = args[1];
				const promises = ['index', 'slim'].map(
					f => (() => mochaPhantom(`http://localhost:${port}/tests/browser/${f}.html`)));
				return promiseSequence(promises).then(() => {
					server.close();
					resolve(null);
				});
			});
		}).catch((err) => {
			if (server) 
				server.close();
			reject(err);
		});
	});
}

