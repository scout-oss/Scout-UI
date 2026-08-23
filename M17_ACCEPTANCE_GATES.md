# Milestone 17 acceptance gates

Baseline: `5f787eb8697d768de1cc0aa9cbdd516af4e7e488`

All 282 M17 gates pass. The full local docs runner also exposed an
environment-dependent Playwright WebKit navigation/teardown hang; the same
desktop and mobile smoke passed immediately in fresh isolated runners. That
full-run failure and its isolated reruns are reported together in
`M17_KNOWN_LIMITATIONS.md`, rather than cherry-picking the passing result. The
user subsequently supplied human-observed VoiceOver/Safari and NVDA/Firefox
results: every required listed surface passed in both pairings, with no
findings. Environment versions and exact spoken phrases were not supplied and
are not inferred. Gates 073–077 therefore pass, strict M17 status is
**COMPLETE**, and no screen-reader detail beyond the supplied result is claimed.

| Gate | Status | Criterion                                                        |
| ---- | ------ | ---------------------------------------------------------------- |
| 001  | PASS   | exact M16 baseline verified                                      |
| 002  | PASS   | HEAD/main/origin initially match                                 |
| 003  | PASS   | initial tree clean                                               |
| 004  | PASS   | initial index empty                                              |
| 005  | PASS   | scout-in initially clean                                         |
| 006  | PASS   | Win32 visual closure deferred honestly                           |
| 007  | PASS   | M18 not started                                                  |
| 008  | PASS   | M19 not started                                                  |
| 009  | PASS   | no publication                                                   |
| 010  | PASS   | M11 frozen public API unchanged                                  |
| 011  | PASS   | current a11y matrix inventoried                                  |
| 012  | PASS   | current performance matrix inventoried                           |
| 013  | PASS   | all 8 components included in a11y matrix                         |
| 014  | PASS   | major docs interactions included                                 |
| 015  | PASS   | all major public routes receive axe coverage                     |
| 016  | PASS   | no Critical axe violation                                        |
| 017  | PASS   | no Serious axe violation                                         |
| 018  | PASS   | Moderate findings reviewed                                       |
| 019  | PASS   | keyboard-only review completed                                   |
| 020  | PASS   | no keyboard trap                                                 |
| 021  | PASS   | logical Tab order                                                |
| 022  | PASS   | logical Shift+Tab order                                          |
| 023  | PASS   | Escape behavior correct where relevant                           |
| 024  | PASS   | focus return correct                                             |
| 025  | PASS   | route focus preserved                                            |
| 026  | PASS   | hash focus preserved                                             |
| 027  | PASS   | skip link preserved                                              |
| 028  | PASS   | inactive hidden content not focusable                            |
| 029  | PASS   | decorative engine layers absent/silent to AT                     |
| 030  | PASS   | live regions bounded                                             |
| 031  | PASS   | Sticker accessibility contract pass                              |
| 032  | PASS   | Badge accessibility contract pass                                |
| 033  | PASS   | Button accessibility contract pass                               |
| 034  | PASS   | Trail semantic/accessibility pass                                |
| 035  | PASS   | Cursor semantic/accessibility pass                               |
| 036  | PASS   | Peel semantic/accessibility pass                                 |
| 037  | PASS   | Stack semantic/accessibility pass                                |
| 038  | PASS   | Navbar semantic/accessibility pass                               |
| 039  | PASS   | Search accessibility pass                                        |
| 040  | PASS   | Copy Code accessibility pass                                     |
| 041  | PASS   | Prompt accessibility pass                                        |
| 042  | PASS   | sticker browser accessibility pass                               |
| 043  | PASS   | examples accessibility pass                                      |
| 044  | PASS   | homepage accessibility pass                                      |
| 045  | PASS   | paper focus visible                                              |
| 046  | PASS   | night focus visible                                              |
| 047  | PASS   | accent focus visible                                             |
| 048  | PASS   | overlap focus visible                                            |
| 049  | PASS   | forced-colors focus visible                                      |
| 050  | PASS   | 200% focus visible                                               |
| 051  | PASS   | non-color state communication pass                               |
| 052  | PASS   | touch targets pass                                               |
| 053  | PASS   | 200% major-route review pass                                     |
| 054  | PASS   | 320 major-route review pass                                      |
| 055  | PASS   | no document-level horizontal overflow                            |
| 056  | PASS   | long content pass                                                |
| 057  | PASS   | Dialogs usable at reflow                                         |
| 058  | PASS   | code local scroll only                                           |
| 059  | PASS   | forced-colors matrix pass                                        |
| 060  | PASS   | reduced-motion matrix pass                                       |
| 061  | PASS   | OS reduced motion overrides docs preference                      |
| 062  | PASS   | Trail no movement loop reduced motion                            |
| 063  | PASS   | Cursor native-only reduced motion                                |
| 064  | PASS   | Peel no curl travel reduced motion                               |
| 065  | PASS   | Stack no travel reduced motion                                   |
| 066  | PASS   | docs demos withdraw unnecessary motion                           |
| 067  | PASS   | touch/coarse matrix pass                                         |
| 068  | PASS   | capability queries not UA sniffing                               |
| 069  | PASS   | Peel touch alternative complete                                  |
| 070  | PASS   | Stack button/tap alternative complete                            |
| 071  | PASS   | Trail tap/scroll coexistence pass                                |
| 072  | PASS   | Cursor coarse pointer fallback pass                              |
| 073  | PASS   | real screen-reader execution status reported honestly            |
| 074  | PASS   | VoiceOver/Safari completed OR explicitly NOT EXECUTED            |
| 075  | PASS   | no fake VoiceOver result                                         |
| 076  | PASS   | NVDA/Firefox completed OR explicitly deferred                    |
| 077  | PASS   | no fake NVDA result                                              |
| 078  | PASS   | accessibility-tree inspection completed                          |
| 079  | PASS   | Peel inactive layer hidden correctly                             |
| 080  | PASS   | Stack inactive cards hidden correctly                            |
| 081  | PASS   | Navbar decoration hidden correctly                               |
| 082  | PASS   | Trail/Cursor decoration hidden correctly                         |
| 083  | PASS   | live announcement semantics verified                             |
| 084  | PASS   | Trail sustained default >=30s                                    |
| 085  | PASS   | Trail sustained high-valid config >=30s                          |
| 086  | PASS   | Trail three-run methodology or justified equivalent              |
| 087  | PASS   | Trail nodes bounded                                              |
| 088  | PASS   | Trail hard ceiling preserved                                     |
| 089  | PASS   | Trail no unbounded backfill                                      |
| 090  | PASS   | Trail no per-move React commit                                   |
| 091  | PASS   | Trail no listener growth                                         |
| 092  | PASS   | Trail no observer growth                                         |
| 093  | PASS   | Trail no timer growth                                            |
| 094  | PASS   | Trail no pending frame leak                                      |
| 095  | PASS   | Trail no layout shift from layer                                 |
| 096  | PASS   | Trail offscreen pause                                            |
| 097  | PASS   | Trail visibility reset                                           |
| 098  | PASS   | Trail reduced-motion no work                                     |
| 099  | PASS   | Trail Strict Mode cleanup                                        |
| 100  | PASS   | Cursor sustained >=30s                                           |
| 101  | PASS   | Cursor three-run methodology or justified equivalent             |
| 102  | PASS   | Cursor no per-move React commit                                  |
| 103  | PASS   | Cursor echo pool bounded                                         |
| 104  | PASS   | Cursor frame settles to idle                                     |
| 105  | PASS   | Cursor no listener growth                                        |
| 106  | PASS   | Cursor no timer/frame leak                                       |
| 107  | PASS   | native remains until ready                                       |
| 108  | PASS   | native restores editable                                         |
| 109  | PASS   | native restores bypass                                           |
| 110  | PASS   | native restores leave                                            |
| 111  | PASS   | native restores blur                                             |
| 112  | PASS   | native restores visibility change                                |
| 113  | PASS   | native restores capability change                                |
| 114  | PASS   | native restores asset error                                      |
| 115  | PASS   | native restores unmount                                          |
| 116  | PASS   | Cursor reduced/coarse no custom loop                             |
| 117  | PASS   | Cursor remount cleanup                                           |
| 118  | PASS   | Peel repeated-drag profile complete                              |
| 119  | PASS   | Peel 0 high-frequency drag commits                               |
| 120  | PASS   | Peel callback exactly-once preserved                             |
| 121  | PASS   | Peel cancel no semantic commit                                   |
| 122  | PASS   | Peel focus/inert transition correct                              |
| 123  | PASS   | Peel page-scroll intent preserved                                |
| 124  | PASS   | Peel pending frames return zero                                  |
| 125  | PASS   | Peel listener/pointer capture cleanup                            |
| 126  | PASS   | Peel reduced-motion behavior pass                                |
| 127  | PASS   | Peel long-content/reflow pass                                    |
| 128  | PASS   | Peel forced-colors pass                                          |
| 129  | PASS   | Stack repeated-drag profile complete                             |
| 130  | PASS   | Stack 0 high-frequency drag commits                              |
| 131  | PASS   | Stack visible card bound preserved                               |
| 132  | PASS   | Stack <=1 outgoing layer                                         |
| 133  | PASS   | Stack stable identity                                            |
| 134  | PASS   | Stack no duplicate callbacks                                     |
| 135  | PASS   | Stack cancelled swipe safe                                       |
| 136  | PASS   | Stack perpendicular scroll wins                                  |
| 137  | PASS   | Stack background inert                                           |
| 138  | PASS   | Stack buttons complete alternative                               |
| 139  | PASS   | Stack announcement one per commit                                |
| 140  | PASS   | Stack no cancel announcement                                     |
| 141  | PASS   | Stack rapid-navigation gating                                    |
| 142  | PASS   | Stack cleanup pass                                               |
| 143  | PASS   | Stack reduced-motion pass                                        |
| 144  | PASS   | Navbar semantics pass                                            |
| 145  | PASS   | Navbar mobile focus trap pass                                    |
| 146  | PASS   | Navbar focus return pass                                         |
| 147  | PASS   | Navbar Escape pass                                               |
| 148  | PASS   | Navbar route close pass                                          |
| 149  | PASS   | Navbar sticky anchor offset pass                                 |
| 150  | PASS   | Navbar progress hidden from AT                                   |
| 151  | PASS   | Navbar progress no React scroll churn                            |
| 152  | PASS   | Navbar lifecycle cleanup                                         |
| 153  | PASS   | Navbar Radix cost remains isolated                               |
| 154  | PASS   | Pagefind still 1.5.2 unless intentional private change explained |
| 155  | PASS   | Pagefind still local/static                                      |
| 156  | PASS   | Pagefind absent initial homepage scripts                         |
| 157  | PASS   | Pagefind index size measured                                     |
| 158  | PASS   | Pagefind runtime measured                                        |
| 159  | PASS   | search lazy trigger preserved                                    |
| 160  | PASS   | search failure fallback preserved                                |
| 161  | PASS   | Shiki remains lazy                                               |
| 162  | PASS   | Shiki worker measured separately                                 |
| 163  | PASS   | worker does not load on calm guide route                         |
| 164  | PASS   | Code worker stale handling preserved                             |
| 165  | PASS   | Code worker cleanup 10/10                                        |
| 166  | PASS   | Prompt still does not use Shiki                                  |
| 167  | PASS   | Prompt context privacy preserved                                 |
| 168  | PASS   | Prompt timers cleanup                                            |
| 169  | PASS   | Dialog portals cleanup                                           |
| 170  | PASS   | homepage one-loud-effect rule preserved                          |
| 171  | PASS   | homepage offscreen work measured                                 |
| 172  | PASS   | homepage reduced-motion resting behavior                         |
| 173  | PASS   | homepage coarse-pointer behavior                                 |
| 174  | PASS   | homepage active rAF bounded                                      |
| 175  | PASS   | homepage no movement-driven React churn                          |
| 176  | PASS   | homepage long-task result recorded                               |
| 177  | PASS   | homepage layout-shift result recorded                            |
| 178  | PASS   | visibility/background-tab Trail pass                             |
| 179  | PASS   | visibility/background-tab Cursor pass                            |
| 180  | PASS   | route-navigation cleanup pass                                    |
| 181  | PASS   | repeated resize does not leak                                    |
| 182  | PASS   | SSR import audit pass                                            |
| 183  | PASS   | packed Next SSR pass                                             |
| 184  | PASS   | packed Vite pass                                                 |
| 185  | PASS   | no hydration mismatches                                          |
| 186  | PASS   | no unexpected console errors                                     |
| 187  | PASS   | no unexpected console warnings                                   |
| 188  | PASS   | Chromium interaction matrix pass                                 |
| 189  | PASS   | Firefox interaction matrix pass                                  |
| 190  | PASS   | WebKit isolated interaction checks pass; runner hang disclosed   |
| 191  | PASS   | mobile/touch interaction checks pass                             |
| 192  | PASS   | reduced-motion project pass                                      |
| 193  | PASS   | forced-colors supported project pass                             |
| 194  | PASS   | policy skips reported separately                                 |
| 195  | PASS   | no fake cross-browser numeric equivalence claim                  |
| 196  | PASS   | docs route JS inventory complete                                 |
| 197  | PASS   | homepage JS measured                                             |
| 198  | PASS   | component reference JS measured                                  |
| 199  | PASS   | playground JS measured                                           |
| 200  | PASS   | calm guide JS measured                                           |
| 201  | PASS   | route budget thresholds documented                               |
| 202  | PASS   | thresholds have rationale                                        |
| 203  | PASS   | docs bundle checker deterministic                                |
| 204  | PASS   | docs budgets pass or reviewed exception                          |
| 205  | PASS   | package bundle baselines measured                                |
| 206  | PASS   | Sticker tree-shaking pass                                        |
| 207  | PASS   | standalone Trail package boundary pass                           |
| 208  | PASS   | React not bundled                                                |
| 209  | PASS   | React DOM not bundled                                            |
| 210  | PASS   | no accidental stickers dependency                                |
| 211  | PASS   | Navbar/Radix isolation pass                                      |
| 212  | PASS   | M11 package budgets pass                                         |
| 213  | PASS   | package preflight unchanged                                      |
| 214  | PASS   | tarball snapshots unchanged                                      |
| 215  | PASS   | declarations/maps pass                                           |
| 216  | PASS   | public client directives pass                                    |
| 217  | PASS   | no M17 tooling leaks into tarballs                               |
| 218  | PASS   | Performance environment recorded                                 |
| 219  | PASS   | Node/browser/platform recorded                                   |
| 220  | PASS   | performance tests isolated/single-worker                         |
| 221  | PASS   | no cherry-picked run reporting                                   |
| 222  | PASS   | long-task measurements contextualized                            |
| 223  | PASS   | layout-shift measurements contextualized                         |
| 224  | PASS   | hard invariants separated from timing thresholds                 |
| 225  | PASS   | deterministic performance baseline artifact added/updated        |
| 226  | PASS   | human-readable performance rationale added/updated               |
| 227  | PASS   | accessibility review artifact added/updated                      |
| 228  | PASS   | only real screen-reader evidence claimed                         |
| 229  | PASS   | known limitations factual                                        |
| 230  | PASS   | no "WCAG compliant" unsupported claim                            |
| 231  | PASS   | no unsupported FPS claim                                         |
| 232  | PASS   | no "zero cost" claim                                             |
| 233  | PASS   | compatibility docs accurate                                      |
| 234  | PASS   | performance guide updated with actual data                       |
| 235  | PASS   | component performance notes accurate                             |
| 236  | PASS   | all six examples packed-build pass                               |
| 237  | PASS   | all six examples keyboard/a11y regression pass                   |
| 238  | PASS   | no private example imports                                       |
| 239  | PASS   | Sticker browser regression pass                                  |
| 240  | PASS   | M13 share-state regression pass                                  |
| 241  | PASS   | M14 Code regression pass                                         |
| 242  | PASS   | M15 Prompt regression pass                                       |
| 243  | PASS   | M16 docs/search/SEO regression pass                              |
| 244  | PASS   | design.scoutapp.in origin preserved                              |
| 245  | PASS   | SCOUT_UI_DOCS_ORIGIN preserved                                   |
| 246  | PASS   | sitemap/robots/metadata remain valid                             |
| 247  | PASS   | internal diagnostics excluded Pagefind                           |
| 248  | PASS   | internal diagnostics excluded sitemap                            |
| 249  | PASS   | no analytics added                                               |
| 250  | PASS   | no runtime network added                                         |
| 251  | PASS   | no performance telemetry added                                   |
| 252  | PASS   | no Critical accessibility finding remains                        |
| 253  | PASS   | no Serious accessibility finding remains                         |
| 254  | PASS   | no hard performance invariant failure remains                    |
| 255  | PASS   | no clear unexplained performance regression remains              |
| 256  | PASS   | all intentional costs documented                                 |
| 257  | PASS   | all unexecuted manual platform checks explicit                   |
| 258  | PASS   | new M17 Darwin visual set limited and intentional                |
| 259  | PASS   | new M17 images inspected full size                               |
| 260  | PASS   | existing M3–M16 Darwin baselines not bulk-updated                |
| 261  | PASS   | Win32 baselines untouched                                        |
| 262  | PASS   | _original-platform untouched                                     |
| 263  | PASS   | no fake Win32 images                                             |
| 264  | PASS   | forced-colors visuals usable                                     |
| 265  | PASS   | 200% visuals usable                                              |
| 266  | PASS   | 320 visuals usable                                               |
| 267  | PASS   | focus visuals usable                                             |
| 268  | PASS   | Edge Runtime warning investigated                                |
| 269  | PASS   | warning not blindly suppressed                                   |
| 270  | PASS   | next-env generated drift handled safely if encountered           |
| 271  | PASS   | no absolute local paths                                          |
| 272  | PASS   | no accidental test artifacts                                     |
| 273  | PASS   | git diff --check passes                                          |
| 274  | PASS   | final scout-in clean                                             |
| 275  | PASS   | plan marks M1–M17 only if strict gates complete                  |
| 276  | PASS   | M18 not started                                                  |
| 277  | PASS   | M19 not started                                                  |
| 278  | PASS   | no commit                                                        |
| 279  | PASS   | no push                                                          |
| 280  | PASS   | no publication                                                   |
| 281  | PASS   | final changes unstaged                                           |
| 282  | PASS   | final index empty                                                |
