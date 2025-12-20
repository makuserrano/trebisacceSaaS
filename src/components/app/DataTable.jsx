export default function DataTable({ columns, rows }) {
  return (
    <div className="app-surface">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={alignClass(col.align)}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id ?? index}>
              {row.cells.map((cell, cellIndex) => (
                <td key={cellIndex} className={alignClass(columns[cellIndex]?.align)}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function alignClass(align) {
  if (align === 'center') return 'is-center';
  if (align === 'right') return 'is-right';
  return '';
}
