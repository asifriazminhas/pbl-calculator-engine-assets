import './app.css';
import React from 'react';
import Form from 'react-jsonschema-form';
require('codemirror/mode/javascript/javascript');
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/solarized.css';
import { UnControlled as CodeMirror } from 'react-codemirror2';
const schema = require('../../../../json-schemas/model-config-schema.json');
const reactJsonSchemaUiConfig = require('../../../config/form-ui-config.json');

interface IAppState {
    modelConfig: { [index: string]: any };
}

export class App extends React.Component<{}, IAppState> {
    constructor(props: {}) {
        super(props);

        this.state = {
            modelConfig: {},
        };
    }

    render() {
        return (
            <div style={{ display: 'flex' }}>
                <div style={{ flex: '1 1 50%', padding: 50 }}>
                    <Form
                        schema={schema}
                        uiSchema={reactJsonSchemaUiConfig}
                        formData={this.state.modelConfig}
                        onSubmit={event => {
                            this.setState({
                                modelConfig: event.formData,
                            });
                        }}
                    />
                </div>
                <div style={{ flex: '1 1 50%', padding: 50 }}>
                    <CodeMirror
                        value={JSON.stringify(this.state.modelConfig, null, 4)}
                        options={{
                            them: 'solarized',
                            mode: 'javascript',
                            lineNumbers: true,
                            json: true,
                            readOnly: true,
                            lineWrapping: true,
                        }}
                    />
                </div>
            </div>
        );
    }
}
