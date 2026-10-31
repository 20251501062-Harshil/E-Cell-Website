# E-Cell IIIT Vadodara: website

A static site: HTML, CSS and vanilla JavaScript. No build step and no libraries.
Host it on any static host, such as GitHub Pages, Netlify, Vercel or the institute's server.

## Design

The site uses white pages, oversized type, and the exact E-Cell mark as a glossy 3D object.
Every effect is a CSS transform or opacity change, or native sticky scrolling, so phones scroll smoothly.

- **Intro:** a short count while the logo outline draws, then the page is revealed.
- **Hero:** the mark in 3D, with real lighting and a moving sheen. Swipe or drag sideways to spin it, or tap it to replay its entrance. It renders only while on screen.
- **Headings:** they rise word by word out of masks as they enter the screen.
- **About:** a statement that fills in word by word as you read it.
- **Four wings:** full-screen cards that stack as you scroll. Each card shows the mark with that wing's own piece pulled out.
- **Shark Tank IIITV 2026:** a dark section with giant outlined moving type, a countdown to the grand finale, the facts and the pitch questions.
- **Footer:** a giant wordmark.

`shark-tank.html` has the same look and covers the format, the six pitch questions, a working pitch clock and how to stay updated.

### Resource pages (in the menu and footer)

- **`pitch-deck.html`:** how to build a pitch deck. It shows the 12 slides as slide cards, each with what to put on it, a tip, what to avoid and an example from Campus Cabs, an imaginary student startup. It also has design rules and delivery tips, a deck builder that saves on the device and downloads as a text outline, and a "ready to pitch" checklist.
- **`glossary.html`:** about 70 startup terms in plain English, with live search, category filters and an A–Z index. Add `?q=runway` to the address to open it pre-filtered.
- **`faq.html`:** questions about E-Cell and Shark Tank IIITV 2026. Every answer uses only confirmed facts.

The header, menu and footer are the same static HTML on every page.

## Editing

| What | Where |
|---|---|
| Instagram, LinkedIn, email, Shark Tank date and facts, registration link | `js/config.js` |
| All page text | `index.html`, `shark-tank.html`, `pitch-deck.html`, `glossary.html`, `faq.html` (plain HTML) |

**Anything left empty in `js/config.js` is not shown.** There are no placeholders.
- Add `registrationUrl` and Register buttons appear.
- Add `linkedin` or `email` and they appear in the menu and footer.

The finale countdown is calculated from the date in India. To test a different date, add `?date=2026-11-02` to the address.

## Files

- `js/logo.js`: the official mark, traced from the PNG at 99.3% overlap.
- `js/mark3d.js`: the 3D mark (WebGL).
- `js/v4.js`: page behaviour.
- `js/card.js`: the idea card image.
- `js/boot.js`: date helpers and the calendar file.
- `js/guides.js`: glossary search, the deck builder and the checklist.
- `css/v4.css`: all styles.

## Accessibility

- All text is real HTML.
- Keyboard users can reach the menu and the card dialog, and focus stays inside them while they are open.
- "Reduce motion" in the menu or footer, and the system reduced-motion setting, show the full site with nothing moving.

## Preview locally

```bash
python3 -m http.server 8080   # then open http://localhost:8080
```
Updated for Vercel deployment
