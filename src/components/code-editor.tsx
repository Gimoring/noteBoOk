import React, { useRef } from 'react';
import MonacoEditor, { OnChange, OnMount } from '@monaco-editor/react';
import prettier from 'prettier';
import parser from 'prettier/parser-babel';
import './code-editor.css';
import './syntax.css';
import codeShift from 'jscodeshift';
import Highlighter from 'monaco-jsx-highlighter';

interface CodeEditorProps {
	initialValue: string;
	onChange(value: string): void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ initialValue, onChange }) => {
	const editorRef = useRef<any>();

	const handleEditorDidMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		editor.getModel()?.updateOptions({ tabSize: 2 });

		const highlighter = new Highlighter(
			// @ts-ignore
			window.monaco,
			codeShift,
			editor
		);
		highlighter.highLightOnDidChangeModelContent(
			() => {},
			() => {},
			undefined,
			() => {}
		);
	};

	const onGetValue: OnChange = (value, event) => {
		if (!value) {
			return;
		}
		onChange(value);
	};

	const onFormatClick = () => {
		// 1. 에디터의 현재 값을 가져온다.
		const unformattedCode = editorRef.current.getModel().getValue();
		// 2. 값을 포매팅 해준다.
		const formattedCode = prettier
			.format(unformattedCode, {
				parser: 'babel',
				plugins: [parser],
				useTabs: false,
				semi: true,
				singleQuote: true,
			})
			.replace(/\n$/, '');
		// 3. 이쁘게 해준 코드들을 다시 에디터에 세팅해준다.
		editorRef.current.setValue(formattedCode);
	};

	return (
		<div className="editor-wrapper">
			<button className="prettyButton" onClick={onFormatClick}>
				이쁘게 하기!
			</button>
			<MonacoEditor
				onMount={handleEditorDidMount}
				onChange={onGetValue}
				value={initialValue}
				language="javascript"
				height="100%"
				theme="vs-dark"
				options={{
					wordWrap: 'on',
					minimap: { enabled: false },
					showUnused: false,
					folding: false,
					lineNumbersMinChars: 3,
					fontSize: 20,
					scrollBeyondLastLine: false,
					automaticLayout: true,
				}}
			/>
		</div>
	);
};

export default CodeEditor;
