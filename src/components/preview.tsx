import { useEffect, useRef } from 'react';
import './preview.css';

interface PreviewProps {
	code: string;
}

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

const Preview: React.FC<PreviewProps> = ({ code }) => {
	const iframeRef = useRef<any>();

	useEffect(() => {
		iframeRef.current.srcdoc = html; //iframe 내용에 html을 추가.
		// postMessage하고나서 빠른 시간 내에 바로 srcdoc을 html으로 설정해버려서 셋타임아웃을 설정했다.
		setTimeout(() => {
			//contentWindow는 iframe의 window object이다.
			iframeRef.current.contentWindow.postMessage(code, '*'); // 조금의 시간 뒤에 iframe에 code 내용 추가.
		}, 50);
	}, [code]);

	/*
srcDoc 프로퍼티는 아이프레임에 내용들을 로드할 수 있게해준다 스트링값을 통해서 src와는 다르게.
allow-scripts를 써줌으로써 iFrame은 이제 script tag를 실행할 수 있게 해준다.
*/
	return (
		<div className="preview-wrapper">
			<iframe
				ref={iframeRef}
				sandbox="allow-scripts"
				srcDoc={html}
				title="preview"
			/>
		</div>
	);
};

export default Preview;
