import MDEditor from '@uiw/react-md-editor';
import { useState, useEffect, useRef } from 'react';
import './text-editor.css';

const TextEditor: React.FC = () => {
	const ref = useRef<HTMLDivElement | null>(null);
	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState<string | undefined>('# Header');

	useEffect(() => {
		const listener = (event: MouseEvent) => {
			if (
				ref.current &&
				event.target &&
				ref.current.contains(event.target as Node)
			) {
				return;
			}
			setEditing(false);
		};
		document.addEventListener('click', listener, { capture: true });

		return () => {
			document.removeEventListener('click', listener, { capture: true });
		};
	}, []);

	if (editing) {
		return (
			<div ref={ref} className="text-editor">
				<MDEditor
					tabSize={2}
					value={value}
					onChange={(v) => {
						setValue(v);
					}}
				/>
			</div>
		);
	}

	return (
		<div
			onClick={() => setEditing(true)}
			className="text-editor mx-auto px-8 py-8 mt-5 bg-blue-400 rounded-lg	"
		>
			<MDEditor.Markdown source={value} />
		</div>
	);
};

export default TextEditor;
