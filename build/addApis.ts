import {
  Project,
  MethodDeclarationStructure,
  SourceFile,
  ts,
  ObjectLiteralExpression,
  PropertyAssignment,
  ExpressionStatement
} from "ts-morph"

const generateBaseAPI = async (sourceFile: SourceFile) => {
  const classes = sourceFile.getClasses()
  const apiClasses = classes.filter(c => {
    const baseClass = c.getBaseClass()
    if (!baseClass) return false
    return baseClass.getName() === "BaseAPI"
  })

  // 重複を取り除く
  const apiMethods = new Map()
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

const ignoreErrorWithDelete = async (sourceFile: SourceFile) => {
  const creatorFuncs = sourceFile
    .getVariableDeclarations()
    .filter(d => d.getName().endsWith('Creator'))

  const returns = creatorFuncs
    .map(d => d.getInitializerIfKindOrThrow(ts.SyntaxKind.FunctionExpression))
    .flatMap(f => f.getBody().getChildrenOfKind(ts.SyntaxKind.ReturnStatement))

  const properties = returns
    .map(r => r.getExpressionOrThrow())
    .filter((e): e is ObjectLiteralExpression =>
      e.getKind() === ts.SyntaxKind.ObjectLiteralExpression
    )
    .flatMap(o => o.getProperties())
    .filter((p): p is PropertyAssignment => p.getKind() === ts.SyntaxKind.PropertyAssignment)

  const deletes = properties
    .map(p => p.getInitializerIfKindOrThrow(ts.SyntaxKind.ArrowFunction))
    .flatMap(i => i.getBody().getChildrenOfKind(ts.SyntaxKind.ExpressionStatement))
    .flatMap(es => es.getChildrenOfKind(ts.SyntaxKind.DeleteExpression))

  deletes.forEach(d => {
    const i = d.getChildIndex()
    const parent = d.getParentIfKindOrThrow(ts.SyntaxKind.ExpressionStatement)
    parent.insertJsDoc(i, '@ts-ignore')
  })

  await sourceFile.save()
}

export default async function(generatedFolder: string) {
  const project = new Project()
  project.addSourceFilesAtPaths(`${generatedFolder}/**/*.ts`)

  const sourceFile = project.getSourceFileOrThrow("api.ts")

  await ignoreErrorWithDelete(sourceFile)
  await generateBaseAPI(sourceFile)
}
