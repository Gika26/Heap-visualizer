import * as vscode from 'vscode';

import { BinaryHeap, HeapType } from './heap';


interface WebviewMessage {
    command: string;
    values?: string;
    value?: string;
    heapType?: string;
}


export function activate(context: vscode.ExtensionContext): void {

    let panel: vscode.WebviewPanel | undefined;

    const heap = new BinaryHeap('max');


    const command = vscode.commands.registerCommand(
        'heapVisualizer.open',
        () => {

            if (panel) {

                panel.reveal(vscode.ViewColumn.One);

                return;
            }


            panel = vscode.window.createWebviewPanel(
                'heapVisualizer',
                'Heap Visualizer',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );


            const currentPanel = panel;

            currentPanel.webview.html = getWebviewContent();


            currentPanel.onDidDispose(() => {
                panel = undefined;
            });


            currentPanel.webview.onDidReceiveMessage(
                (message: WebviewMessage) => {

                    try {

                        let note = '';

                        switch (message.command) {


                            case 'ready':

                                sendState(
                                    currentPanel,
                                    heap,
                                    'Ready to build a heap.'
                                );

                                return;


                            case 'build': {

                                const values = parseNumbers(
                                    message.values ?? ''
                                );

                                const type = parseHeapType(
                                    message.heapType
                                );

                                heap.setType(type);

                                heap.build(values);

                                note = 'Heap successfully built!';

                                break;
                            }


                            case 'insert': {

                                const value = parseSingleNumber(
                                    message.value ?? ''
                                );

                                heap.insert(value);

                                note = 'Element inserted: ' + value;

                                break;
                            }


                            case 'extract': {

                                const removed = heap.extractRoot();

                                note = 'Extracted: ' + removed;

                                break;
                            }


                            case 'changeType': {

                                const type = parseHeapType(
                                    message.heapType
                                );

                                heap.setType(type);

                                note = 'Heap type changed.';

                                break;
                            }


                            case 'clear': {

                                heap.clear();

                                note = 'Heap cleared.';

                                break;
                            }


                            default:

                                return;
                        }


                        sendState(
                            currentPanel,
                            heap,
                            note
                        );


                    } catch (error) {

                        const errorMessage = error instanceof Error
                            ? error.message
                            : 'Unexpected error.';

                        currentPanel.webview.postMessage({
                            type: 'error',
                            text: errorMessage
                        });
                    }

                }
            );

        }
    );


    context.subscriptions.push(command);
}


// Validates heap type.

function parseHeapType(value: string | undefined): HeapType {

    if (value !== 'max' && value !== 'min') {
        throw new Error('Invalid heap type.');
    }

    return value;
}


// Parses an array of integers.

function parseNumbers(input: string): number[] {

    const text = input.trim();

    if (text.length === 0) {
        throw new Error('Enter at least one number.');
    }

    const parts = text.split(/[\s,;]+/);

    if (parts.length > 127) {
        throw new Error('Maximum array size is 127 elements.');
    }

    return parts.map(part => parseSingleNumber(part));
}


// Validates a single integer.

function parseSingleNumber(input: string): number {

    const text = String(input).trim();

    if (!/^-?\d+$/.test(text)) {
        throw new Error('Please enter a valid integer.');
    }

    const number = Number(text);

    if (!Number.isSafeInteger(number)) {
        throw new Error('Number is outside the safe integer range.');
    }

    return number;
}


// Sends heap information to the interface.

function sendState(
    panel: vscode.WebviewPanel,
    heap: BinaryHeap,
    note: string
): void {

    panel.webview.postMessage({

        type: 'state',

        heap: heap.toArray(),

        heapType: heap.type,

        note: note

    });
}


// Generates a security nonce.

function getNonce(): string {

    let result = '';

    const characters =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 32; i++) {

        result += characters.charAt(
            Math.floor(Math.random() * characters.length)
        );
    }

    return result;
}


// Creates the plugin interface.

function getWebviewContent(): string {

    const nonce = getNonce();

    return `

    <!DOCTYPE html>

    <html lang="en">

    <head>

        <meta charset="UTF-8">

        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">

        <meta http-equiv="Content-Security-Policy"
              content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">

        <title>Heap Visualizer</title>


        <style>

            body {

                font-family: Arial, sans-serif;

                padding: 25px;

                color: var(--vscode-foreground);

                background: var(--vscode-editor-background);
            }


            h1 {
                margin-bottom: 5px;
            }


            .subtitle {

                opacity: 0.7;

                margin-bottom: 25px;
            }


            .controls {

                display: flex;

                flex-wrap: wrap;

                gap: 10px;

                margin-bottom: 20px;
            }


            input, select, button {

                padding: 10px;

                border-radius: 5px;

                border: 1px solid var(--vscode-input-border);

                background: var(--vscode-input-background);

                color: var(--vscode-input-foreground);

                font-size: 14px;
            }


            input {
                min-width: 150px;
            }


            button {

                cursor: pointer;

                background: var(--vscode-button-background);

                color: var(--vscode-button-foreground);

                border: none;
            }


            button:hover {

                background: var(--vscode-button-hoverBackground);
            }


            .section {

                margin-top: 25px;

                padding: 18px;

                border: 1px solid var(--vscode-panel-border);

                border-radius: 8px;
            }


            .array {

                font-size: 17px;

                word-break: break-word;

                padding: 12px;

                background: var(--vscode-textBlockQuote-background);

                border-radius: 5px;
            }


            .tree-container {
                overflow-x: auto;
                padding: 10px 0;
            }


            svg {

                display: block;

                margin: auto;
            }


            .status {

                margin-top: 15px;

                color: var(--vscode-textLink-foreground);

                min-height: 20px;
            }


            .error {
                color: var(--vscode-errorForeground);
            }

        </style>

    </head>


    <body>


        <h1>Heap Visualizer</h1>


        <div class="subtitle">
            Build and explore binary heaps
        </div>


        <div class="controls">

            <select id="heapType">

                <option value="max">Max-Heap</option>

                <option value="min">Min-Heap</option>

            </select>


            <input
                id="arrayInput"
                type="text"
                value="4 10 3 5 1"
                placeholder="Enter array"
            >


            <button id="buildButton">
                Build Heap
            </button>

        </div>


        <div class="controls">

            <input
                id="numberInput"
                type="number"
                placeholder="New number"
            >


            <button id="insertButton">
                Insert
            </button>


            <button id="extractButton">
                Extract Root
            </button>


            <button id="clearButton">
                Clear
            </button>

        </div>


        <div class="section">

            <h2>Array Representation</h2>


            <div class="array" id="arrayView">
                Heap is empty
            </div>


            <p>
                Elements:
                <strong id="count">0</strong>
            </p>

        </div>


        <div class="section">

            <h2>Tree Visualization</h2>


            <div class="tree-container">

                <svg id="tree"></svg>

            </div>

        </div>


        <div class="status" id="status"></div>



        <script nonce="${nonce}">


            const vscode = acquireVsCodeApi();


            const heapType = document.getElementById('heapType');

            const arrayInput = document.getElementById('arrayInput');

            const numberInput = document.getElementById('numberInput');

            const arrayView = document.getElementById('arrayView');

            const count = document.getElementById('count');

            const tree = document.getElementById('tree');

            const status = document.getElementById('status');



            // Build heap button.

            document.getElementById('buildButton')
                .addEventListener('click', () => {

                    vscode.postMessage({

                        command: 'build',

                        values: arrayInput.value,

                        heapType: heapType.value

                    });

                });



            // Insert button.

            document.getElementById('insertButton')
                .addEventListener('click', () => {

                    vscode.postMessage({

                        command: 'insert',

                        value: numberInput.value

                    });

                    numberInput.value = '';

                });



            // Extract root button.

            document.getElementById('extractButton')
                .addEventListener('click', () => {

                    vscode.postMessage({

                        command: 'extract'

                    });

                });



            // Clear button.

            document.getElementById('clearButton')
                .addEventListener('click', () => {

                    vscode.postMessage({

                        command: 'clear'

                    });

                });



            // Change heap type.

            heapType.addEventListener('change', () => {

                vscode.postMessage({

                    command: 'changeType',

                    heapType: heapType.value

                });

            });



            // Receive messages from the extension.

            window.addEventListener('message', event => {

                const message = event.data;


                if (message.type === 'state') {

                    renderHeap(message.heap);

                    heapType.value = message.heapType;

                    status.textContent = message.note || '';

                    status.className = 'status';

                }


                if (message.type === 'error') {

                    status.textContent = message.text;

                    status.className = 'status error';

                }

            });



            // Updates the array and tree.

            function renderHeap(values) {

                arrayView.textContent = values.length

                    ? '[ ' + values.join(', ') + ' ]'

                    : 'Heap is empty';


                count.textContent = values.length;


                drawTree(values);

            }



            // Draws the binary heap as a tree.

            function drawTree(values) {

                while (tree.firstChild) {

                    tree.removeChild(tree.firstChild);

                }


                const svgNS = 'http://www.w3.org/2000/svg';


                if (values.length === 0) {

                    tree.setAttribute('viewBox', '0 0 760 100');

                    tree.style.width = '760px';

                    tree.style.height = '100px';


                    const emptyText = document.createElementNS(
                        svgNS,
                        'text'
                    );


                    emptyText.setAttribute('x', '380');

                    emptyText.setAttribute('y', '55');

                    emptyText.setAttribute('text-anchor', 'middle');

                    emptyText.setAttribute('fill', 'currentColor');


                    emptyText.textContent = 'Heap is empty';


                    tree.appendChild(emptyText);

                    return;

                }



                const levels = Math.floor(
                    Math.log2(values.length)
                ) + 1;


                const width = Math.max(
                    760,
                    Math.pow(2, levels - 1) * 100
                );


                const height = levels * 105 + 30;


                tree.setAttribute(
                    'viewBox',
                    '0 0 ' + width + ' ' + height
                );


                tree.style.width = width + 'px';

                tree.style.height = height + 'px';



                const positions = [];



                // Calculate node positions.

                for (let i = 0; i < values.length; i++) {

                    const level = Math.floor(
                        Math.log2(i + 1)
                    );


                    const first = Math.pow(2, level) - 1;


                    const position = i - first;


                    const nodesOnLevel = Math.pow(2, level);


                    const x = width * (position + 1) /
                        (nodesOnLevel + 1);


                    const y = 50 + level * 100;


                    positions.push({
                        x: x,
                        y: y
                    });

                }



                // Draw connections.

                for (let i = 1; i < values.length; i++) {

                    const parent = Math.floor((i - 1) / 2);


                    const line = document.createElementNS(
                        svgNS,
                        'line'
                    );


                    line.setAttribute(
                        'x1',
                        positions[parent].x
                    );


                    line.setAttribute(
                        'y1',
                        positions[parent].y + 24
                    );


                    line.setAttribute(
                        'x2',
                        positions[i].x
                    );


                    line.setAttribute(
                        'y2',
                        positions[i].y - 24
                    );


                    line.setAttribute(
                        'stroke',
                        'currentColor'
                    );


                    line.setAttribute(
                        'stroke-width',
                        '2'
                    );


                    tree.appendChild(line);

                }



                // Draw nodes.

                for (let i = 0; i < values.length; i++) {

                    const circle = document.createElementNS(
                        svgNS,
                        'circle'
                    );


                    circle.setAttribute(
                        'cx',
                        positions[i].x
                    );


                    circle.setAttribute(
                        'cy',
                        positions[i].y
                    );


                    circle.setAttribute('r', '24');

                    circle.setAttribute('fill', '#2563eb');


                    tree.appendChild(circle);



                    const text = document.createElementNS(
                        svgNS,
                        'text'
                    );


                    text.setAttribute(
                        'x',
                        positions[i].x
                    );


                    text.setAttribute(
                        'y',
                        positions[i].y
                    );


                    text.setAttribute(
                        'text-anchor',
                        'middle'
                    );


                    text.setAttribute(
                        'dominant-baseline',
                        'middle'
                    );


                    text.setAttribute(
                        'fill',
                        '#ffffff'
                    );


                    text.setAttribute(
                        'font-size',
                        '15'
                    );


                    text.setAttribute(
                        'font-weight',
                        'bold'
                    );


                    text.textContent = values[i];


                    tree.appendChild(text);

                }

            }


            // Notify the extension that the interface is ready.

            vscode.postMessage({
                command: 'ready'
            });


        </script>


    </body>

    </html>

    `;
}


// Called when the extension is deactivated.

export function deactivate(): void {}