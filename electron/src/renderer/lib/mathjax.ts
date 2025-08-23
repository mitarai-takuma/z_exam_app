// Lazy-load and configure MathJax once per app (electron renderer)
let mathJaxPromise: Promise<any> | null = null

export async function ensureMathJax(): Promise<any> {
  if (typeof window === 'undefined') return null
  if (mathJaxPromise) return mathJaxPromise

  ;(window as any).MathJax = (window as any).MathJax || {
    tex: {
      inlineMath: [
        ['$', '$'],
        ['\\(', '\\)'],
      ],
      displayMath: [
        ['$$', '$$'],
        ['\\[', '\\]'],
      ],
      processEscapes: true,
      packages: { '[+]': ['noerrors', 'noundefined'] },
    },
    // CommonHTML output tuning to avoid vertical clipping in tight line boxes
    // Ref: MathJax v3 docs - chtml.matchFontHeight
    chtml: {
      matchFontHeight: false,
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
    },
  }

  mathJaxPromise = import('mathjax/es5/tex-mml-chtml.js').then(() => {
    return (window as any).MathJax
  })
  return mathJaxPromise
}
