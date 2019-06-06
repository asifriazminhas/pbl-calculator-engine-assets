import './app.css';
import React from 'react';
import Form from 'react-jsonschema-form';
require('codemirror/mode/javascript/javascript');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/xq-light.css';
import { UnControlled as CodeMirror } from 'react-codemirror2';
const schema = require('../../../json-schemas/model-config-schema.json');

export class App extends React.Component {
    render() {
        return (
            <div style={{ display: 'flex' }}>
                <div style={{ flexBasis: '50%', padding: 50 }}>
                    <Form schema={schema} />
                </div>
                <div style={{ flexBasis: '50%', padding: 50 }}>
                    <CodeMirror
                        options={{
                            them: 'xq-light',
                            mode: 'javascript',
                            lineNumbers: true,
                            json: true,
                            readOnly: true,
                        }}
                    />
                </div>
            </div>
        );
    }
}
