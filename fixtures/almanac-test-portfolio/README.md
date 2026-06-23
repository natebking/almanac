# Almanac Test Portfolio Fixtures

sample data only. These files are intentionally fake and are safe for local,
demo, and open-source testing.

These files are fake property-management records for testing Almanac without
real tenant, owner, vendor, or property information.

Use them in one of two ways:

1. Upload this folder structure into Google Drive as `Almanac Test Portfolio`.
2. Use `master-spreadsheet.csv` to create the `Almanac Test Master Spreadsheet`
   with a tab named `Rentals`.

The folder layout mirrors a common property-management Drive structure:

```text
Almanac Test Portfolio/
  master-spreadsheet.csv
  Templates/
  Loch Lomand/
  Verona/
  St. Paul/
  Wood Court/
  Estates/
```

The files are intentionally plain Markdown and CSV so they can be opened,
copied into Google Docs, or converted into Google Docs after upload. Almanac
indexes Markdown files during Drive sync, so uploading this folder as-is is
enough for the dummy search and assistant tests.
