const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const sourceDir = 'ts';
const outputDir = 'js';

// Get the absolute paths of source and output directories
const sourcePath = path.join(__dirname, sourceDir);
const outputPath = path.join(__dirname, outputDir);

// Read all TypeScript files in the source directory
fs.readdir(sourcePath, (err, files) => {
  if (err) {
    console.error('Error reading directory:', err);
    return;
  }

  // Filter the TypeScript files
  const tsFiles = files.filter((file) => path.extname(file) === '.ts');

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath);
  }

  // Build and execute the tsc command for each TypeScript file
  tsFiles.forEach((file) => {
    const inputFilePath = path.join(sourcePath, file);
    const outputFilePath = path.join(outputPath, file.replace('.ts', '.js'));
    const command = `tsc ${inputFilePath} --outFile ${outputFilePath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error occurred while compiling ${file}: ${error.message}`);
        return;
      }

      if (stderr) {
        console.error(`Error occurred while compiling ${file}: ${stderr}`);
        return;
      }

      console.log(`Successfully compiled ${file} to JavaScript.`);
    });
  });
});