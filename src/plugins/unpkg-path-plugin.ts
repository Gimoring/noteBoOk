import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localForage from 'localforage';

const fileCache = localForage.createInstance({
	name: 'filecache',
});

export const unpkgPathPlugin = (inputCode: string) => {
	return {
		name: 'unpkg-path-plugin', //debugging purpose
		setup(build: esbuild.PluginBuild) {
			// setup은 esbuild에 의해서 자동적으로 불러와질 것이다. 여기서 인자인 build는 번들링 프로세스를 의미한다.
			// 여기서 과정은 파일을 찾고, 이것을 불러오고, 파싱하고, 트랜스파일링하고, 각각 다른 파일들을 합쳐주는 것이다.

			/*
        한 마디로 우리가 만든 이 플러그인은 ESBuild가 하는 과정을 중단시키고 여기서 선언한 함수들이 실행된다.
        과정 1. onResolve는 entryPoint로 설정한 파일이 어디있는지 찾아낸다.
            2. ESBuild가 실행되는 도중에 우리의 코드가 중간에 개입해서 onLoad가 실행되고 onResolve에서 리턴된 path가 맞다면 객체를 리턴해준다.
            3. index.js 파일을 파싱하면서 import, require, exports 선언 들을 찾아낸다.
            4. 만약 있다면 다시 onResolve로 넘어가면서 저 선언된 파일들이 어디있는지 다시 찾아낸다.
            5. 다시 onLoad가 실행되면서 파일을 로드한다.  (1,2 가 반복된다.)
      */
			build.onResolve({ filter: /.*/ }, async (args: any) => {
				// 여기서 인자로 있는 filter는 우리가 실행해야 할 파일 이름을 뜻한다. js...ts...
				// 만약 build.onLoad({ filter: /.*/ , namespace: 'b' } 라고 쓰면
				// B라는 네임스페이스를 가진 파일들에게만 onLoad 함수가 작동될 것이다.
				console.log('onResolve', args);
				if (args.path === 'index.js') {
					return { path: args.path, namespace: 'a' };
				}

				/*
                args.path가 /sth 이런식으로 나올 경우. 
                우리가 원하는 args.path는 https://unpkg.com/sth/sth이다.
                하지만 이렇게 하면 https://unpkg.com/sth/otherDir/sthDir/utils.js 같이 폴더들이 섞일 경우
                찾을 수가 없다.
        if (args.path.includes('./') || args.path.includes('../')) {
          return { namespace: 'a', path: new URL(args.path, args.importer + '/').href,};
        }
        */

				// resolveDir를 이용하고 new URL 생성자 메소드를 이용해서  정확한 주소를 찾지 못하는 문제를 해결했다
				if (args.path.includes('./') || args.path.includes('../')) {
					return {
						namespace: 'a',
						path: new URL(
							args.path,
							'https://unpkg.com' + args.resolveDir + '/'
						).href,
					};
				}
				return {
					namespace: 'a',
					path: `https://unpkg.com/${args.path}`,
				};
			});

			build.onLoad({ filter: /.*/ }, async (args: any) => {
				console.log('onLoad', args);

				if (args.path === 'index.js') {
					return {
						loader: 'jsx',
						contents: inputCode,
					};
				}

				// 1. 이미 이 파일이 페치 되었는지, 이미 캐시되어져있는지 체크한다.

				const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
					args.path
				);

				// 2. 만약 이미 되어있다면 리턴 바로 해준다.
				if (cachedResult) {
					return cachedResult;
				}
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
