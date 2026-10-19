import {
  Project,
  MethodDeclarationStructure,
  SourceFile,
  MethodDeclaration,
  SyntaxKind,
} from "ts-morph"

const generateBaseAPI = async (sourceFile: SourceFile) => {
  const classes = sourceFile.getClasses()
  const apiClasses = classes.filter(c => {
    const baseClass = c.getBaseClass()
    if (!baseClass) return false
    return baseClass.getName() === "BaseAPI"
  })

  // 重複を取り除く
  const apiMethods = new Map<string, MethodDeclaration>()
  for (const c of apiClasses) {
    const methods = c.getMethods()
    for (const m of methods) {
      apiMethods.set(m.getName(), m)
    }
  }

  sourceFile.addClass({
    name: "Apis",
    extends: "BaseAPI",
    methods: [...apiMethods.values()].map(
      m => m.getStructure() as MethodDeclarationStructure
    ),
    isExported: true
  })

  await sourceFile.save()
}

export default async function(generatedFolder: string) {
  const project = new Project()
  project.addSourceFilesAtPaths(`${generatedFolder}/**/*.ts`)

  // Use Promise<AxiosResponse<T>> to avoid Axios' non-exported types in declarations.
  const commonFile = project.getSourceFileOrThrow("common.ts")
  const request = commonFile.getVariableDeclarationOrThrow("createRequestFunction")
    .getInitializerIfKindOrThrow(SyntaxKind.FunctionExpression)
    .getFirstDescendantByKindOrThrow(SyntaxKind.ArrowFunction)
  request.getTypeParameterOrThrow("R").remove()
  request.setReturnType("Promise<AxiosResponse<T>>")
  const response = request.getFirstDescendantByKindOrThrow(SyntaxKind.ReturnStatement)
    .getExpressionOrThrow()
    .asKindOrThrow(SyntaxKind.CallExpression)
  response.removeTypeArgument(1)
  response.addTypeArgument("AxiosResponse<T>")
  await commonFile.save()

  const sourceFile = project.getSourceFileOrThrow("api.ts")

  await generateBaseAPI(sourceFile)
}
