# BA Medicale

Local website for BA Medicale: medical learning library, ebook commerce preview,
symposium hub, login area, and video wall for Dr. dr. Bob Andinata, Sp.B., Subsp. Onk(K) content.

## Run locally

```powershell
cd D:\BAMedicale
python -m http.server 8000
```

Open `http://127.0.0.1:8000`.

## Edit content

Update `content.js` to change:

- library categories
- ebook catalog and pricing
- symposium schedule
- YouTube/Instagram video thumbnails

## Next integrations

- Google OAuth for Gmail login
- Xendit or QRIS payment flow
- member database and purchase status
- lightweight CMS/admin editor for non-code content changes
