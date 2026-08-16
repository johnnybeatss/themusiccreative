import "server-only";
import * as XLSX from "xlsx";

// Shared by every "Export to Excel" button in the E-Board hub. Callers are
// responsible for their own owner/admin auth check before calling this —
// Route Handlers aren't wrapped by the (protected) layout the way pages
// are, so that check has to happen inside each route.ts itself.
export function buildXlsxResponse(
  rows: Record<string, unknown>[],
  filename: string
): Response {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
