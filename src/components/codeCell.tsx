import { useState, useEffect } from 'react';
import CodeEditor from './code-editor';
import Preview from './preview';
import bundle from '../bundler';
import Resizable from './resizable';

const CodeCell = () => {
	const [code, setCode] = useState('');
	const [err, setErr] = useState('');
	const [input, setInput] = useState(''); // input

	useEffect(() => {
		const timer = setTimeout(async () => {
			const output = await bundle(input);
			setCode(output.code);
			setErr(output.err);
		}, 800);
		// 유저가 입력할 때마다 이전의 타이머는 없어지고 다시 시작해야 됨.
		// -> input이 변경될 때 마다 timer는 실행될 것임.
		// -> 변경 멈추면 2초 후에 timer가 시작됨. 그리고 timer를 clean시킴.
		return () => {
			// useEffect가 다시 실행 되면(input이 바뀌어서) 익명 함수가 자동으로 시작됨.
			clearTimeout(timer);
		};
	}, [input]);

	return (
		<Resizable direction="vertical">
			<div style={{ height: '100%', display: 'flex', flexDirection: 'row' }}>
				<Resizable direction="horizontal">
					<CodeEditor
						initialValue="//전설은 여기서부터 시작됨"
						onChange={(value) => {
							setInput(value);
						}}
					/>
				</Resizable>
				<Preview code={code} bundlingErr={err} />
			</div>
		</Resizable>
	);
};

export default CodeCell;
