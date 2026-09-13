/* =========================================================
   FORMATTERS

   Generic, presentation-agnostic formatting and export helpers.
   Moved out of Dashboard.jsx so they can be reused/tested on
   their own.
========================================================= */

/**
 * Triggers a browser download of the given text content.
 */
export function download(
  name,
  content,
  type = "text/csv"
) {
  const blob = new Blob([content], {
    type,
  });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = name;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

/**
 * Converts an array of flat objects into CSV text using the keys
 * of the first row as the header.
 */
export function csv(rows) {
  if (!rows || !rows.length) {
    return "";
  }

  const keys = Object.keys(rows[0]);

  return [
    keys.join(","),
    ...rows.map((row) =>
      keys
        .map(
          (key) =>
            `"${String(
              row[key] ?? ""
            ).replaceAll('"', '""')}"`
        )
        .join(",")
    ),
  ].join("\n");
}

/**
 * Returns the rounded average of the numeric values in the given
 * array, ignoring anything that isn't a finite number. Returns 0
 * for an empty or entirely non-numeric input.
 */
export function average(values) {
  const numbers = values
    .map(Number)
    .filter((value) =>
      Number.isFinite(value)
    );

  if (!numbers.length) {
    return 0;
  }

  return Math.round(
    numbers.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / numbers.length
  );
}
