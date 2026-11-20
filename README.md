# Atelye Mim Mimarlık · Proje Arşivi

A standalone Turkish-language archive with compact list and photo-grid views. Both views use the same data. Project codes (`AMM-00001`, etc.) are assigned once and survive changes to title, year or type.

## Google Drive synchronization

The workbook on Google Drive is an Excel file. Keep it private and share it as Viewer with a Google Cloud service account that has the Drive API enabled. Add the service-account credential JSON as a GitHub Actions repository secret named `GOOGLE_DRIVE_SERVICE_ACCOUNT` in repository Settings. Keep credentials out of the repository.

In the Drive workbook, add the `Web Arşivi` tab from the pilot workbook. Review what may be public, including client, area and image data. Set `Yayın Durumu` to `Yayında` for each approved entry. The importer exports only fields shown on the website from these rows. The artwork grid displays approved projects with a cover image.

Under Settings → Pages, set the source to GitHub Actions. The workflow publishes on pushes to main and refreshes the site daily or on manual dispatch. Until a secret is configured, the site shows six projects already public on the practice site. After configuration, a failed Drive import stops deployment, preserving the previous site. An approved tab with zero published rows intentionally produces an empty archive.
