#!/usr/bin/env node
import { promises as fs } from "fs";
import path from "path";
import process from "process";

const projectRoot = process.cwd();

async function readFileInfo(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split(/\r?\n/).length;
  return { lines, size: Buffer.byteLength(content, "utf-8") };
}

async function walk(dir, matcher) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(fullPath, matcher)));
    } else if (!matcher || matcher(fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

function formatNumber(value) {
  return value.toLocaleString("en-US");
}

async function reportForDirectory(relPath, matcher) {
  const target = path.join(projectRoot, relPath);
  try {
    const files = await walk(target, matcher);
    let totalLines = 0;
    let totalSize = 0;
    for (const file of files) {
      const info = await readFileInfo(file);
      totalLines += info.lines;
      totalSize += info.size;
    }
    return { section: relPath, files: files.length, lines: totalLines, size: totalSize };
  } catch {
    return { section: relPath, files: 0, lines: 0, size: 0 };
  }
}

function printTable(rows) {
  const header = ["Section", "Files", "Lines", "Size (KB)"];
  const data = rows.map((row) => [
    row.section,
    formatNumber(row.files),
    formatNumber(row.lines),
    (row.size / 1024).toFixed(1),
  ]);
  const table = [header, ...data];
  const widths = header.map((_, column) => Math.max(...table.map((row) => row[column].length)));
  const output = table
    .map((row, index) =>
      row
        .map((cell, column) => cell.padEnd(widths[column]))
        .join("  ") +
      (index === 0 ? "\n" + widths.map((w) => "-".repeat(w)).join("  ") : "")
    )
    .join("\n");
  console.log(output);
}

async function runMulti() {
  const sections = [
    { rel: "src/app", matcher: (file) => file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".json") },
    { rel: "src/lib", matcher: (file) => file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".json") },
    { rel: "src/messages", matcher: (file) => file.endsWith(".json") },
    { rel: "scripts", matcher: (file) => file.endsWith(".mjs") },
  ];
  const rows = [];
  for (const section of sections) {
    rows.push(await reportForDirectory(section.rel, section.matcher));
  }
  printTable(rows);
}

async function runSingle(targetPath) {
  const absolute = path.isAbsolute(targetPath) ? targetPath : path.join(projectRoot, targetPath);
  try {
    const info = await readFileInfo(absolute);
    console.log(`File: ${path.relative(projectRoot, absolute)}`);
    console.log(`Lines: ${info.lines}`);
    console.log(`Size: ${(info.size / 1024).toFixed(2)} KB`);
  } catch {
    console.error(`Cannot read file: ${targetPath}`);
    process.exitCode = 1;
  }
}

const args = process.argv.slice(2);
if (args.includes("--single")) {
  const index = args.indexOf("--single");
  const target = args[index + 1];
  if (!target) {
    console.error("Usage: node scripts/xray-lite.mjs --single <path/to/file>");
    process.exit(1);
  }
  await runSingle(target);
} else {
  await runMulti();
}
