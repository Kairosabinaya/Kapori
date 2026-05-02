# KAPORI Dashboard — Phase 1 Audit

Stack: React 19 + Vite, Tailwind 3.4, framer-motion, react-router 7, lucide-react, react-hot-toast, recharts.
Routes: `/overview`, `/inteligensi`, `/lahan`, `/perangkat`, `/peringatan`, `/laporan`, `/pengaturan`.
Layout: fixed sidebar (256/72px) + header + main. State global di `App.jsx`, filter di-share via Outlet context.

---

## 1.1 Responsive Audit

### Layout (semua page) — patah berat di < 1024px
- `Layout.jsx:18-22` — `motion.div` selalu `marginLeft: 256` (atau 72 collapsed). Di mobile sidebar fixed nutupin konten + push margin = layar kepotong.
- Sidebar `fixed left-0 w-[256/72]` — ga ada drawer mode. Mobile butuh hamburger + overlay.
- `main p-6` — terlalu padat di 320px (kurangi ke `p-4`).
- Tidak ada bottom-nav alternatif untuk mobile.

### Header (`Header.jsx`)
- Right cluster: 2 dropdown + 3 icon button + avatar = ~480px konten. Overflow di < 640px.
- Search animate ke `width: 220px` — di mobile bisa overflow horizontal.
- Notification dropdown `w-80` (320px) — di mobile 320px udah edge-to-edge, bakal nempel/keluar viewport.
- Profile dropdown `w-56` — sama, posisinya `right-0` jadi mungkin masih masuk, tapi marginal.
- `h-16 px-6` — perlu shrink ke `px-4` di mobile + tap targets `p-1.5` < 44px (gagal a11y).
- Title `text-lg` masih oke, tapi pada page panjang ("Pengaturan") + search expanded → overflow.

### Overview (`Overview.jsx`)
- AI Insight card grid `grid-cols-4` (Sebab/Confidence/Aksi/Dampak) — nempel berhimpitan di mobile, perlu jadi `grid-cols-2` atau stack.
- Metric cards `grid grid-cols-3` — di mobile kekecilan; harus `grid-cols-1` mobile, `sm:grid-cols-2`, `lg:grid-cols-3`.
- Chart `height: 300` fixed; di mobile axis label berhimpit, legend bisa cut.

### Inteligensi (`Inteligensi.jsx`)
- Rekomendasi & Risk grids `grid-cols-2` — di mobile harus `grid-cols-1`.
- Risk card icon + title flex tetap ok, tapi badge "Match %" + judul rawan wrap ugly di < 380px.

### Lahan (`Lahan.jsx`)
- SVG `viewBox="0 0 900 550"` responsif via `w-full h-auto` — OK.
- **Detail panel `absolute right-0 w-80 h-full`** di mobile = nutupin map full + ga ada overlay/close affordance buat tap-out. Harus jadi bottom-sheet di mobile atau full-screen.
- Tombol "Mulai Irigasi", "Ekspor Data", "Refresh" stack — secukupnya tapi tap target perlu di-check.
- SVG label `fontSize=16` — di mobile (saat svg shrink) bisa unreadable.

### Perangkat (`Perangkat.jsx`)
- Header bar `flex items-start justify-between` — title + paragraph + button. Di mobile button "Tambah Perangkat" mungkin wrap ke baris baru, OK kalau dijaga.
- Card grid `grid-cols-2` — mobile harus single column.
- Card internal grid `grid-cols-2` (Sinyal/Baterai) — masih oke di card width sempit.
- Action row 3 button (Diagnostik / Restart / Hapus) — Diagnostik flex-1, sisanya icon-only. Di mobile masih masuk.

### Peringatan (`Peringatan.jsx`)
- Top bar: Search + "Akui Semua" — `flex items-center gap-3`, search `max-w-xs`. Di mobile button "Akui Semua" ngenakin space, perlu wrap.
- Tab row `flex gap-2` 4 tabs — overflow di < 380px (Semua/Kritis/Peringatan/Info). Perlu horizontal scroll atau pill compact.
- Alert card layout `flex items-start gap-4` dengan kanan ada waktu+button vertikal — kompak tapi buttons "✓ Akui" + delete bisa cramped, perlu test.

### Laporan (`Laporan.jsx`)
- **`grid grid-cols-5`** dengan col-span-2/3 — fatal di mobile. Tidak responsif sama sekali. Harus stack jadi single column < lg.
- Form actions ada "Periode" `grid-cols-2` (4 button) — OK.
- Document row `flex items-center gap-4` — actions `opacity-0 group-hover:opacity-100`. **Hover-only** = ga ada cara akses di mobile (no hover). Wajib selalu visible di mobile.

### Pengaturan (`Pengaturan.jsx`)
- `max-w-3xl` container — fine di all viewports kecuali ultrawide kosong (acceptable).
- Profile section `flex items-center gap-4` — di mobile foto + info + button "Edit Profil" overflow horizontal. Perlu wrap.
- Toggle `w-11 h-6` (44×24) — height < 44px tap target.
- Slider thumb default — kemungkinan kekecilan di touch.

### Modal (`Modal.jsx`)
- `max-w-lg w-full mx-4 max-h-[85vh]` — center modal. Di mobile akan ngambang. Idealnya bottom-sheet < sm. Tapi marginal acceptable kalau scrollable.

### Common Pattern
- Tap targets `p-1.5` icon buttons → 28×28. Wajib minimal `p-2.5` (44×44) di mobile.
- Body font-size: tidak set explicit; default Tailwind 16px → input focus di iOS Safari aman.
- No horizontal scroll bug yang fatal kecuali Laporan + Header.
- Tidak ada media/image responsive issue serius (cuma logo + SVG).

---

## 1.2 Dead Button / No-Feedback Audit

### Header
| Element | Expected | Current | Status |
|---|---|---|---|
| Search button (toggle) | buka input search global | toggle input visibility, Enter cuma toast `🔍 Mencari: "x"` — **ga ada hasil filter di page manapun** | **dead** (visual only) |
| Farm dropdown | filter global | filter jalan + toast | working |
| Time dropdown | filter global | filter jalan (di Overview), tapi di sebagian page (Inteligensi, Perangkat, dll) `selectedTime` ga dipake | **partial** |
| Dark mode toggle (header) | switch theme | toggle local state + toast, tapi `dark:` class ga ada di Tailwind config dan ga ada di body | **dead** |
| Notif bell | dropdown notif | working, click navigate works | working |
| "Lihat Semua Peringatan" | navigate | working | working |
| Avatar → Profile dropdown | menu | working | working |
| Profil Saya / Pengaturan (dropdown) | beda destinasi | dua-duanya navigate ke `/pengaturan` | **partial** (no-feedback / duplicate) |
| Logout | sign-out | toast doang | **dead** (acceptable for demo, tapi tone "👋 Keluar dari akun demo" perlu di-fix) |

### Sidebar
| Element | Status |
|---|---|
| NavLink | working |
| Collapse toggle | working |

### Overview
| Element | Expected | Current | Status |
|---|---|---|---|
| AI Insight "Terapkan Aksi" | apply + visual change + persist | sets local state, toast | partial (state hilang on navigate) |
| AI Insight "Abaikan" | dismiss + persist | local dismiss, hilang on remount | partial |
| MetricCard click | open detail modal | working | working |

### Inteligensi
| Element | Status |
|---|---|
| Terapkan rekomendasi | partial — local state, ga persist |
| Abaikan rekomendasi | partial — sama |
| Lihat Detail risiko | working |

### Lahan
| Element | Expected | Current | Status |
|---|---|---|---|
| Click polygon | open panel | working | working |
| Mulai Irigasi | start + visual indicator | toast x2 + 2s loading, tapi `lahanData.kelembaban` ga update setelahnya | **partial** (no result feedback) |
| Ekspor Data | unduh / progress | toast x2 saja | **partial** (no actual download) |
| Refresh | refresh data | toast x2, data ga refetch | **partial** |
| Close (X) panel | close | working | working |

### Perangkat
| Element | Expected | Current | Status |
|---|---|---|---|
| Tambah Perangkat | open modal + add to list | working + persist in session | working |
| Lihat Diagnostik | open modal | working | working |
| Restart (icon button) | restart sequence | toast doang, ga ada visual state | **partial** (no result, no loading) |
| Hapus (trash icon) | konfirmasi → hapus | langsung hapus tanpa konfirmasi (destruktif!) | **no-feedback / dangerous** |
| Modal: Mulai Ulang | restart | toast | partial |
| Modal: Kalibrasi | kalibrasi | toast | partial |

### Peringatan
| Element | Expected | Current | Status |
|---|---|---|---|
| Tab kategori | switch view | working | working |
| Search | filter | working (no debounce) | working (minor) |
| Akui Semua | acknowledge all | working | working |
| Akui (per item) | acknowledge | working | working |
| Hapus (per item) | konfirmasi → hapus | langsung hapus, no confirm | **dangerous** |
| Card click | open modal | working | working |

### Laporan
| Element | Status |
|---|---|
| Jenis Laporan select | working |
| Lahan select | working |
| Periode buttons | **dead untuk filter** — tersimpan tapi ga mempengaruhi list & ga dipake saat create |
| Format toggle (PDF/CSV) | working untuk create |
| Buat Laporan | working — append ke list |
| Pratinjau (eye) | working modal |
| Unduh | partial — toast + state, no actual file |
| Hapus | working with confirm modal |
| Hover-show actions | **dead di mobile** (no hover) |

### Pengaturan
| Element | Status |
|---|---|
| Edit Profil | working |
| Toggle notifikasi | partial — toast only, no persistence cross-session |
| Slider + Simpan | partial — toast only |
| Mode Gelap toggle | **dead** — visual feedback only (lihat README) |
| Camera overlay (avatar hover) | **dead** — purely visual |

---

## 1.3 Filter Audit

### Filter Inventory
| Filter | Lokasi | Effect | Active Indicator | Reset | Empty State | Persist |
|---|---|---|---|---|---|---|
| Farm | Header global | works (kecuali sebagian page abaikan time) | dropdown shows value | none | per-page (text doang) | no (state hilang on refresh) |
| Time | Header global | partial — hanya Overview chart pakai, sebagian page ga peduli | dropdown shows value | none | n/a | no |
| Search header | Header global | **dead** — no actual filtering | n/a | clear via X | n/a | no |
| Search Peringatan | page | works | masuk input | clear via clear typing | "Tidak ada peringatan cocok dengan 'x'" | no |
| Tab kategori Peringatan | page | works | active tab styled | n/a (tab "Semua") | "Tidak ada peringatan untuk X dalam kategori ini" | no |
| Periode Laporan (last7/30/month/custom) | page | **dead** — value stored, ga affect list, ga dipake saat create | button highlighted | n/a | n/a | no |
| Format Laporan (PDF/CSV) | page | works untuk create | button highlighted | n/a | n/a | no |
| Lahan select Laporan | page | works untuk create | n/a | n/a | n/a | no |

### Anti-pattern Confirmed
- **Periode Laporan dipencet → ga ada perubahan visible**. Klassik dead filter.
- **Header search "Cari lahan, perangkat..."** — cuma toast, ga filter apa-apa di app.
- **Time filter inkonsisten** — Overview & FieldPerformanceChart pake; Inteligensi/Perangkat/Peringatan/Laporan ignore (cek `useOutletContext` — cuma `selectedFarm` di-destructure di sana).
- **No active-filter chip** di top page — user ga liat filter mana yang aktif di luar dropdown header.
- **No result count** kecuali Perangkat (`{devices.length} perangkat terdaftar`) dan Laporan (`{reports.length} dokumen`). Sisanya cuma `(visibleRekoms.length)` kecil di header section.
- **No URL persistence** — refresh = reset.
- **No debounce** di search Peringatan (minor karena dataset kecil).
- **"Custom" date range** di Laporan tidak buka picker — dead.

---

## 1.4 AI-Smell Audit

### Emoji yang harus dibuang
**Toast (mass occurrence)** — `Header.jsx:100,107,114,142,279`, `Overview.jsx:36`, `Inteligensi.jsx:27`, `Lahan.jsx:58,63,70,74,81,85`, `Perangkat.jsx:52,71,76,81,185`, `Peringatan.jsx:52,57,62`, `Laporan.jsx:51,60,67`, `Pengaturan.jsx:15,51,121`:

`📍 Filter:`, `📅 Periode:`, `☀️ Mode Terang`, `🌙 Mode Gelap`, `🔍 Mencari:`, `💧 Memulai irigasi`, `📊 Mengekspor data`, `🔄 Memperbarui data sensor`, `🔄 Memulai ulang`, `🗑️ Perangkat dihapus`, `🗑️ Peringatan dihapus`, `🗑️ Laporan dihapus`, `⚠️ Masukkan nama perangkat`, `⏱️ Kalibrasi`, `👋 Keluar dari akun demo`, `✓` di mana-mana, `✗` di toggle off.

**Button labels & badges**:
- `Header.jsx:225` — `Semua notifikasi telah dibaca ✓`
- `Overview.jsx:82,124` — `Aksi Diterapkan ✓`, `Diterapkan` (cek)
- `Inteligensi.jsx:98` — `Diterapkan ✓`
- `Peringatan.jsx:115` — `Diakui ✓` & `✓ Akui`
- `Lahan.jsx:138` — SVG label `● Lahan A` — bullet glyph mungkin intentional, tapi dengan label component bisa lebih bersih. **Borderline**.

**SVG/decorative bullets**:
- `Lahan.jsx` text node `● Lahan {id}` — lihat di-judge: kalau jadi label "Lahan A" tanpa bullet + dot terpisah lebih clean.

### Generic / Hyped Copy
- `Laporan.jsx:51` — `'✓ Laporan berhasil dibuat!'` — exclamation + "berhasil" + checkmark. AI banget.
- `Pengaturan.jsx:121` — `'✓ Profil berhasil diperbarui'`
- `Perangkat.jsx:71` — `'✓ Perangkat berhasil ditambahkan'`
- `Lahan.jsx:63,74,85` — `'✓ Irigasi pada Lahan X berhasil dimulai'`, `'✓ Data Lahan X berhasil diekspor (CSV)'`, `'✓ Data sensor Lahan X diperbarui'`
- Pattern: **"berhasil + verb + (!)"** di hampir semua action toast. Terlalu enthusiast.
- `Header.jsx:142` — `🔍 Mencari: "${searchQuery}"` — placeholder UX yang sebenernya ga search.

### Placeholder text "lazy"
- `Header.jsx:138` — `"Cari lahan, perangkat..."` — trailing dots
- `Perangkat.jsx:194` — `"Contoh: Sensor Suhu Lahan D"` — OK (specific) actually
- `Peringatan.jsx:77` — `"Cari peringatan..."` — trailing dots

### Mock data palsu
- `Demo User`, `demo@kapori.app`, `+62 812-3456-7890`, role "Administrator". OK untuk prototype, tapi bisa lebih plausible (nama Indonesia: "Andini Pratama" dll).
- Avatar initials "DU" konsisten — fine.
- Per-section data plausible (perangkat, lahan, alerts) — ga liat masalah serius. Akan re-check `data/index.js` saat masuk Phase 2.

### Alert/Feedback Color
- Toast borderLeft selalu `#2D6A4F` (kapori-600) untuk success — konsisten ✓
- Warning toast borderLeft `#F59E0B` amber — fine (muted-ish)
- **Tidak ada error toast** dengan red — semua toast jadi success-toned padahal beberapa adalah error/warning ("Masukkan nama perangkat" pakai amber, harusnya merah lembut)
- Risk card `bg-red-50 border-l-red-400` — muted, OK
- Status dot critical `bg-red-500` — pretty bright tapi OK untuk dot kecil

### Exclamation marks yang berlebihan
Cuma 1: `'✓ Laporan berhasil dibuat!'` — minor.

### Other
- `Header.jsx:202` — badge `{unacknowledgedCount} baru` — fine
- `Header.jsx:225` — `Semua notifikasi telah dibaca ✓` — empty state, drop ✓
- `Pengaturan.jsx:155` — `<span className="badge bg-kapori-800 text-white text-[10px]">DEMO</span>` — OK (intentional demo badge)

---

## Summary (10 bullets)

1. **Layout fundamental ga responsif** — sidebar fixed-width tanpa drawer mode bikin semua page patah < 1024px. Wajib bikin mobile nav (drawer/bottom-nav).
2. **Header right cluster overflow di < 640px** — 2 dropdown + 3 icon button + avatar, plus search expand. Perlu collapse ke icon-only / kebab menu di mobile.
3. **Grids hardcode `grid-cols-2/3/5`** di Overview, Inteligensi, Perangkat, Laporan — semua butuh responsive variants (`grid-cols-1 sm: md: lg:`).
4. **Laporan `grid-cols-5` + hover-only actions** — fatal di mobile, action ga reachable. Wajib stack & always-visible.
5. **Header search bar = dummy** — ga filter apa-apa, cuma toast. Worst dead button di app.
6. **Time filter di-ignore di 4-5 page** — Inteligensi/Perangkat/Peringatan/Laporan abaikan `selectedTime`. Atau (a) bikin time filter context-aware (sembunyiin kalau ga relevan), (b) implement filter-nya, atau (c) buang.
7. **Periode Laporan + Custom date** = dead filter — tersimpan tapi ga affect list maupun create.
8. **Hapus tanpa konfirmasi** di Perangkat & Peringatan — destruktif. Konsisten-kan dengan Laporan yang udah pake confirm modal.
9. **Toast kebanjiran emoji + "berhasil + !"** — pattern ini di 18+ tempat. Wajib ganti tone manusiawi tanpa emoji.
10. **Tap targets `p-1.5` (~28px)** banyak — harus jadi 44×44 minimal di mobile (Modal close, Sidebar collapse, header icons, action icons di card).

---

## Pertanyaan Klarifikasi

1. **Audience copy** — tone Bahasa Indonesia formal-casual (saat ini) tetap dipertahankan, atau perlu lebih netral/profesional? (Misal `'Tugas dibuat'` vs `'Berhasil membuat laporan'`.)
2. **Time filter scope** — di Inteligensi/Perangkat/Peringatan/Laporan filter waktu memang **tidak relevan** (lo cuma butuh filter farm), atau emang harusnya ada effect? Kalau ga relevan, gue sembunyiin time dropdown di header per-page.
3. **Search header global** — fitur search globalnya mau diimplementasi (search across lahan/perangkat/laporan/alert) atau search bar-nya gue **buang aja** dari header? Kalau implement, posisi flow-nya gimana (dropdown hasil instan, atau navigate ke page hasil)?

---

## Rekomendasi Urutan Kerja

1. **Layout + Header** dulu (fondasi mobile nav, drawer, header collapse) — semua page benefit.
2. **Modal + common UI** (bottom-sheet di mobile, tap targets, focus rings, toast tone refactor) — sweep cepat sekali jadi.
3. **Per page (urutan critical-first):**
   - **Laporan** (paling rusak: grid-5 + hover-only + dead filter)
   - **Overview** (highest-traffic; AI insight grid-4; metric grid)
   - **Lahan** (detail panel mobile + buttons)
   - **Perangkat** (delete confirm + grid responsif)
   - **Peringatan** (tabs scroll + delete confirm)
   - **Inteligensi** (grids; minor)
   - **Pengaturan** (profile row wrap; toggle/slider tap target)
4. **De-AI sweep** terakhir — replace-all toast strings, buang emoji global, tone polish.
5. **Verify pass** — walkthrough 320/414/768/1280/1920 manual.

Total estimate: kerja per page rata-rata 1 commit. ~10 commit total.
