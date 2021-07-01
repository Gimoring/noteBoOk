import * as esbuild from 'esbuild-wasm';
import ReactDOM from 'react-dom';
import { useEffect, useState, useRef } from 'react';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';
import CodeEditor from './components/code-editor';

const App = () => {
	const ref = useRef<any>(); // -> ref.current = any value;
	const iframeRef = useRef<any>();

	// esbuild-wasm <-- esbuild- web assembly
	// web assmebly를 브라우저에서 사용 할 수 있어야 한다.
	// 그래서 컴파일된 코드인 esbuild.wasm 파일을 public 폴더로 옮겨주었다.
	const [input, setInput] = useState(''); // input

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

		iframeRef.current.srcdoc = html;

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
		// setCode(result.outputFiles[0].text);
		/*
    window.postMessage() 메소드는 Window 오브젝트 사이에서 안전하게 cross-origin 통신을 할 수 있게 합니다. 
    예시로, 페이지와 생성된 팝업 간의 통신이나, 페이지와 페이지 안의 iframe 간의 통신에 사용할 수 있습니다.
    */
		iframeRef.current.contentWindow.postMessage(
			result.outputFiles[0].text,
			'*'
		);
	};

	useEffect(() => {
		startService();

		return () => {
			startService();
		};
	}, []);

	const html = `
  <html> 
    <head></head>
    <body>
      <div id="root"></div>
      <script>
      window.addEventListener('message', (event) => {
        //coming from parent document.

        try {
          eval(event.data);
        } catch (err) {
          const root = document.querySelector('#root');
          root.innerHTML = '<div style="color: red;"><h4> ERROR !</h4>' + err + '</div>'
          throw err;
        }        
      }, false);
      </script>
    </body>
  </html
  `;

	return (
		<div>
			<CodeEditor
				initialValue="const a = 1;"
				onChange={(value) => {
					setInput(value);
				}}
			/>
			<textarea
				value={input}
				onChange={(e) => setInput(e.target.value)}
			></textarea>
			<div>
				<button onClick={onClick}>Submit</button>
			</div>
			<iframe
				ref={iframeRef}
				sandbox="allow-scripts"
				srcDoc={html}
				title="preview"
			/>
		</div>
	);
};
/*
srcDoc 프로퍼티는 아이프레임에 내용들을 로드할 수 있게해준다 스트링값을 통해서 src와는 다르게.
allow-scripts를 써줌으로써 iFrame은 이제 script tag를 실행할 수 있게 해준다.
*/

ReactDOM.render(<App />, document.querySelector('#root'));
