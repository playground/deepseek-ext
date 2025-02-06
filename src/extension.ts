// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';
import path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "deepseek-ext" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('deepseek-ext.start', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		const panel = vscode.window.createWebviewPanel(
			'deepChat', 'Deep Seek Chat', vscode.ViewColumn.One, {enableScripts: true}
		);
		const imagePath = vscode.Uri.file(
			path.join(context.extensionPath, 'media', 'deepseek.png')
		);
		const imageUri = panel.webview.asWebviewUri(imagePath);
		panel.webview.html = getWebviewContent(imageUri);
		panel.webview.onDidReceiveMessage(async(message: any) => {
			if(message.command === 'chat') {
				console.log('got', message.text);
				const userPrompt = message.text;
				let responseText = '';
				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:8b',
						messages: [{ role: 'user', content: userPrompt}],
						stream: true
					});

					for await(const part of streamResponse) {
						responseText += part.message.content;
						panel.webview.postMessage({
							command: 'chatResponse',
							text: responseText
						});
					}
				} catch(e) {
					panel.webview.postMessage({
						command: 'chatResponse',
						text: `Error: ${String(e)}`
					});
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(imageUri: any) {
	return /*html*/`
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8" />
				<style>
					body { font-family: sans-serif; margin: 1rem; }
					#prompt { width: 100%; box-sizing: border-box; }
					#response {border: 1px solid #ccc; margin-top: 1rem; padding: 0.5rem; min-height: 1rem; }
					.right-align-button {
						display: flex;
						align-items: flex-end;
						justify-content: flex-end;
						float: right;
						padding: 10px;
						gap: 5px;
						border: 1px solid #ccc;
						cursor: pointer;
						background-color: #f0f0f0;
					}
					.flex-container {
						display: flex;
						flex-direction: row;
						float: right;
					}
					.response {
						margin-top: 2.6rem !important;
					}
				</style>
			</head>
			<body>
				<h2>DeepSeek VS Code Extension</h2>
				<textarea id="prompt" rows="3" placeholder="Ask me anything"></textarea><br />
				<div class="flex-container">
					<select name="models" id="models">
						<option value="deepseek-r1:8b" selected>deepseek-r1:8b</option>
						<option value="deepseek-r1:latest">deepseek-r1:latest</option>
						<option value="llama3.2">llama3.2</option>
					</select>
					<button id="askBtn" class="right-align-button">
						<img src="${imageUri}" alt="" style="flex: 1;" width="15" height="15">
						<span class="content-wrapper">Deep Ask</span>
					</button>
				</div>
				<div id="response" class="response"></div>
				
				<script>
					const vscode = acquireVsCodeApi();

					window.addEventListener('DOMContentLoaded', () => {
            console.log("Webview fully loaded, listening for messages.");
						const askBtn = document.getElementById('askBtn');
						const prompt = document.getElementById('prompt');
						const model = document.getElementById('model');
						askBtn.addEventListener('click', () => {
							const text = prompt.value;
							const selectedModel = model.options[model.selectedIndex].value;
							console.log('asking: ', text);
							vscode.postMessage({ command: 'chat', text: text, model: selectedModel });
						});

						window.addEventListener('message', event => {
							const {command, text} = event.data;
							if(command === 'chatResponse') {
								document.getElementById('response').innerText = text;
							}
						});
					});
				</script>
			</body>
		</html>
	`;
}


// This method is called when your extension is deactivated
export function deactivate() {}
