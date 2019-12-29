import {
  Project,
  MethodDeclarationStructure,
  SourceFile
} from "ts-morph"
import "array-flat-polyfill"

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

  await generateBaseAPI(sourceFile)
}
