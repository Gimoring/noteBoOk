import * as esbuild from 'esbuild-wasm';
import ReactDOM from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

const App = () => {
	const ref = useRef<any>(); // -> ref.current = any value;
	// esbuild-wasm <-- esbuild- web assembly
	// web assmebly를 브라우저에서 사용 할 수 있어야 한다.
	// 그래서 컴파일된 코드인 esbuild.wasm 파일을 public 폴더로 옮겨주었다.
	const [input, setInput] = useState(''); // input
	const [code, setCode] = useState(''); // output

	const startService = async () => {
		ref.current = await esbuild.startService({
			worker: true,
			wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm', // compiled binary /public/esbuild.wasm
		});
	};

	const onClick = async () => {
		if (!ref.current) {
			return;
		}
		// first argument of build will be an object.
		const result = await ref.current.build({
			entryPoints: ['index.js'],
			bundle: true,
			write: false,
			plugins: [unpkgPathPlugin(), fetchPlugin(input)],
			define: {
				'process.env.NODE_ENV': '"production"', //process머시기를 : "production"으로 해준다.
				global: 'window', // 브라우저 안에서 코드 실행시키고 싶으면 이거 써야해용 이라고 구글신이 말해줌.
			},
		});

		// console.log(result);
		setCode(result.outputFiles[0].text);
	};

	useEffect(() => {
		startService();

		return () => {
			startService();
		};
	}, []);

	return (
		<div>
			<textarea
				value={input}
				onChange={(e) => setInput(e.target.value)}
			></textarea>
			<div>
				<button onClick={onClick}>Submit</button>
			</div>
			<pre>{code}</pre>
		</div>
	);
};

ReactDOM.render(<App />, document.querySelector('#root'));
