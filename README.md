# Zama Zama Tyres — website

A premium, animated one-page website for a tyre & wheel centre. Plain HTML/CSS/JS — no build step.

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000   # then visit http://localhost:8000
```

To publish free on **GitHub Pages**: repo → Settings → Pages → Deploy from branch → pick this branch and `/ (root)`.

## What's inside

| Section | Highlights |
| --- | --- |
| Preloader | Spinning logo, letter reveal, progress counter, curtain exit |
| Hero | Hand-drawn SVG tyre that rolls in and spins faster as you scroll, split-line headline, counting stats, floating badges |
| Bands | Two tilted marquees (services + brands) whose speed and direction follow scroll velocity |
| Tyre finder | Search by size or vehicle type; live size readout; filters the shop |
| Services | Six cards with cursor-following spotlight and image zoom |
| How it works | Pinned horizontal-scroll story with image parallax (stacks vertically on mobile) |
| Shop | Category filters animated with GSAP Flip, spec bars, size picker, **Add to quote** with fly-to-cart animation |
| Quote drawer | Quantities, total, one-tap "Request quote on WhatsApp" (saved in the browser) |
| About / statement / gallery | Parallax images, rotating badge, word-by-word scroll reveal, clip-path bento gallery |
| Reviews | Drag / swipe slider with progress bar |
| Booking | Validated form, date + time slots that respect opening hours, sends the booking via WhatsApp |
| FAQ, CTA, contact, footer | Smooth accordion, live **Open now / Closed** status (contact + footer), animated map card, giant wordmark |

Also: Lenis smooth scrolling, custom cursor and magnetic buttons on desktop, scroll progress bar, back-to-top ring, WhatsApp button, film grain, SEO + `TireShop` structured data, keyboard and screen-reader support, and full fallbacks — with "reduce motion" on or scripts blocked, everything is still visible and usable.

## Before you go live — replace the placeholders

Everything below is sample content:

1. **Business settings** — top of `assets/js/main.js` (`CONFIG`): WhatsApp number (digits only, with country code), currency symbol, opening hours, and optional `timeZone`.
2. **Contact details** — phone `071 895 6445` and the Mitchell's Plain address are set (no email by choice).
3. **Opening hours list** in the booking section (keep it in sync with `CONFIG.hours`).
4. **Tyres & prices (in Rand)** — each `<article class="product">` in the shop: brand, model, `data-price`, `data-sizes`, ratings and spec bars.
5. **Stats, reviews and the "4.9 from 1,200+ reviews" score** — replace with your real numbers and genuine customer reviews.
6. **Social links** in the footer (currently `#`).

## Images

All photos are free-to-use [Unsplash](https://unsplash.com/license) images, loaded by URL in this format:

```
https://unsplash.com/photos/<PHOTO_ID>/download?force=true&w=1600
```

Each `<img>` has a `data-fallback` second image; if both fail, a branded placeholder is shown, so the layout never breaks. To change a photo, open any image on unsplash.com and copy the 11-character ID from the end of its URL.

| Where | Photo IDs (primary → fallback) |
| --- | --- |
| Hero | `i34LTsTiUKE` → `Y1wL87Fc4D4` |
| Services | `9uHal2Dd9aE`, `dYlVT5Ktj6U`, `FmOdtM4KXhk`, `rRaApBvfSkA`, `vmZuHxfbIlw`, `Km36esq8rY4` |
| How it works | `CTwQiFlpgrM`, `-PNudk9hxlE`, `PHJcbJf3YTY`, `Y1wL87Fc4D4` |
| Shop | `FF2IFGz2lOM`, `Wr1vbV1i-Qc`, `-OsnPr51mgo`, `bO7SFq7Hknc`, `nOs-lK_ebe8`, `BO5a3NB8vs8`, `ZNOLp1MFGKY`, `kqhF9kF6J0A` |
| About | `XqR-ZSvW6q4`, `_CVx8Z4nypE` |
| Statement / CTA | `HWZ7Psp0nCQ`, `7L2-sf19x78` |
| Gallery | `0Ni9nVa5rPA`, `lUzZ_0B4Gzs`, `-PCCVqFedNg`, `ISfRSbfqHBA`, `zymgygh4qaY`, `CsIcSVQlQmA`, `sjvQSAYMcns` |

For the fastest load you can download your final photos into `assets/img/` and point the `src` attributes there.

## Files

```
index.html            page markup and content
assets/css/style.css  design tokens, layout, components, responsive rules
assets/js/main.js     settings, animation and all interactions
assets/img/           favicon / logo mark
assets/vendor/        GSAP 3.15 (ScrollTrigger, SplitText, Flip) and Lenis 1.3, bundled locally
```

GSAP is free under its [standard license](https://gsap.com/standard-license); Lenis is MIT. Fonts: Unbounded and Manrope from Google Fonts.
