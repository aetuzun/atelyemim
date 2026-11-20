"""Export the approved public archive from the Excel file stored in Google Drive."""
import argparse
import io
import json
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

from openpyxl import load_workbook

DRIVE_FILE = '1-StpqXgAEjvyTNriv9c7_dxjA8tOF7vG'
TAB = 'Web Arşivi'
REQUIRED = ('Proje Kodu', 'Proje Adı', 'Yıl', 'Tipoloji', 'Konum', 'İşveren',
            'Proje Alanı (m²)', 'Proje Sayfası', 'Kapak Görseli', 'Yayın Durumu')


def read_drive():
    from google.auth.transport.requests import AuthorizedSession
    from google.oauth2.service_account import Credentials

    credentials = Credentials.from_service_account_info(
        json.loads(os.environ['GOOGLE_DRIVE_SERVICE_ACCOUNT']),
        scopes=['https://www.googleapis.com/auth/drive.readonly'],
    )
    with AuthorizedSession(credentials) as session:
        response = session.get(
            f'https://www.googleapis.com/drive/v3/files/{DRIVE_FILE}',
            params={'alt': 'media', 'supportsAllDrives': 'true'}, timeout=30,
        )
        response.raise_for_status()
        return io.BytesIO(response.content)


def text(value):
    return str(value).strip() if value is not None else ''


def public_url(value):
    url = text(value)
    if not url:
        return ''
    parts = urlsplit(url)
    if parts.scheme != 'https' or not parts.hostname or parts.username is not None:
        raise ValueError('Project and image URLs must use HTTPS.')
    return url


def export(source):
    with_workbook = load_workbook(source, read_only=True, data_only=True)
    try:
        rows = with_workbook[TAB].values
        headers = {text(value): column for column, value in enumerate(next(rows))}
        if missing := set(REQUIRED) - headers.keys():
            raise ValueError(f'Web Arşivi is missing columns: {", ".join(sorted(missing))}')
        seen = set()
        projects = []
        for number, row in enumerate(rows, start=2):
            def field(name):
                return row[headers[name]]

            if text(field('Yayın Durumu')).casefold() != 'yayında':
                continue
            code = text(field('Proje Kodu'))
            title = text(field('Proje Adı'))
            if not re.fullmatch(r'AMM-[0-9]{5,}', code) or code in seen or not title:
                raise ValueError(f'Invalid or duplicate project code or missing title in row {number}.')
            seen.add(code)
            location = text(field('Konum'))
            city = location.split('/')[0].strip() if '/' in location else location.rsplit(',', 1)[-1].strip()
            area = field('Proje Alanı (m²)')
            projects.append(dict(
                id=code, title=title, years=text(field('Yıl')), type=text(field('Tipoloji')),
                location=location, city=city, client=text(field('İşveren')),
                area=area if isinstance(area, (int, float)) else text(area) or None,
                url=public_url(field('Proje Sayfası')), image=public_url(field('Kapak Görseli')),
            ))
        return projects
    finally:
        with_workbook.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--xlsx', type=Path, help='Read a local workbook for testing.')
    parser.add_argument('--output', type=Path, default=Path('projects.json'))
    args = parser.parse_args()
    projects = export(args.xlsx or read_drive())
    args.output.write_text(json.dumps(projects, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print(f'Exported {len(projects)} approved projects.')
