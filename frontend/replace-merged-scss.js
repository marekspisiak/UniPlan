const fs = require("fs");
const path = require("path");

// Koreňový adresár tvojho projektu
const rootDir =
  "C:/Users/marek/OneDrive - Žilinská univerzita v Žiline/Bakalarka/aplikacia/frontend";

// Súbor so zlúčenými SCSS
const mergedFile = path.join(__dirname, "merged-modules-final-polished.scss");

// Priečinok pre zálohy
const backupDir = path.join(__dirname, "scss-backup");
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

// Načítaj merge obsah
const lines = fs.readFileSync(mergedFile, "utf8").split("\n");

let currentPath = null;
let currentContent = [];

function flushContent() {
  if (!currentPath) return;

  const fullPath = path.join(rootDir, currentPath);
  if (!fs.existsSync(fullPath)) {
    console.warn("⚠️  Súbor neexistuje:", fullPath);
    return;
  }

  // zálohuj
  const backupPath = path.join(backupDir, currentPath);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(fullPath, backupPath);

  // prepíš nový obsah
  fs.writeFileSync(fullPath, currentContent.join("\n"), "utf8");
  console.log("✅ Prepísané:", currentPath);
}
for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed.startsWith("// src\\") || trimmed.startsWith("// src/")) {
    flushContent();
    currentPath = trimmed.replace("//", "").trim();
    currentPath = currentPath.replace(/\\\\/g, "/").replace(/\\/g, "/"); // normalize paths
    currentContent = [];
  } else {
    currentContent.push(line);
  }
}

// posledný blok
flushContent();
