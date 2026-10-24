Fonts used when burning subtitles (libass `fontsdir`). All are SIL Open Font License 1.1, from https://github.com/google/fonts
(Anuphan, Noto Sans Thai and Inter are static Regular/Bold instances cut from the variable fonts).

`metrics.json`: per family, (usWinAscent + usWinDescent) / unitsPerEm. libass treats ASS `Fontsize` as that line height
instead of the CSS em, so the generator multiplies the size by this factor to match the editor preview.
Add a font here (Regular + Bold .ttf) and a metrics.json entry when you add one to the editor's FontSelector.
