import ReactDOM from 'react-dom';
// import CodeCell from './components/codeCell';
import './index.css';
import TextEditor from './components/text-editor';

const App = () => {
	return (
		<>
			{/* <CodeCell /> */}
			<TextEditor />
		</>
	);
};
/*
srcDoc 프로퍼티는 아이프레임에 내용들을 로드할 수 있게해준다 스트링값을 통해서 src와는 다르게.
allow-scripts를 써줌으로써 iFrame은 이제 script tag를 실행할 수 있게 해준다.
*/

ReactDOM.render(<App />, document.querySelector('#root'));
