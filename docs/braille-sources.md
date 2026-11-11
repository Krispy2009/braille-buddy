# Braille data: source check

Checked on 11 November 2026 against `src/courses/greek.json` (24 letters + 8 letter pairs) and `src/courses/english.json` (26 letters). No file under `src/` was changed.

## Bottom line

- Every one of the 24 Greek letters and 26 English letters in our files agrees with every source that gave dots.
- All 8 Greek letter pairs agree with the two sources that gave dots for them (Wikipedia, and the liblouis `el.ctb` table).
- **However, no primary source I could open printed the dot numbers.** The one authoritative reference named in the brief, *World Braille Usage* (3rd ed., 2013), has a Greek chapter (p. 183), but the copy I could retrieve was cut off partway through the Denmark entry, so I did not read that chapter. See "What I could and could not read".
- Confidence therefore is: **"matches secondary sources, independently consistent", not "confirmed in a primary source I read"**, with the partial exception noted for the English letters.
- Open doubt: ηυ (see Discrepancies and doubts).

Confidence labels used below:
- **Primary**: an official code book or standards body text I actually read, showing the dots.
- **Secondary**: Wikipedia, a software table, or a description of a primary source.
- **Not shown**: source retrieved but did not give dots for this item.

## Greek letters

Sources: **W** = Wikipedia "Greek Braille" (secondary; read via fetch). **L** = liblouis `el.ctb` Greek table (secondary/software; read via fetch). The tool returned a summary of each page, not raw text, so dot numbers are as reported by that summary. Other sources I opened did not give dots (see source list).

| Letter | Our dots | W | L | Match |
|---|---|---|---|---|
| α | 1 | 1 | 1 | yes |
| β | 12 | 12 | 12 | yes |
| γ | 1245 | 1245 | 1245 | yes |
| δ | 145 | 145 | 145 | yes |
| ε | 15 | 15 | 15 | yes |
| ζ | 1356 | 1356 | 1356 | yes |
| η | 345 | 345 | 345 | yes |
| θ | 1456 | 1456 | 1456 | yes |
| ι | 24 | 24 | 24 | yes |
| κ | 13 | 13 | 13 | yes |
| λ | 123 | 123 | 123 | yes |
| μ | 134 | 134 | 134 | yes |
| ν | 1345 | 1345 | 1345 | yes |
| ξ | 1346 | 1346 | 1346 | yes |
| ο | 135 | 135 | 135 | yes |
| π | 1234 | 1234 | 1234 | yes |
| ρ | 1235 | 1235 | 1235 | yes |
| σ | 234 | 234 | 234 | yes |
| τ | 2345 | 2345 | 2345 | yes |
| υ | 13456 | 13456 | 13456 | yes |
| φ | 124 | 124 | 124 | yes |
| χ | 125 | 125 | 125 | yes |
| ψ | 12346 | 12346 | 12346 | yes |
| ω | 245 | 245 | 245 | yes |

The Wikipedia article cites (as listed on the page): Kouroupetroglou and Phlorias, "Ελληνικό σύστημα Braille" in *Επιστημονικά σύμβολα κατά Braille στον ελληνικό χώρο*; UNESCO (2013) *World Braille Usage*, 3rd ed.; and a brl.org page "Session 2: Greek alphabet and alphabetic indicators". So Wikipedia's table is likely derived from World Braille Usage, but I could not confirm that by reading it. The liblouis header names the Greek Center for Education and Rehabilitation for the Blind (ΚΕΑΤ) as the origin of the "Greek Braille System" but I did not see a document from KEAT itself.

Most Greek letters share a cell with the Latin letter in the same alphabet position or sound (for example α=a, β=b, γ=g, δ=d), which is my own observation from the tables and not a claim from a source.

## Greek letter pairs (highest risk)

| Pair | Our dots | W | L | Other sources | Match |
|---|---|---|---|---|---|
| αι | 126 | 126 | 126 | listed as a one-cell sign (Papadimitriou & Argyropoulos 2020; Katsoulis; Grekas 2020) | yes |
| ει | 146 | 146 | 146 | same three | yes |
| οι | 246 | 246 | 246 | same three | yes |
| υι | 12456 | 12456 | 12456 | same three | yes |
| αυ | 16 | 16 | 16 | Papadimitriou & Argyropoulos 2020; Grekas 2020 list it. Katsoulis: only a table of contents, not shown | yes |
| ευ | 156 | 156 | 156 | same as αυ | yes |
| ηυ | 1256 | 1256 | 1256 | **Papadimitriou & Argyropoulos 2020 do not list it** (their list of single-sign diphthongs is οι, ου, αυ, ευ, αι, ει, υι). Katsoulis TOC lists only αι, ει, οι, υι, ου. Grekas 2020 does list ηυ (table exists, dots not readable) | yes on dots; **doubt on status** |
| ου | 136 | 136 | 136 | all three list it | yes |

What this shows:
- Seven of the eight pairs are listed as single-cell signs in current Greek-language educational literature (a 2020 University of Thessaly paper and a 2020 University of Athens thesis). Their dot numbers match W and L.
- The Papadimitriou and Argyropoulos paper (2020) says the Greek code is alphabetic "with the sole exception of the vowel diphthongs (οι, ου, αυ, ευ, αι, ει, υι) which are represented by one character". That is a published statement that these seven are part of the code a learner reads today. It does not give the dots, and it does not say whether using them is compulsory.
- **ηυ**: the dots (1256) agree in two secondary sources and the University of Athens thesis has a table of eight diphthongs that, per the summary I read, includes ηυ. But two Greek sources I read list only seven (or five) diphthongs and leave out ηυ. I could not tell whether ηυ is a normal part of the standard code or a rarer or optional sign. This needs a native check (see Open questions).
- The sources I read do not say whether these pair signs are mandatory or optional in everyday writing, nor whether older and newer Greek codes differ. A 2005 article (grissh.gr, "Η ελληνική τυφλική γραφή: προβλήματα και προοπτικές", *Επιστήμες Αγωγής* no. 2, pp. 169-180) says Greek braille lacks contractions of the kind used in other languages and argues for introducing them; that concerns word contractions, not these diphthong signs, and it gives no dots.
- Missing pairs: the sources I read list no pair beyond the eight (the seven above plus ηυ). The liblouis table treats these as the only diphthong contractions. Nothing suggests our list is missing one, but I could not read World Braille Usage to be sure.

## English letters

Sources: **R** = *The Rules of Unified English Braille*, 2nd ed., 2013 (ICEB). **B** = Wikipedia "Braille" (secondary).

| Letter | Our dots | R | B | Match |
|---|---|---|---|---|
| a | 1 | 1 | 1 | yes |
| b | 12 | 12 | 12 | yes |
| c | 14 | 14 | 14 | yes |
| d | 145 | 145 | 145 | yes |
| e | 15 | 15 | 15 | yes |
| f | 124 | 124 | 124 | yes |
| g | 1245 | 1245 | 1245 | yes |
| h | 125 | 125 | 125 | yes |
| i | 24 | 24 | 24 | yes |
| j | 245 | 245 | 245 | yes |
| k | 13 | 13 | 13 | yes |
| l | 123 | 123 | 123 | yes |
| m | 134 | 134 | 134 | yes |
| n | 1345 | 1345 | 1345 | yes |
| o | 135 | 135 | 135 | yes |
| p | 1234 | 1234 | 1234 | yes |
| q | 12345 | 12345 | 12345 | yes |
| r | 1235 | 1235 | 1235 | yes |
| s | 234 | 234 | 234 | yes |
| t | 2345 | 2345 | 2345 | yes |
| u | 136 | 136 | 136 | yes |
| v | 1236 | 1236 | 1236 | yes |
| w | 2456 | not shown | 2456 | yes (secondary only) |
| x | 1346 | 1346 | 1346 | yes |
| y | 13456 | 13456 | 13456 | yes |
| z | 1356 | 1356 | 1356 | yes |

Caveats: the fetch tool could not show me the UEB alphabet table (section 4.1) itself. The values in column R were derived by the tool from the braille-order description in section 1.1.2 of the Rules, not quoted from a table, and the dots for w were not given. Wikipedia's table states it is derived from cell patterns and Unicode, and cites no specific source for the table. Treat the English letters as correct (this is the universal alphabet and agrees everywhere), but the "confirmed in primary" label is only partial. For the file as written, `english.json` contains the correct 26 cells: 25 matched ICEB-derived values, w matched Wikipedia only.

## Sources

Full titles, publishers, years and URLs are given only for what I retrieved.

1. **World Braille Usage, Third Edition.** Perkins; International Council on English Braille; National Library Service for the Blind and Physically Handicapped, Library of Congress. Washington, D.C., 2013.
   URL: https://www.govinfo.gov/content/pkg/GOVPUB-LC19-PURL-gpo38772/pdf/GOVPUB-LC19-PURL-gpo38772.pdf
   **What I read:** title page, copyright page, contents and the early country entries only. The text I received ended partway through the Denmark entry. The contents list "Greek" at p. 183 and "Greek (International)" at p. 185, the Cyprus entry says "Greek Alphabet: See Greek, page 183", and the introduction says there are two codes for Greek. **I did not read the Greek chapter, so this source confirms nothing about the dots.** Other pages: https://www.pathstoliteracy.org/resource/world-braille-usage (a description page only; it says the 226-page document is downloadable).
2. **Greek Braille.** Wikipedia. https://en.wikipedia.org/wiki/Greek_Braille. Read (via summary). Source of the Greek dots, pairs, accent (dot 5), capital sign (dots 46), and the note that no separate final sigma is described. Also notes digits are the same as in English braille and that sampi and stigma are assigned oppositely in World Braille Usage and brl.org. Secondary.
3. **liblouis `el.ctb`**, "LibLouis table for both modern and ancient Greek braille", copyright 2017 Dave Mielke, LGPL 2.1. https://nest-open-source.googlesource.com/manifest_repos/liblouis-github/+/refs/heads/main/tables/el.ctb. Read (via summary). Software table; gives letters, the eight pairs, accents, capital sign 46, final sigma, number sign 3456. Secondary; the header names KEAT's "Greek Braille System" but I did not see that document.
4. **liblouis `grc-international-en.utb`.** https://nest-open-source.googlesource.com/manifest_repos/liblouis-github/+/refs/heads/main/tables/grc-international-en.utb. Read (via summary). It is for classical and biblical Greek, says that code is not used in Greece, and cites World Braille Usage p. 185. Not relevant to modern letters; mentioned for completeness.
5. **Papadimitriou, V. and Argyropoulos, V.** "Κώδικας Braille και αλφαβητική στρατηγική ανάγνωσης: Ανάλυση λαθών και εφαρμογές στην εκπαίδευση" (Alphabetic Reading Strategy and Braille: Error Analysis and Instruction). *Επιστήμες Αγωγής* (University of Thessaly), issue 3, 2020. https://ejournals.lib.uoc.gr/edusci/article/download/1220/1113/2220. Read. No dot numbers; states seven diphthongs are single signs and does not mention ηυ. (The fetch summary was unsure of the first author's first name; I give initials only.)
6. **Grekas, Stylianos D.** «Η σημειογραφία της βυζαντινής μουσικής στη γραφή Braille». University of Athens, Department of Music Studies, 2020. https://pergamos.lib.uoa.gr/uoa/dl/frontend/file/lib/default/data/2921298/theFile. Read. Has a Greek alphabet table and a diphthong table (Table 2) listing all eight pairs, but the patterns came through as blank dot grids with no numbers, so I could not read the dots. States capital indicator dots 4,6 and number indicator dots 3,4,5,6.
7. **Katsoulis, Philippos.** «Εκπαίδευση στη διδασκαλία για την ανάγνωση και γραφή Braille». Publisher and year not stated on the page. https://iepx.iep.edu.gr/static/PDF/braille/P411-ENOTHTES-TOY-MATHIMATOS.pdf. Only the table of contents was readable: section 8 "Ο ελληνικός λογοτεχνικός κώδικας Braille", 8.4 diphthongs (αι, ει, οι, υι, ου). No dots. The listing of five does not mention αυ, ευ, ηυ but a table of contents may be abbreviated.
8. **Simpson, Christine (ed.).** *The Rules of Unified English Braille*, Second Edition. International Council on English Braille, 2013. https://iceb.org/Rules%20of%20Unified%20English%20Braille%202013.pdf. Read via summary; the alphabet table (section 4.1) body was not visible; see English caveats above. The 2024 third edition (https://iceb.org/Rules%20of%20Unified%20English%20Braille%202024.pdf) also showed only a table of contents for the alphabet.
9. **Braille.** Wikipedia. https://en.wikipedia.org/wiki/Braille. Read (via summary). Letters a-z including w. Secondary; no specific source for the table.
10. **Pages opened that gave nothing useful for dots:** Wikipedia "English Braille"; Omniglot "Braille for Latin and Greek" (https://www.omniglot.com/writing/braille_grecoroman.php; says diphthongs are contracted but gives no cells); Duxbury "Greek, Classical-American" table page (capital sign 46 only); SimBraille Greek letters PDF on pathstoliteracy.org (uses SimBraille text codes, not dots; no diphthongs); SYMBRAILLE links page (University of Athens; links only); Mylona 2004 (Ioannina thesis) and Paloumpa 2007 (Patras thesis): relevant sections not in the text received; Garoufos and Gavriilidou 2024 (*Hellenic Journal of Research in Education* 13(2)): general cell description only; the 2005 grissh.gr article (see above).
11. **Could not open:** "Greek Braille System" PDF at access.uoa.gr (refused by the site's robots.txt, nothing retrieved). Not found by search at all: any publication by KEAT or the Panhellenic Association of the Blind giving the table, and anything from the Cyprus School for the Blind or the Cyprus Ministry of Education that gives braille dots. A Cyprus ministry search result (enimerosi.moec.gov.cy) was returned but I did not open it.

## Discrepancies and doubts

- **No discrepancy in dots was found** for any letter or pair in either file.
- **Doubt about ηυ.** Dots match secondary sources, but it is absent from two Greek educational lists of the diphthong signs (Papadimitriou and Argyropoulos 2020; Katsoulis TOC) while present in Grekas 2020. It may be rare, optional or older. Note also that ηυ is a genuinely uncommon pair in Modern Greek text (as in ηύρα). Recommend a native or school check before teaching it as standard.
- **Doubt about status of all pairs.** I found no text saying whether the pair signs are compulsory or optional in current Greek or Cypriot braille. They are listed as part of the Greek code in 2020 educational sources, which is good evidence they are current.
- **Cyprus.** I found no Cyprus-specific source. The World Braille Usage Cyprus entry reportedly just refers to the Greek chapter, which suggests Cyprus uses the same alphabet, but I only saw that cross-reference, not the chapter.

## Open questions and future work

1. Read the Greek chapter (p. 183) of *World Braille Usage* 3rd ed. from the Perkins page (https://www.perkins.org/resource/world-braille-usage/) or the Library of Congress copy; it should settle the letters, the pairs and ηυ in one go. This is the single most valuable check.
2. Ask the Cyprus School for the Blind or KEAT whether (a) ηυ is taught as standard, (b) the pair signs are compulsory, (c) there are any pairs not in our list, (d) the Cyprus alphabet is identical.
3. Get a blind Greek-reading teacher or learner to review the whole table before release.
4. Features a learner will need that the data does not have (note only, not added):
   - **Accent (tonos):** dot 5 placed before the vowel or pair (Wikipedia, liblouis), after the capital sign. Other accents/breathings exist in liblouis for polytonic Greek (grave 4, circumflex 6); not needed for modern monotonic Greek.
   - **Capital sign:** dots 46 before the letter (Wikipedia, liblouis, Grekas 2020); capital word sign 46-46 (liblouis only).
   - **Final sigma ς:** sources say it uses the same cell as σ (234); nothing extra to teach.
   - **Numbers:** number sign dots 3456 (liblouis, Grekas 2020), then the digits as in English braille (Wikipedia). Letters a-j serve as digits 1-0.
   - **Dialytika (diaeresis):** liblouis says it is not shown in braille; unconfirmed by a primary source.
   - Obsolete letters (stigma, digamma, koppa, sampi): sources disagree on cells (Wikipedia notes World Braille Usage and brl.org assign sampi and stigma oppositely). Out of scope.
5. English: if exact UEB confirmation matters, read section 4.1 of the 2024 Rules of UEB directly in a PDF viewer and confirm w (2456) from the text.
