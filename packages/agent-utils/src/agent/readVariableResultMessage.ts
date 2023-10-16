export function readVariableResultMessage(varName: string, value: string | undefined, start: number, count: number, maxVarLength: number) {
  if (!value || value === "\"undefined\"") {
    return `Variable \${${varName}} is undefined`;
  }
  else {
    let warn = "";
    if (count > maxVarLength) {
      warn = `Warning: maximum read length is ${maxVarLength} bytes, result will be shortened.`;
    }
    const cnt = Math.min(count, maxVarLength);
    const end = Math.min(start + cnt, value.length);
    const val = value.substring(start, end);
    return `${warn}\nReading ${start}-${end} bytes of variable \${${varName}} (length ${value.length}):\n\`\`\`\n${val}...\n\`\`\``;
  }
}
