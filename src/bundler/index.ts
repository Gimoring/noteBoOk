import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';
import { fetchPlugin } from './plugins/fetch-plugin';

let service: esbuild.Service;

export default async function bundle(rawCode: string) {
	// esbuild-wasm <-- esbuild- web assembly
	// web assmebly를 브라우저에서 사용 할 수 있어야 한다.
	// 그래서 컴파일된 코드인 esbuild.wasm 파일을 public 폴더로 옮겨주었다.
	//service가 정의되어있지 않으면 한 번 해주셈.
	if (!service) {
		service = await esbuild.startService({
			worker: true,
			wasmURL: 'https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm', // compiled binary /public/esbuild.wasm
		});
	}

	/*
    window.postMessage() 메소드는 Window 오브젝트 사이에서 안전하게 cross-origin 통신을 할 수 있게 합니다. 
    예시로, 페이지와 생성된 팝업 간의 통신이나, 페이지와 페이지 안의 iframe 간의 통신에 사용할 수 있습니다.
  */

	const result = await service.build({
		entryPoints: ['index.js'],
		bundle: true,
		write: false,
		plugins: [unpkgPathPlugin(), fetchPlugin(rawCode)],
		define: {
			'process.env.NODE_ENV': '"production"', //process머시기를 : "production"으로 해준다.
			global: 'window', // 브라우저 안에서 코드 실행시키고 싶으면 이거 써야해용 이라고 구글신이 말해줌.
		},
	});

	return result.outputFiles[0].text;
}
