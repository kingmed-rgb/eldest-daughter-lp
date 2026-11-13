# 01 — Design system

The landing pages (eldestdaughtercore.com, hijamayor.com) use this system. The app should feel like the same brand: a quiet, warm book. Think of a Substack article, not a wellness app.

## Principles

1. **One background.** Cream everywhere. No gradients, no section color blocks, no dark mode on the brand surfaces at first. (If the iOS app needs dark mode, derive it from the same burgundy family. Don't introduce new hues.)
2. **Burgundy is for action.** The accent color goes on buttons and the few elements a user must act on. Text stays ink/muted.
3. **Few choices:** 2 fonts, 4 text sizes, 2 weights. The user explicitly asked to cut down sizes and weights after the page had too many. Keep it that way.
4. **All lowercase.** Headings, buttons, labels, body. Exceptions: brand names with ™, proper names in quotes from the book if needed.
5. **No highlights, no bold inside body text, no emoji decoration, no stock "wellness" illustrations.** The only colorful elements allowed are the reviewer avatars (burgundy tints).

## Colors

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FEF7EC` | the only background (cream) |
| `ink` | `#2B1218` | headings, body text, borders of the offer card |
| `muted` | `#5E434A` | secondary text: captions, meta, page numbers, FAQ answers |
| `line` | `#EBDCCD` | hairlines, dividers, checkbox borders |
| `accent` | `#4D0619` | buttons, links you must act on (deep burgundy) |
| `accentDark` | `#36040F` | pressed/hover state of buttons |
| `onAccent` | `#FEF7EC` | text on buttons (same as bg) |
| `tint1…tint5` | `#F2DED6` `#E3BDB8` `#C98F95` `#9C4F5C` `#6E2433` | **only** reviewer avatars / small decorative circles. Could serve progress rings or charts in the app, nothing else. |

Rejected on purpose: a brighter cherry/red accent ("too much, totally irrelevant colors"), gold/yellow price highlights, a separate color for "founding price" labels. Prices and badges use ink, not a new color.

## Typography

| Role | Font | Weight | Size (pt/px) | Line height |
|---|---|---|---|---|
| Title (H1) | Fraunces | 600 | 32 | 1.08–1.2 |
| Section heading (H2) | Fraunces | 600 | 24 | 1.25–1.3 |
| Body / lead | Source Serif 4 | 400 | 18 | 1.6–1.7 |
| Small (captions, FAQ, meta, buttons, table of contents) | Source Serif 4 | 400 / 600 | 15 | 1.4–1.5 |

- Weights in use: **400** (body) and **600** (headings, buttons, prices). Nothing else.
- Italics: Source Serif 4 italic for quotes and letters/poems; Fraunces italic is available but barely used.
- Font files (woff2) are in `assets/`. Both fonts are free under the SIL Open Font License, available on Google Fonts. For iOS, download the TTF/variable versions from Google Fonts and register them in Info.plist (`UIAppFonts`).
- Content width on web: 640px max for the article, 520px for the offer card. On iPhone that's simply the screen with 20–24pt side padding.

## Components (as built on the web)

- **Primary button:** accent background, cream text, 15–18px, weight 600, lowercase, corner radius **10**, full width on mobile, ~52pt tall. Pressed → `accentDark`. Example label: "get it now — $12" was later simplified to "get it now".
- **Offer card:** cream background, **1.5px ink border**, radius **14**, contents: image, title (H2), what's included as a simple list, price (`$12` in ink 600 + crossed-out anchor in muted), button, payment badges, one line of reassurance.
- **Sticky buy bar:** bottom of screen, cream with a hairline top border, appears only after the user scrolled past "what's inside", scrolls to the offer (doesn't open checkout).
- **Checklist (signs):** square checkboxes with `line` border, tick turns ink; no counter or score text.
- **FAQ:** all collapsed by default, hairline between items, `+` / `−` indicator in muted.
- **Reviews:** TikTok-comment style. Round avatar in a burgundy tint with initial, username in 15/600, comment in 15/400, likes in muted.
- **Table of contents:** "ch 01 … chapter title … p. 12" in 15/400 body font, page numbers muted.
- **Before → after:** two short lists side by side ("right now" / "after the workbook") with an arrow between them, same color for both headings.
- **Checkout loader:** spinner + "preparing your secure checkout…" only (no product title, no price).

## SwiftUI tokens (starting point)

```swift
import SwiftUI

extension Color {
    init(hex: UInt32) {
        self.init(.sRGB,
                  red:   Double((hex >> 16) & 0xFF) / 255,
                  green: Double((hex >> 8)  & 0xFF) / 255,
                  blue:  Double(hex & 0xFF) / 255,
                  opacity: 1)
    }
}

enum Brand {
    enum C {
        static let bg         = Color(hex: 0xFEF7EC)
        static let ink        = Color(hex: 0x2B1218)
        static let muted      = Color(hex: 0x5E434A)
        static let line       = Color(hex: 0xEBDCCD)
        static let accent     = Color(hex: 0x4D0619)
        static let accentDark = Color(hex: 0x36040F)
        static let onAccent   = Color(hex: 0xFEF7EC)
        static let tints: [Color] = [0xF2DED6, 0xE3BDB8, 0xC98F95, 0x9C4F5C, 0x6E2433].map { Color(hex: $0) }
    }

    // Register "Fraunces" and "Source Serif 4" in Info.plist (UIAppFonts).
    // Check the exact PostScript names after adding the files: UIFont.familyNames.
    enum F {
        static let title   = Font.custom("Fraunces", size: 32, relativeTo: .largeTitle).weight(.semibold)
        static let heading = Font.custom("Fraunces", size: 24, relativeTo: .title2).weight(.semibold)
        static let body    = Font.custom("Source Serif 4", size: 18, relativeTo: .body)
        static let small   = Font.custom("Source Serif 4", size: 15, relativeTo: .footnote)
        static let smallStrong = Font.custom("Source Serif 4", size: 15, relativeTo: .footnote).weight(.semibold)
    }

    enum R { static let button: CGFloat = 10; static let card: CGFloat = 14 }
}

struct PrimaryButton: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(Brand.F.smallStrong)
            .textCase(.lowercase)
            .foregroundStyle(Brand.C.onAccent)
            .frame(maxWidth: .infinity, minHeight: 52)
            .background(configuration.isPressed ? Brand.C.accentDark : Brand.C.accent,
                        in: RoundedRectangle(cornerRadius: Brand.R.button))
    }
}
```

Using `relativeTo:` keeps Dynamic Type working; keep it, accessibility matters for an older audience later.

## Imagery

- `assets/eldest-daughter-workbook-cover.webp` — English workbook cover.
- `assets/eldest-daughter-bundle.webp` — the bundle mockup (workbook + poems + worksheet).
- `assets/sindrome-hija-mayor-3d.webp` — Spanish ebook 3D cover (transparent background).
- `assets/sindrome-hija-mayor-photo.webp` — Spanish lifestyle photo.
- `assets/favicon.png` — favicon / possible app icon starting point.
- The author photo on the English page is **likely a film still**: don't reuse it in the app (see `05`).
