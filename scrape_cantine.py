#!/usr/bin/env python3
"""Scrape email, nome, regione, provincia from bereilvino.it cantina pages."""

import re
import csv
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

SKIP_EMAILS = {
    'fabio_italiano@hotmail.com',  # site owner
    'info@bereilvino.it',
    'privacy@bereilvino.it',
}

SKIP_DOMAINS = {
    'example.com', 'sentry.io', 'w3.org', 'schema.org',
    'wordpress.org', 'wordpress.com', 'gravatar.com',
    'bereilvino.it', 'googletagmanager.com', 'google.com',
}


def scrape_cantina(url):
    """Scrape a single cantina page. Returns dict or None."""
    try:
        req = Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'})
        html = urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
    except (URLError, HTTPError, Exception) as e:
        return None

    # Extract name from <title>
    title_m = re.search(r'<title>([^<]+)</title>', html)
    name = title_m.group(1).split(' - ')[0].strip() if title_m else ''
    if not name or name.lower() in ('cantine italiane', ''):
        return None

    # Extract emails
    raw_emails = set(re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', html))
    emails = set()
    for e in raw_emails:
        if e.lower() in SKIP_EMAILS:
            continue
        domain = e.split('@')[1].lower()
        if any(skip in domain for skip in SKIP_DOMAINS):
            continue
        emails.add(e.lower())

    if not emails:
        return None

    # Extract regione from URL pattern /regione/xxx/
    regione_m = re.search(r'/regione/([^/\"]+)', html)
    regione = regione_m.group(1).replace('-', ' ').title() if regione_m else ''

    # Extract provincia
    provincia_m = re.search(r'/provincia/([^/\"]+)', html)
    provincia = provincia_m.group(1).replace('-', ' ').title() if provincia_m else ''

    # Extract website (first external non-social link)
    site = ''
    site_patterns = re.findall(r'href="(https?://(?!www\.bereilvino|facebook|x\.com|pinterest|whatsapp|instagram|youtube|twitter|linkedin|google|schema|wordpress|gravatar|sentry)[^"]+)"', html)
    for s in site_patterns:
        if not any(x in s for x in ['share', 'sharer', 'intent', 'pin/create', '.js', '.css', '.png', '.jpg']):
            site = s
            break

    # Extract phone from tel: links
    phone = ''
    phone_m = re.findall(r'href="tel:([^"]+)"', html)
    if phone_m:
        phone = phone_m[0].strip()

    return {
        'nome': name,
        'email': '; '.join(sorted(emails)),
        'regione': regione,
        'provincia': provincia,
        'sito': site,
        'telefono': phone,
        'url_fonte': url,
    }


def main():
    with open('bereilvino_urls.txt', 'r') as f:
        urls = [line.strip() for line in f if '/cantina/' in line]

    print(f"URLs da processare: {len(urls)}")

    results = []
    errors = 0
    done = 0

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(scrape_cantina, url): url for url in urls}
        for future in as_completed(futures):
            done += 1
            result = future.result()
            if result:
                results.append(result)
            else:
                errors += 1
            if done % 100 == 0:
                print(f"  Processate: {done}/{len(urls)} | Trovate con email: {len(results)} | Errori: {errors}")

    print(f"\nCompletato! Cantine con email: {len(results)} su {len(urls)} pagine")

    # Write CSV
    with open('bereilvino_scraped.csv', 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['nome', 'email', 'regione', 'provincia', 'sito', 'telefono', 'url_fonte'])
        writer.writeheader()
        for r in sorted(results, key=lambda x: x['nome']):
            writer.writerow(r)

    print(f"Salvato in bereilvino_scraped.csv")


if __name__ == '__main__':
    main()
