const { createObjectCsvStringifier } = require("csv-writer");

function toCSV(rows, headers) {
  const csv = createObjectCsvStringifier({ header: headers });
  return csv.getHeaderString() + csv.stringifyRecords(rows);
}

module.exports = { toCSV };
