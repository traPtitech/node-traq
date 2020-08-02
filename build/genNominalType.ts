import {
  SourceFile,
  ts,
  MethodDeclaration,
  PropertySignature,
  VariableDeclarationKind
} from "ts-morph"

const isArrayTypeName = (name: string) => name.endsWith('[]')

const getNominalTypeJsDocParameters = (method: MethodDeclaration) =>
  method
    .getJsDocs()
    .flatMap(doc => doc.getTags())
    .map(tag => tag.compilerNode)
    .filter(ts.isJSDocParameterTag)
    .filter(node => node.comment && /^&lt;&lt;\w+(?:\[\])?&gt;&gt;/.test(node.comment))

const rewriteMethodParamsToNominalType = async (sourceFile: SourceFile) => {
  const classes = sourceFile.getClasses()
  const apiClasses = classes.filter(c => {
    const baseClass = c.getBaseClass()
    if (!baseClass) return false
    return baseClass.getName() === "BaseAPI"
  })

  const apiMethods = apiClasses.flatMap(apiClass => apiClass.getMethods())

  const newNominalTypes = new Set<string>()

  apiMethods.forEach(method => {
    const nominalParamDocs = getNominalTypeJsDocParameters(method)

    nominalParamDocs.forEach(paramDoc => {
      const paramName = paramDoc.name.getText()
      const paramType = paramDoc.comment!.match(/^&lt;&lt;([\w]+(?:\[\])?)&gt;&gt;/)![1]

      if (isArrayTypeName(paramType)) {
        const itemParamType = paramType.slice(0, -2) // []を消す
        // 実際の引数の型を書き換え
        // TODO: nullable/optionalのためにstringを置き換える
        method.getParameter(paramName)!.setType(paramType)
        // TODO: JSDocの書き換え

        newNominalTypes.add(itemParamType)
      } else {
        // 実際の引数の型を書き換え
        // TODO: nullable/optionalのためにstringを置き換える
        method.getParameter(paramName)!.setType(paramType)
        // TODO: JSDocの書き換え

        newNominalTypes.add(paramType)
      }
    })
  })

  return newNominalTypes
}

const isNominalTypeJsDocProperty = (property: PropertySignature) =>
  property
    .getJsDocs()
    .map(doc => doc.getDescription().trim())
    .some(desc => /^<<\w+(?:\[\])?>>/.test(desc))

const rewriteInterfacePropertiesToNominalType = async (sourceFile: SourceFile) => {
  const interfaces = sourceFile.getInterfaces()
  const properties = interfaces.flatMap(interf => interf.getProperties())

  const newNominalTypes = new Set<string>()

  properties
    .filter(isNominalTypeJsDocProperty)
    .forEach(property => {
      const desc = property
        .getJsDocs()
        .map(doc => doc.getDescription().trim())
        .find(desc => /^<<\w+(?:\[\])?>>/.test(desc))
      const propType = desc!.match(/^<<(\w+(?:\[\])?)>>/)![1]

      if (isArrayTypeName(propType)) {
        const itemParamType = propType.slice(0, -2) // []を消す
        // 実際のプロパティの型を書き換え
        // TODO: nullable/optionalのためにstringを置き換える
        property.setType(propType)
        // TODO: JSDocの書き換え

        newNominalTypes.add(itemParamType)
      } else {
        // 実際のプロパティの型を書き換え
        // TODO: nullable/optionalのためにstringを置き換える
        property.setType(propType)
        // TODO: JSDocの書き換え

        newNominalTypes.add(propType)
      }
    })

  return newNominalTypes
}

const generateNominalTypes = async (sourceFile: SourceFile, nominalTypes: Set<string>) => {
  nominalTypes.forEach(type => {
    // declare const channel: unique symbol
    const symbolName = type.replace(/^(\w)(.+)Id$/, (m, c, n) => `$__${c.toLowerCase()}${n}__$`)
    sourceFile.addVariableStatement({
      hasDeclareKeyword: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        { name: symbolName, type: 'unique symbol' }
      ]
    })

    // export type ChannelId = string & { type: typeof channel }
    sourceFile.addTypeAlias({
      isExported: true,
      name: type,
      type: `string & { type: typeof ${symbolName} }`
    })
  })
}

export const rewriteToNominalType = async (sourceFile: SourceFile) => {
  const newNominalTypesFromParams = await rewriteMethodParamsToNominalType(sourceFile)
  const newNominalTypesFromProps = await rewriteInterfacePropertiesToNominalType(sourceFile)

  const newNominalTypes = new Set([...newNominalTypesFromParams, ...newNominalTypesFromProps])
  await generateNominalTypes(sourceFile, newNominalTypes)

  await sourceFile.save()
}
