# Dor.Bari — design system

Grounded in the real brand: the logo's cocoa brown and caramel, and the flavours that recur
across Dora's menu (pistachio, raspberry, dark chocolate). Photography carries the page;
everything else stays quiet.

## Palette
| Token       | Hex       | Role                                                      |
|-------------|-----------|-----------------------------------------------------------|
| `ganache`   | `#2A1B17` | Text, dark surfaces                                        |
| `cocoa`     | `#734B46` | Brand colour from the logo; primary buttons, links         |
| `caramel`   | `#B97850` | Logo accent; used sparingly (hairline details only)        |
| `pistachio` | `#5F6E35` | Dietary tags, "ready" states                               |
| `raspberry` | `#A82E4B` | The one hot accent: cart count, new-order alerts           |
| `sugar`     | `#FFFCFA` | Page background (near-white so photos stay true)           |
| `meringue`  | `#F5EDE7` | Quiet surfaces, image placeholders                         |
| `crumb`     | `#E8DCD3` | Lines and borders                                          |

## Type
- **Bellefair** (Hebrew + Latin) — display: brand name, page and section titles. Large sizes only.
- **Assistant** — everything a customer reads or taps: body, prices, buttons, forms, admin UI.
- Scale: 13 / 15 / 17 / 20 / 26 / 34 / 46 / 64 px. Body line-height 1.6, display 1.05–1.15.

## Layout
- Mobile-first, RTL. 16px gutters on phones, max content width 1200px.
- Hero: brand name and one line, then the product photo inside an arch — a patisserie
  window. The arch is the single signature shape; it appears only in the hero.
- Product imagery is 4:5, 12px radius. Buttons are pills. Panels have 16px radius.
- Category rail scrolls horizontally on phones (snap), becomes a 5-column row on desktop.

## Principles
1. Food first: no decorative illustrations, gradients or stock imagery.
2. One accent at a time: raspberry only where something needs attention.
3. Motion only answers an action: drawer slides, toast confirms, quantity bumps.
4. Plain Hebrew copy, sentence case, action verbs on buttons ("הוספה לסל", "שליחת הזמנה").
5. Every state designed: loading, empty, sold out, error, success.
