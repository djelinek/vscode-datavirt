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
import * as utils from '../utils';
import * as extension from '../extension';
import { IDVConfig, IDataSourceConfig } from '../model/DataVirtModel';

export function createDataSourceCommand(ctx) {
	vscode.window.showInputBox( {validateInput: utils.validateName, placeHolder: "Enter the name of the new datasource"})
		.then( async (dsName: string) => {
			await vscode.window.showQuickPick( Array.from(extension.DATASOURCE_TYPES.keys()), {canPickMany: false, placeHolder: "Select the datasource type" })
				.then( (dsType: string) => {
					handleDataSourceCreation(ctx, dsName, dsType)
						.then( (success: boolean) => {
							if (success) {
								vscode.window.showInformationMessage(`New datasource ${dsName} has been created successfully...`);
							} else {
								vscode.window.showErrorMessage(`An error occured when trying to create a new datasource...`);
							}
						});
				});
		});
}

function handleDataSourceCreation(ctx, dsName: string, dsType: string): Promise<boolean> {
	return new Promise<boolean>( (resolve) => {
		if (dsName && dsType) {
			try {
				let yaml: IDVConfig = ctx.getProject().dvConfig;
				if (yaml) {
					let dsConfig: IDataSourceConfig = extension.DATASOURCE_TYPES.get(dsType);
					dsConfig = utils.replaceTemplateName(dsConfig, dsName.toUpperCase(), extension.TEMPLATE_NAME);
					utils.mapDSConfigToEnv(dsConfig, yaml);
					utils.saveModelToFile(yaml, ctx.getProject().getFile());
					extension.dataVirtProvider.refresh();
					resolve(true);
				} else {
					resolve(false);
				}				
			} catch (error) {
				extension.log(error);
				resolve(false);
			}
		} else {
			extension.log("handleDataSourceCreation: Unable to create the datasource because no name and type were given...");
			resolve(false);
		}		
	});
}
