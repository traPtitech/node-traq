import {
  SourceFile,
  ts,
  MethodDeclaration,
  PropertySignature,
  VariableDeclarationKind,
  ParameterDeclaration,
  Type
} from "ts-morph"

const isArrayTypeName = (name: string) => name.endsWith('[]')

const stringifyName = (node: ParameterDeclaration | PropertySignature) =>
  `${node.getParent().getSymbol()?.getName()}内の${node.getSymbol()?.getName()}`

const isStringArray = (type: Type<ts.Type>) =>
  type.isArray() && type.getArrayElementType()?.isString()

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

      const param = method.getParameter(paramName)!

      if (isArrayTypeName(paramType)) {
        // nullableは対応してない
        if (!isStringArray(param.getType())) {
          throw new Error(`${stringifyName(param)}がstring[]でないのにstring[]の型に指定しています。`)
        }

        const itemParamType = paramType.slice(0, -2) // []を消す
        // 実際の引数の型を書き換え
        param.setType(paramType)
        // TODO: JSDocの書き換え

        newNominalTypes.add(itemParamType)
      } else {
        if (!param.getType().isString()) {
          throw new Error(`${stringifyName(param)}がstringでないのにstringの型に指定しています。`)
        }

        // 実際の引数の型を書き換え
        param.setType(paramType)
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

      // optionalは`?`がついたままなので処理をしなくても問題ない

      if (isArrayTypeName(propType)) {
        if (!isStringArray(property.getType())) {
          throw new Error(`${stringifyName(property)}がstring[]でないのにstring[]の型に指定しています。`)
        }

        const itemParamType = propType.slice(0, -2) // []を消す
        // 実際のプロパティの型を書き換え
        const beforeType = property.getTypeNode()!.getText()
        property.setType(beforeType.replace('string', propType))
        // TODO: JSDocの書き換え

        newNominalTypes.add(itemParamType)
      } else {
        if (!property.getType().isString()) {
          throw new Error(`${stringifyName(property)}がstringでないのにstringの型に指定しています。`)
        }

        // 実際のプロパティの型を書き換え
        const beforeType = property.getTypeNode()!.getText()
        property.setType(beforeType.replace('string', propType))
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
  try {
    const newNominalTypesFromParams = await rewriteMethodParamsToNominalType(sourceFile)
    const newNominalTypesFromProps = await rewriteInterfacePropertiesToNominalType(sourceFile)

    const newNominalTypes = new Set([...newNominalTypesFromParams, ...newNominalTypesFromProps])
    await generateNominalTypes(sourceFile, newNominalTypes)

    await sourceFile.save()
  } catch (e) {
    console.error(e)
  }
}
