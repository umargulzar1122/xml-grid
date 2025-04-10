import axios from "axios";
import { BuildConfiguration } from "./types/BuildConfiguration";
import { JSONObject } from "./types/JSONObject";
const _baseUrl = "https://org75277f5b.crm4.dynamics.com";

export const getBuildConfiguration = (): BuildConfiguration => {
	if (window.location.hostname.includes("localhost")) {
		return BuildConfiguration.debug;
	}
	return BuildConfiguration.release;
}

const getAccessToken = () => {
	return new Promise((resolve, reject) => {
		(async () => {
			const res = await axios.get('https://prod-35.westeurope.logic.azure.com:443/workflows/c3d67a67a35f4a33aa0fe5865e207f64/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=5SA0R69rNmgHFmlI93lXD_i12VDE02Lhe5V5NQlEu9E')
			return resolve(res.data.access_token)
		})()
	})
}

export const getEntityAttribute = (logicalName: string) => {
	return new Promise((resolve, reject) => {
		(async () => {
			try {
				const headers = {} as any;
				if (getBuildConfiguration() === BuildConfiguration.debug) {
					const accessToken = await getAccessToken();
					headers["Authorization"] = `Bearer ${accessToken}`;
				}
				const result = ((await axios.get(`${_baseUrl}/api/data/v9.2/EntityDefinitions(LogicalName='${logicalName}')/Attributes`, { headers: headers })).data).value;
				resolve((result));
			} catch (error) {
				console.error("getEntities", { error })
				reject(error)
			}
		})()
	})
}

const extractAttributes = (entity: any, tableHeaders: Array<JSONObject>, linkEntity: boolean = false) => {
	const attributes = entity.children;
	attributes.forEach((att: JSONObject) => {
		if (att.attribute) {
			tableHeaders.push({ ...att.attribute, linkEntity, entity: entity.name ?? "", alias: entity.alias })
		}
		if (att["link-entity"]) {
			extractAttributes(att["link-entity"], tableHeaders, true)
		}
	});
	return tableHeaders;
}

const getEntityAttributes = (headers: Array<JSONObject>) => {
	return new Promise((resolve, reject) => {
		const groupedByName = headers.reduce((acc, item) => {
			acc[item.entity] = acc[item.entity] || [];
			acc[item.entity].push(item);
			return acc;
		}, {});
		(async () => {
			let data: Array<any> = [];
			for (const [key, value] of Object.entries(groupedByName)) {
				const res = await getEntityAttribute(key);
				data = data.concat(res);
			}
			resolve(data);
		})()
	})
}

export const getTableHeaders = (json: JSONObject) => {
	return new Promise((resolve, reject) => {
		console.log(json);
		let tableHeaders = [] as Array<JSONObject>;
		let _entity = null;
		if (json.fetch) {
			if (json.fetch.children && json.fetch.children.length > 0) {
				const children = json.fetch.children[0];
				if (children) {
					const entity = children.entity;
					if (entity) {
						if (entity.name) {
							_entity = entity.name;
						}
						tableHeaders = extractAttributes(entity, tableHeaders);
					}
				}
			}
		}
		(async () => {
			const _entityAttributes = [] as Array<JSONObject>;
			const _attributes = (await getEntityAttributes(tableHeaders) as Array<JSONObject>).filter(s => s.DisplayName.UserLocalizedLabel);
			_attributes.forEach(_att => {
				const isFound = tableHeaders.find((s: JSONObject) => s.name === _att.LogicalName && _att.EntityLogicalName === s.entity);
				if (isFound) {
					_entityAttributes.push(
						{
							key: _att.LogicalName,
							displayName: _att.DisplayName.UserLocalizedLabel!.Label,
							type: _att.AttributeType,
							isPrimary: _att.IsPrimaryId,
							isPrimaryName: _att.IsPrimaryName,
							LogicalName: _att.LogicalName,
							SchemaName: _att.SchemaName,
							alias: isFound.alias,
							linkEntity: isFound.linkEntity,
						}
					)
				}
			})
			resolve({ _entityAttributes, _entity })
		})()
	})
}

export const getEntityMetaData = (entity: string) => {
	return new Promise((resolve, reject) => {
		(async () => {
			try {
				const headers = {} as any;
				if (getBuildConfiguration() === BuildConfiguration.debug) {
					const accessToken = await getAccessToken();
					headers["Authorization"] = `Bearer ${accessToken}`;
				}
				const entities = ((await axios.get(`https://org75277f5b.crm4.dynamics.com/api/data/v9.1/EntityDefinitions?$select=LogicalName,DisplayName,EntitySetName,LogicalCollectionName&$filter=LogicalName eq '${entity}'`, {
					headers: {
						...headers
					}
				})).data).value as any;
				const result = entities.filter((entity: any) => entity.DisplayName.LocalizedLabels.length > 0).map((entity: any) => {
					return {
						DisplayName: entity.DisplayName.LocalizedLabels[0].Label,
						LogicalName: entity.LogicalName,
						LogicalCollectionName: entity.LogicalCollectionName
					} as any
				}) as Array<JSONObject>
				resolve(result[0]);
			} catch (error) {
				console.error("getEntities", { error })
				reject([])
			}
		})()
	})
}

export const getData = (fetchXML: string, entity: string) => {
	return new Promise((resolve, reject) => {
		(async () => {
			try {
				const headers = {
					"OData-MaxVersion": "4.0",
					"OData-Version": "4.0",
					"Content-Type": "application/json; charset=utf-8",
					"Accept": "application/json",
					"Prefer": "odata.include-annotations=*"
				} as JSONObject;
				if (getBuildConfiguration() === BuildConfiguration.debug) {
					const accessToken = await getAccessToken();
					headers["Authorization"] = `Bearer ${accessToken}`;
				}
				const encodedFetchXML = encodeURIComponent(fetchXML);
				const data = ((await axios.get(`https://org75277f5b.crm4.dynamics.com/api/data/v9.1/${entity}?fetchXml=${encodedFetchXML}`, {
					headers: {
						...headers
					}
				})).data).value as Array<JSONObject>;
				resolve(data);
			} catch (error) {
				console.error("getEntities", { error })
				reject([])
			}
		})()
	})
}