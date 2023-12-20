import React, { ReactElement } from "react";

export function parseCsvContent(content: string): ReactElement | undefined {
  const lines = content.split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return <div>No data found</div>;
  }

  const headers = lines[0].split("\t");
  const tableRows = lines.slice(1).map((line, index) => {
    const columns = line.split("\t");
    return (
      <tr key={index}>
        {columns.map((column, colIndex) => (
          <td
            className="border border-white/20 p-2 font-mono text-xs"
            key={colIndex}
          >
            {column}
          </td>
        ))}
      </tr>
    );
  });

  return (
    <table className="mt-0 w-full table-auto">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th
              className="border border-white/50 p-2 font-mono text-xs"
              key={index}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{tableRows}</tbody>
    </table>
  );
}
