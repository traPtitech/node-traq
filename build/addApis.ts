import {
  Project,
  MethodDeclarationStructure,
  SyntaxKind,
  ts,
  SourceFile
} from "ts-morph"
import "array-flat-polyfill"

const transformOneOf = async (sourceFile: SourceFile) => {
  const interfaceProps = sourceFile
    .getInterfaces()
    .flatMap(i => i.getProperties())

  for (const prop of interfaceProps) {
    const oneOfTypeNodes = prop
      .getChildrenOfKind(SyntaxKind.TypeReference)
      .concat(
        prop
          .getChildrenOfKind(SyntaxKind.JSDocComment)
          .flatMap(comment =>
            comment.getChildrenOfKind(SyntaxKind.JSDocTypeTag)
          )
          .flatMap(typeTag =>
            typeTag.getChildrenOfKind(SyntaxKind.JSDocTypeExpression)
          )
          .flatMap(exp => exp.getChildrenOfKind(SyntaxKind.TypeReference))
      )
      .filter(node => node.getText().startsWith("OneOf"))

    for (const node of oneOfTypeNodes) {
      node.transform(traversal => {
        const node = traversal.currentNode
        return ts.createUnionTypeNode(
          node
            .getText()
            .slice("OneOf".length)
            .split("Event")
            .map(typeName => ts.createTypeReferenceNode(`${typeName}Event`, undefined))
        )
      })
    }
  }
  await sourceFile.save()
}

const generateBaseAPI = async (sourceFile: SourceFile) => {
  const classes = sourceFile.getClasses()
  const apiClasses = classes.filter(c => {
    const baseClass = c.getBaseClass()
    if (!baseClass) return false
    return baseClass.getName() === "BaseAPI"
  })
  const apiMethods = apiClasses.map(c => c.getMethods()).flat()

  sourceFile.addClass({
    name: "Apis",
    extends: "BaseAPI",
    methods: apiMethods.map(
      m => m.getStructure() as MethodDeclarationStructure
    ),
    isExported: true
  })

  await sourceFile.save()
}

export default async function(generatedFolder: string) {
  const project = new Project()
  project.addSourceFilesAtPaths(`${generatedFolder}/**/*.ts`)

  const sourceFile = project.getSourceFileOrThrow("api.ts")

  await transformOneOf(sourceFile)
  await generateBaseAPI(sourceFile)
}
