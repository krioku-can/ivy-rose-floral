---
name: Ivy & Rose Floral Co.
colors:
  primary: "#2C2419"
  secondary: "#5C4D3C"
  accent: "#8B9D83"
  highlight: "#C17F59"
  background: "#F0EBE3"
  surface: "#FFFFFF"
  muted: "#D5CFC6"
typography:
  heading:
    fontFamily: "Playfair Display"
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.02em"
  body:
    fontFamily: "Source Serif Pro"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "Inter"
    fontSize: 0.75rem
    fontWeight: 500
    letterSpacing: "0.15em"
    textTransform: "uppercase"
  nav:
    fontFamily: "Inter"
    fontSize: 0.875rem
    fontWeight: 400
    letterSpacing: "0.05em"
    textTransform: "uppercase"
rounded:
  sm: 2px
  md: 4px
  lg: 8px
spacing:
  xs: 8px
  sm: 16px
  md: 32px
  lg: 64px
  xl: 96px
  2xl: 128px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.background}"
    fontFamily: "{typography.label.fontFamily}"
    fontSize: "{typography.label.fontSize}"
    letterSpacing: "{typography.label.letterSpacing}"
    textTransform: "uppercase"
    padding: "16px 32px"
    rounded: "{rounded.sm}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    border: "1px solid {colors.primary}"
    fontFamily: "{typography.label.fontFamily}"
    fontSize: "{typography.label.fontSize}"
    letterSpacing: "{typography.label.letterSpacing}"
    textTransform: "uppercase"
    padding: "16px 32px"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    shadow: "0 2px 12px rgba(44, 36, 25, 0.06)"
---

## Overview

Heritage botanical meets modern minimalism. The brand evokes a sunlit garden studio — warm, personal, artisanal. Every element feels hand-touched and intentional.

## Philosophy

- **Warmth over coolness:** Cream backgrounds, not stark white
- **Craft over automation:** Hand-drawn textures, not flat vectors
- **Story over speed:** Every bouquet has a narrative
- **Heritage over trendy:** Classic proportions, not fleeting styles

## Colors

- **Primary (#2C2419):** Deep espresso for headlines and body text. Rich, warm, grounding.
- **Secondary (#5C4D3C):** Warm taupe for secondary text, borders, metadata.
- **Accent (#8B9D83):** Sage green for highlights, CTAs, hover states. References living plants.
- **Highlight (#C17F59):** Terracotta for urgent CTAs, price tags, subtle warmth.
- **Background (#F0EBE3):** Warm cream — the color of handmade paper, linen tablecloths, sunbleached wood.
- **Surface (#FFFFFF):** Pure white for cards and forms, creating gentle contrast against cream.
- **Muted (#D5CFC6):** Stone gray for dividers, form borders, subtle separations.

## Typography

**Headlines:** Playfair Display (400, 700) — classic serif with high contrast, referencing vintage botanical prints and heritage branding.

**Body:** Source Serif Pro (400) — readable, warm, slightly smaller x-height than typical serifs, creating a more intimate reading experience.

**UI/Labels:** Inter (400, 500) — clean sans-serif for navigation, buttons, form labels. Provides modern contrast to the serif headlines.

## Layout

- **Grid:** 12-column with generous gutters (32px)
- **Max width:** 1280px centered
- **Whitespace:** Generous vertical rhythm. Let the brand breathe.
- **Mobile:** Single column, 16px margins, stacked sections

## Imagery

- Soft natural light (golden hour preferred)
- Neutral backgrounds: linen, wood, stone, garden greenery
- Bokeh and depth of field
- No harsh shadows or flash photography
- Colors should feel warm and slightly desaturated

## Animation

- **Entrance:** Gentle fade-up (translateY: 20px → 0, opacity: 0 → 1, 600ms, ease-out)
- **Hover:** Subtle scale (1 → 1.02) and shadow increase
- **Scroll:** Parallax on hero image (0.3x speed)
- **Buttons:** Background color transition (200ms)

## Do's and Don'ts

**Do:**
- Use generous whitespace
- Pair serif headlines with sans-serif UI
- Let the logo breathe in the header
- Use the sage accent sparingly (less is more)

**Don't:**
- Use cool grays or blue-tinted whites
- Crowd the layout with too many elements
- Use default system fonts
- Make anything feel generic or template-like
