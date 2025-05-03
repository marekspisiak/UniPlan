// mergeModules.js
const fs = require("fs");
const path = require("path");

const rootDir = "./src"; // priečinok kde máš SCSS moduly
const output = "./merged-modules.scss";

function findModuleFiles(dir) {
  let files = [];

  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      files = files.concat(findModuleFiles(fullPath));
    } else if (file.endsWith(".module.scss")) {
      files.push(fullPath);
    }
  });

  return files;
}

const moduleFiles = findModuleFiles(rootDir);
const mergedContent = moduleFiles
  .map((file) => `// ${file}\n` + fs.readFileSync(file, "utf-8"))
  .join("\n\n");

fs.writeFileSync(output, mergedContent);

console.log(`✅ Merged ${moduleFiles.length} files into ${output}`);
