# ReadyScore Design System v1.0

**Status:** MANDATORY  
**Mode:** Code-First  
**Source of Truth:** This document + implemented design tokens/components  
**Scope:** Landing Page, Trial Assessment, Premium Web Application  
**Version:** 1.0

---

## 1. Purpose

ReadyScore Design System adalah standar visual dan UI resmi untuk seluruh produk ReadyScore.

Design System menggunakan pendekatan **code-first**. Figma bukan dependency dan bukan source of truth.

Seluruh UI WAJIB menggunakan:
- Design Tokens
- Shared Components
- Layout Rules
- Interaction Rules
- Accessibility Rules

Developer atau AI coding agent TIDAK BOLEH membuat style baru secara bebas jika kebutuhan sudah dapat dipenuhi oleh Design System.

Kebutuhan baru yang belum tersedia boleh dibuat sebagai extension yang konsisten dan dicatat sebagai candidate backlog.

---

## 2. Product Character

ReadyScore harus terasa:

- Trustworthy
- Premium
- Modern
- Clear
- Human
- Educational
- Confident
- Calm

ReadyScore TIDAK boleh terasa:

- Childish
- Corporate-heavy
- Gaming
- Overly futuristic
- Crypto/Web3
- Excessively colorful
- Generic AI SaaS
- Cheap quiz website

**Primary perception:**

> A modern, credible education readiness assessment.

---

## 3. Design Principles

### 3.1 Clarity First
User harus langsung memahami apa itu ReadyScore, manfaatnya, tindakan berikutnya, dan posisi mereka dalam journey.

### 3.2 One Primary Action
Setiap screen memiliki satu primary CTA.

### 3.3 Progressive Disclosure
Informasi kompleks ditampilkan bertahap.

### 3.4 Confidence Without Pressure
Gunakan bahasa seperti:
- Your current readiness
- Areas to develop
- Your strengths

Hindari bahasa yang menghakimi.

### 3.5 Content Before Decoration
Hierarchy, typography, spacing, dan content selalu lebih penting daripada dekorasi.

### 3.6 Mobile First
Semua komponen wajib usable di mobile terlebih dahulu.

---

## 4. Technology Baseline

Primary stack:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

Recommended:
- CSS variables untuk design tokens
- Tailwind utilities
- shadcn/ui primitives

UI framework tambahan tidak boleh diperkenalkan tanpa keputusan arsitektur eksplisit.

---

## 5. Color System

### 5.1 Brand Colors

| Token | Hex | Usage |
|---|---|---|
| Deep Navy | `#0F172A` | Primary text / dark surfaces |
| Indigo | `#4F46E5` | Primary brand / CTA |
| Sky | `#0EA5E9` | Secondary accent |
| Emerald | `#10B981` | Success |
| Amber | `#F59E0B` | Warning |
| Red | `#EF4444` | Error / destructive |

### 5.2 Neutrals

| Token | Hex |
|---|---|
| White | `#FFFFFF` |
| Slate 50 | `#F8FAFC` |
| Slate 100 | `#F1F5F9` |
| Slate 200 | `#E2E8F0` |
| Slate 300 | `#CBD5E1` |
| Slate 500 | `#64748B` |
| Slate 700 | `#334155` |
| Slate 900 | `#0F172A` |

### 5.3 Semantic Tokens

```css
--background: #FFFFFF;
--foreground: #0F172A;
--muted: #F8FAFC;
--muted-foreground: #64748B;
--primary: #4F46E5;
--primary-foreground: #FFFFFF;
--secondary: #F1F5F9;
--secondary-foreground: #0F172A;
--accent: #0EA5E9;
--accent-foreground: #FFFFFF;
--success: #10B981;
--warning: #F59E0B;
--destructive: #EF4444;
--border: #E2E8F0;
--input: #E2E8F0;
--ring: #4F46E5;
```

Primary accent hanya digunakan untuk CTA, active state, important links, selected navigation, dan progress.

---

## 6. Typography

Primary font:

**Inter**

Fallback:

```text
Inter, ui-sans-serif, system-ui, sans-serif
```

### Type Scale

| Token | Desktop | Mobile | Weight |
|---|---:|---:|---:|
| Display | 56px | 40px | 700 |
| H1 | 44px | 34px | 700 |
| H2 | 36px | 30px | 700 |
| H3 | 28px | 24px | 600 |
| H4 | 22px | 20px | 600 |
| Body Large | 18px | 17px | 400 |
| Body | 16px | 15px | 400 |
| Body Small | 14px | 13px | 400 |
| Caption | 12px | 12px | 500 |

Line-height:
- Heading: 1.15–1.25
- Body: 1.5–1.7

---

## 7. Spacing

Base unit: **4px**

Allowed scale:

```text
4 8 12 16 20 24 32 40 48 64 80 96 120
```

Rules:
- Component spacing: 8–24px
- Card padding: 24–32px
- Section padding desktop: 64–120px
- Hero vertical spacing desktop: 96–144px
- Mobile section padding: 48–72px

Arbitrary spacing values harus dihindari.

---

## 8. Layout

### Container

Desktop:

```css
max-width: 1200px;
margin-inline: auto;
padding-inline: 24px;
```

Mobile:

```text
padding-inline: 16px
```

### Grid

- Desktop: 12 columns
- Tablet: 6 columns
- Mobile: 1 column

Prefer CSS Grid sebelum absolute positioning.

---

## 9. Border Radius

```text
sm: 6px
md: 8px
lg: 12px
xl: 16px
2xl: 24px
full: 9999px
```

Default UI: 8–12px  
Cards: 12–16px  
Marketing panels: 16–24px  
Buttons: 8–10px

Hindari penggunaan pill secara berlebihan.

---

## 10. Shadows

Gunakan shadow secara hemat.

```text
shadow-sm
shadow-md
shadow-lg
```

Prioritas:
1. Flat surface
2. Border
3. Shadow bila elevation memang diperlukan

Tidak semua card harus floating.

---

## 11. Buttons

### Primary
Untuk primary CTA:
- Brand color
- White text
- Medium/Semibold
- Minimum height 44–48px
- Radius 8–10px

### Secondary
Untuk alternative action:
- Neutral background
- Border
- Dark text

### Ghost
Untuk low-priority action.

### Destructive
Hanya untuk tindakan destruktif.

### States
Semua button wajib mendukung:
- Default
- Hover
- Focus
- Active
- Disabled
- Loading

Loading tidak boleh mengubah dimensi button.

---

## 12. Forms

Input minimum:
- Height 44px
- Visible label
- Focus state
- Error state
- Helper text jika diperlukan

Placeholder tidak boleh menjadi satu-satunya label.

Trial required fields:
- Nama
- Email
- WhatsApp
- Kota

---

## 13. Cards

Default:
- Background white
- Border slate-200
- Radius 12–16px
- Padding 24px

Hierarchy:

```text
Title
Description
Content
Action
```

Hindari card di dalam card tanpa alasan UX yang jelas.

---

## 14. Navigation

Landing Page desktop:
- Logo
- How It Works
- Sample Report
- Pricing
- FAQ
- Primary CTA

Mobile:
- Logo
- Menu
- CTA di menu

Navbar harus ringan.

---

## 15. Hero

Hero adalah section dengan prioritas conversion tertinggi.

WAJIB memiliki:
- Headline
- Supporting copy
- Primary CTA
- Product visual

Recommended headline:

> **Are You Ready for Your Next Step?**

Recommended primary CTA:

> **Take the Free 20-Question Assessment**

Secondary:

> **See Premium**

Visual utama sebaiknya berupa preview ReadyScore/report UI, bukan stock photo generik.

---

## 16. Landing Page Information Architecture

Urutan default:

1. Hero
2. Problem
3. What is ReadyScore
4. How It Works
5. What We Measure
6. Sample Result
7. Free vs Premium
8. Trust / Methodology
9. Who Is It For
10. FAQ
11. Final CTA
12. Footer

Urutan boleh dioptimalkan berdasarkan data conversion, tetapi perubahan harus tetap konsisten dengan product strategy.

---

## 17. Assessment UI

Trial dan Premium wajib memakai visual language yang sama.

Structure:

```text
Header
Progress
Question
Answer Options
Navigation
```

Assessment harus fokus pada menjawab pertanyaan. Jangan menambahkan dekorasi yang mengganggu.

---

## 18. Progress

Tampilkan:
- Current question
- Total questions
- Progress percentage

Contoh:

```text
Question 7 of 20
████████░░░░░░░░░░░░ 35%
```

Progress harus informatif, bukan menekan.

---

## 19. Score Visualization

Gunakan:
- Large numerical score
- Semantic status
- Supporting explanation
- Domain breakdown

Contoh:

```text
74
READY

Your current readiness shows a solid foundation,
with several areas that can still be strengthened.
```

Jangan menggunakan warna sebagai satu-satunya indikator.

---

## 20. Domain Visualization

Preferred:
- Horizontal bars
- Progress bars
- Radar chart bila memang membantu

Setiap chart harus memiliki context berbasis teks.

---

## 21. Premium Report

Hierarchy:

```text
ReadyScore
↓
Overall Interpretation
↓
Domain Scores
↓
Strengths
↓
Development Areas
↓
Recommendations
↓
Next Steps
```

Web report dan PDF harus menggunakan visual language yang sama.

---

## 22. Icons

Gunakan **Lucide Icons**.

Rules:
- Konsisten
- Jangan mencampur icon family
- Icon mendukung makna
- Jangan mengganti label dengan icon ambigu

---

## 23. Illustration & Visual Assets

Preferred:
- Abstract educational shapes
- UI screenshots
- Data visualization
- Subtle geometric elements

Avoid:
- Generic corporate people
- Excessive 3D
- Cartoon students
- Overly decorative AI imagery

---

## 24. Animation

Animation harus subtle.

Allowed:
- Fade
- Slide
- Scale
- Progress transition
- Hover transition

Duration:
**150–300ms**

Hindari:
- Excessive parallax
- Bouncing
- Continuous motion
- Distracting hero animation

Wajib menghormati `prefers-reduced-motion`.

---

## 25. Responsive

Breakpoints:

```text
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
```

WAJIB:
- Mobile
- Tablet
- Desktop
- Tidak ada horizontal scrolling

Touch target minimum:
**44 × 44px**

---

## 26. Accessibility

Minimum:
**WCAG 2.1 AA**

WAJIB:
- Semantic HTML
- Keyboard navigation
- Visible focus
- Accessible labels
- Sufficient contrast
- Alt text untuk meaningful images
- Accessible errors
- Reduced motion support

---

## 27. Content Rules

Tone:
- Clear
- Encouraging
- Intelligent
- Human
- Non-judgmental

Hindari:
- Fear marketing
- Overclaiming
- Guaranteed outcomes
- Psychological diagnosis claims
- Future prediction claims

Preferred:
- Assessment
- Readiness
- Strengths
- Areas to develop
- Insights
- Growth

---

## 28. Trust Rules

ReadyScore harus diposisikan sebagai assessment platform.

Jangan menyatakan:
- Diagnosis psikologis
- Prediksi masa depan
- Hasil deterministik
- "Scientifically proven" tanpa evidence yang memadai

---

## 29. SEO Readiness

Landing Page wajib mendukung:
- SEO title
- Meta description
- Open Graph
- Twitter/X card
- Canonical URL
- Sitemap
- Robots
- Structured data bila relevan

Primary search intents:

```text
college readiness assessment
student readiness test
kesiapan kuliah
tes kesiapan kuliah
assessment kesiapan siswa
```

SEO tidak boleh mengorbankan UX.

---

## 30. Analytics Readiness

Komponen harus siap untuk event tracking.

Minimum events:

```text
landing_view
hero_cta_click
pricing_view
free_cta_click
trial_started
trial_completed
premium_cta_click
```

Analytics tidak boleh mengubah visual behavior.

---

## 31. Component Naming

Gunakan nama yang predictable:

```text
Button
Card
Input
Badge
Section
Container
Navbar
Hero
PricingCard
ScoreCard
QuestionCard
ProgressBar
ResultSummary
DomainScore
```

Hindari nama seperti:
```text
FancyCard
SuperButton
NewCard2
TestThing
```

---

## 32. Component Architecture

```text
components/
├── ui/
├── layout/
├── marketing/
├── assessment/
└── report/
```

Shared primitives berada di `ui`.

Feature-specific components berada di feature folder.

---

## 33. Tailwind Rules

Gunakan semantic tokens dan reusable utilities.

Hindari:

```tsx
className="bg-[#4938ff] px-[27px] rounded-[13px]"
```

Prefer:

```tsx
className="bg-primary px-6 rounded-lg"
```

Custom values hanya boleh digunakan bila merupakan documented token atau kebutuhan exception yang nyata.

---

## 34. CSS Variables

Design tokens wajib diimplementasikan menggunakan CSS variables.

Contoh:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 47.4% 11.2%;
  --primary: 243.7 75.4% 58.6%;
  --primary-foreground: 0 0% 100%;
  --border: 214.3 31.8% 91.4%;
  --radius: 0.5rem;
}
```

Implementasi dapat berubah, tetapi semantic token model harus tetap stabil.

---

## 35. Dark Mode

Dark mode **bukan scope v1.0**.

Jangan menghabiskan development effort untuk dark mode.

Catat sebagai backlog bila diperlukan.

---

## 36. Design Debt / Backlog

Jangan menahan MVP untuk:
- Advanced animation
- Dark mode
- Complex illustration system
- Advanced personalization
- Full design-token automation
- Extensive component variants
- Advanced chart library
- Figma synchronization

Prinsip:

> Ship the simplest compliant version and record improvements as backlog.

Jangan over-engineer v1.0.

---

## 37. Definition of Done — Component

Component dianggap selesai jika:
- Menggunakan Design Tokens
- Responsive
- Accessible
- Memiliki required states
- Mobile usable
- Tidak memiliki console errors
- Tidak menggunakan arbitrary styles tanpa alasan
- Sesuai product tone
- Reusable bila memang diperlukan

---

## 38. Definition of Done — Landing Page

Landing Page dianggap siap jika:
- Semua mandatory sections tersedia
- Primary CTA berfungsi
- Trial CTA menuju route yang benar
- Premium CTA menuju route yang benar
- Responsive
- SEO metadata tersedia
- Analytics events tersedia
- Performance acceptable
- Accessibility baseline terpenuhi
- Tidak ada critical runtime/console error
- Mematuhi Design System

---

## 39. Non-Negotiable Rules

1. Figma bukan dependency.
2. Code adalah visual source of truth.
3. Tidak boleh ada arbitrary brand color.
4. Tidak boleh ada arbitrary typography.
5. Tidak boleh ada uncontrolled component variants.
6. UI framework tambahan tidak boleh ditambahkan tanpa keputusan arsitektur.
7. Shared components harus digunakan bila tersedia.
8. Accessibility wajib.
9. Mobile-first wajib.
10. Landing Page harus conversion-oriented.
11. Trial dan Premium harus terasa sebagai satu produk.
12. Visual consistency lebih penting daripada decorative novelty.
13. Technical/design debt diperbolehkan jika tidak mengganggu core product dan dicatat sebagai backlog.
14. Jangan over-engineer v1.0.

---

## 40. Governance

Setiap perubahan Design System dikategorikan sebagai:

### A. Token Change
Mengubah visual behavior secara global.

### B. Component Change
Mengubah reusable component.

### C. Feature-Specific Change
Hanya memengaruhi satu feature.

### D. Backlog
Berguna tetapi belum diperlukan.

Gunakan perubahan terkecil yang menyelesaikan kebutuhan.

---

## 41. Final Design Principle

ReadyScore harus terlihat seperti produk yang layak dipercaya untuk menjawab:

> **"Am I ready for my next step?"**

Visual harus menyampaikan:

**Clarity + Trust + Intelligence + Calm Confidence**

Tujuan Design System bukan membuat produk terlihat rumit atau mengesankan.

Tujuannya adalah membuat pengguna:
1. Memahami ReadyScore.
2. Percaya pada produk.
3. Mau mengambil assessment.
4. Memahami hasil.
5. Mau kembali berkembang bersama ReadyScore.

---

# END OF READYScore DESIGN SYSTEM v1.0