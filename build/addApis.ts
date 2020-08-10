import {
  Project,
  MethodDeclarationStructure,
  SourceFile
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

export default async function(generatedFolder: string) {
  const project = new Project()
  project.addSourceFilesAtPaths(`${generatedFolder}/**/*.ts`)

  const sourceFile = project.getSourceFileOrThrow("api.ts")

  await generateBaseAPI(sourceFile)
}
