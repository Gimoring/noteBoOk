import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
	name: 'filecache',
});

export const fetchPlugin = (inputCode: string) => {
	return {
		name: 'fetch-plugin',
		setup(build: esbuild.PluginBuild) {
			build.onLoad({ filter: /(^index\.js$)/ }, () => {
				return {
					loader: 'jsx',
					contents: inputCode,
				};
			});

			build.onLoad({ filter: /.*/ }, async (args: any) => {
				// 1. 이미 이 파일이 페치 되었는지, 이미 캐시되어져있는지 체크한다.
				const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
					args.path
				);
				// 2. 만약 이미 되어있다면 리턴 바로 해준다.
				if (cachedResult) {
					return cachedResult;
				}
				// 여기에 캐슁 되어져있는지 확인을 하면 다른 onLoad펑션이 실행되지 않는다. 만약 안되어져있다면 그대로 실행함.
			});

			// onload를 불러온다. 그리고 2번째 콜백함수를 등록해둔다. filter의 밸류가 같을경우 함수가 실행하며 리턴해준다.
			build.onLoad({ filter: /.css$/ }, async (args: any) => {
				const { data, request } = await axios.get(args.path);

				const escaped = data
					.replace(/\n/g, '')
					.replace(/"/g, '\\"')
					.replace(/'/g, "\\'");
				const contents = `
          const style = document.createEelement('style');
          style.innerText = '${escaped}';
          document.head.appendChild(style);
        `;

				const result: esbuild.OnLoadResult = {
					loader: 'jsx',
					contents,
					resolveDir: new URL('./', request.responseURL).pathname,
				};

				// 4. 캐시에 response를 저장해준다.
				await fileCache.setItem(args.path, result);

				return result;
			});

			build.onLoad({ filter: /.*/ }, async (args: any) => {
				// 3. 그렇지 않은 경우 -------------------
				const { data, request } = await axios.get(args.path);
				// args.path가 키가 되어준다.

				const result: esbuild.OnLoadResult = {
					loader: 'jsx',
					contents: data,
					resolveDir: new URL('./', request.responseURL).pathname, //where we found the original file -> where is THE DIRECTORY that we found xd
					// request.resonseURL => https://unpkg.com/pkgName/someOtherFolder/index.js
					// new URL.pathName => /pkgName/someOtherFolder/
					// new URL.href => https://unpkg.com/pkgName/someOtherFolder/
					// resolveDir => /pkgName/someOtherFolder
				};

				// 4. 캐시에 response를 저장해준다.
				await fileCache.setItem(args.path, result);

				return result;
			});
		},
	};
};
