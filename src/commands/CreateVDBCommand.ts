/**
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as utils from '../utils';
import * as extension from '../extension';
import { SchemaTreeNode } from '../model/tree/SchemaTreeNode';
import { IDVConfig } from '../model/DataVirtModel';

export function createVDBCommand() {
	if (extension.workspaceReady) {
		vscode.window.showInputBox( {validateInput: (name: string) => {
			let res: string = utils.validateName(name);
			if (!res) {
				// check if file already exists
				res = utils.validateFileNotExisting(name);
			}
			return res;
		}, placeHolder: "Enter the name of the new VDB config"})
			.then( (fileName: string) => {
				handleVDBCreation(vscode.workspace.rootPath, fileName)
					.then( (success: boolean) => {
						if (success) {
							let node: SchemaTreeNode = extension.dataVirtProvider.getSchemaTreeNodeOfProject(fileName);
							if (node) {
								vscode.commands.executeCommand('datavirt.edit.schema', node);
							}								
							vscode.window.showInformationMessage(`New VDB ${fileName} has been created successfully...`);
						} else {
							vscode.window.showErrorMessage(`An error occured when trying to create a new VDB...`);
						}
					});
			});
	} else {
		vscode.window.showErrorMessage(`DataVirt Tooling only works when a workspace folder is opened.` +
			` Please add a folder to the workspace with 'File->Add Folder to Workspace' or use the Command Palette (Ctrl+Shift+P) and type 'Add Folder'.` +
			` Once there is at least one folder in the workspace, please try again.`);
	}
}

function handleVDBCreation(filepath: string, fileName: string): Promise<boolean> {
	return new Promise<boolean>( (resolve, reject) => {
		if (fileName && fileName.length>0) {
			try {
				let templatePath = path.join(extension.pluginResourcesPath, "vdb_template.yaml");
				let targetFile: string = path.join(filepath, `${fileName}.yaml`);
				fs.copyFileSync(templatePath, targetFile);
				let yamlDoc:IDVConfig = utils.loadModelFromFile(targetFile);
				yamlDoc.metadata.name = fileName;
				utils.saveModelToFile(yamlDoc, targetFile);
				extension.dataVirtProvider.refresh();
				resolve(true);
			} catch (error) {
				extension.log(error);
				resolve(false);
			}
		} else {
			extension.log("handleVDBCreation: Unable to create the VDB because no name was given...");
			resolve(false);
		}		
	});
}