import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PDFDocument } from 'pdf-lib'

// ---- Page geometry, measured directly off the reference LaTeX output ----
// US Letter, default `article` class (no geometry package) — 612 x 792 pt.
const PAGE_W = 612
const PAGE_H = 792
const TEXT_WIDTH = 343.72 // matches \includegraphics[width=\textwidth]
const MARGIN_X = (PAGE_W - TEXT_WIDTH) / 2
const TOP_OFFSET = 124.8 // page top -> top of first image
const GAP = 15.17 // \vspace{0.5cm} as it actually renders

function usePreviewUrl(file) {
  return useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
}

function Slot({ index, label, file, onFile }) {
  const inputRef = useRef(null)
  const url = usePreviewUrl(file)
  const [dragging, setDragging] = useState(false)
  const [hovering, setHovering] = useState(false)

  return (
    <div className="flex-1">
      <motion.div
        onClick={() => inputRef.current.click()}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onDragOver={(e) => {
          e.preventDefault()
          if (!dragging) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onFile(f)
        }}
        animate={
          dragging
            ? { scale: 1.03, boxShadow: '0 0 0 2px rgba(22,163,74,0.6), 0 0 32px 6px rgba(22,163,74,0.35)' }
            : { scale: 1, boxShadow: '0 0 0 0 rgba(22,163,74,0)' }
        }
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className="relative aspect-[4/3] rounded-2xl bg-[var(--paper-panel)] border border-[var(--line)] cursor-pointer group overflow-hidden"
      >
        {/* animated corner brackets, ID-slot style */}
        {['top-0 left-0 rounded-tl-2xl border-t-2 border-l-2', 'top-0 right-0 rounded-tr-2xl border-t-2 border-r-2', 'bottom-0 left-0 rounded-bl-2xl border-b-2 border-l-2', 'bottom-0 right-0 rounded-br-2xl border-b-2 border-r-2'].map(
          (pos, i) => (
            <motion.span
              key={i}
              animate={{
                borderColor: dragging ? 'var(--brass)' : hovering ? 'var(--gold)' : 'var(--brass)',
                opacity: dragging ? 1 : hovering ? 0.9 : 0.55,
              }}
              transition={{ duration: 0.25 }}
              className={`absolute ${pos} w-5 h-5 pointer-events-none`}
            />
          )
        )}

        {/* scanning sweep while dragging */}
        <AnimatePresence>
          {dragging && (
            <motion.div
              initial={{ x: '-120%' }}
              animate={{ x: '120%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[var(--brass)]/20 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
        />

        <AnimatePresence mode="wait">
          {url ? (
            <motion.img
              key={url}
              src={url}
              alt={label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full h-full object-contain p-3"
            />
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center text-[var(--ink-soft)]"
            >
              <motion.span
                animate={{ y: hovering ? [0, -4, 0] : 0 }}
                transition={{ duration: 1.1, repeat: hovering ? Infinity : 0, ease: 'easeInOut' }}
                className="font-mono text-xs tracking-widest text-[var(--brass)]"
              >
                {`0${index}`}
              </motion.span>
              <span className="text-sm mt-1">Drop or click</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* replace overlay on hover when filled */}
        <AnimatePresence>
          {url && hovering && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-[var(--paper)]/60 backdrop-blur-sm"
            >
              <span className="font-mono text-[11px] uppercase tracking-widest text-[var(--gold)]">
                Replace image
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-[var(--ink-soft)] mt-2 text-center">
        {label}
      </p>
    </div>
  )
}

function ProofSheet({ img1, img2 }) {
  const u1 = usePreviewUrl(img1)
  const u2 = usePreviewUrl(img2)
  const [dims1, setDims1] = useState(null)
  const [dims2, setDims2] = useState(null)

  const marginXPct = (MARGIN_X / PAGE_W) * 100
  const textWidthPct = (TEXT_WIDTH / PAGE_W) * 100
  const topPct = (TOP_OFFSET / PAGE_H) * 100
  const gapPct = (GAP / PAGE_H) * 100

  const h1Pct = dims1 ? ((TEXT_WIDTH * (dims1.h / dims1.w)) / PAGE_H) * 100 : 0
  const h2Pct = dims2 ? ((TEXT_WIDTH * (dims2.h / dims2.w)) / PAGE_H) * 100 : 0

  return (
    <div className="mx-auto" style={{ width: '58%', maxWidth: 220 }}>
      <div
        className="relative bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_-8px_rgba(0,0,0,0.5)] border border-[var(--line)] rounded-sm"
        style={{ aspectRatio: `${PAGE_W} / ${PAGE_H}` }}
      >
        <div
          className="absolute bg-[var(--paper)]/70 outline outline-1 outline-dashed outline-[var(--line-hi)] flex items-center justify-center overflow-hidden"
          style={{ left: `${marginXPct}%`, width: `${textWidthPct}%`, top: `${topPct}%`, height: u1 ? `${h1Pct}%` : '22%' }}
        >
          {u1 ? (
            <img
              src={u1}
              alt=""
              className="w-full h-full object-fill"
              onLoad={(e) => setDims1({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            />
          ) : (
            <span className="font-mono text-[9px] text-[var(--ink-soft)]">image 1</span>
          )}
        </div>
        <div
          className="absolute bg-[var(--paper)]/70 outline outline-1 outline-dashed outline-[var(--line-hi)] flex items-center justify-center overflow-hidden"
          style={{
            left: `${marginXPct}%`,
            width: `${textWidthPct}%`,
            top: `${topPct + h1Pct + gapPct}%`,
            height: u2 ? `${h2Pct}%` : '22%',
          }}
        >
          {u2 ? (
            <img
              src={u2}
              alt=""
              className="w-full h-full object-fill"
              onLoad={(e) => setDims2({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
            />
          ) : (
            <span className="font-mono text-[9px] text-[var(--ink-soft)]">image 2</span>
          )}
        </div>
      </div>
      <p className="text-center font-mono text-[10px] tracking-widest text-[var(--ink-soft)] mt-3">
        LETTER · 612 × 792 PT
      </p>
    </div>
  )
}

export default function App() {
  const [img1, setImg1] = useState(null)
  const [img2, setImg2] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function readImage(file) {
    const bytes = await file.arrayBuffer()
    const dims = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
    return { bytes, dims, type: file.type }
  }

  async function embed(pdfDoc, bytes, type) {
    return type.includes('png') ? pdfDoc.embedPng(bytes) : pdfDoc.embedJpg(bytes)
  }

  async function generatePDF() {
    setError('')
    if (!img1 || !img2) {
      setError('Both slots need an image before the page can be assembled.')
      return
    }
    setBusy(true)
    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([PAGE_W, PAGE_H])

      const [a, b] = await Promise.all([readImage(img1), readImage(img2)])
      const [emb1, emb2] = await Promise.all([
        embed(pdfDoc, a.bytes, a.type),
        embed(pdfDoc, b.bytes, b.type),
      ])

      const h1 = TEXT_WIDTH * (a.dims.h / a.dims.w)
      const h2 = TEXT_WIDTH * (b.dims.h / b.dims.w)

      const y1 = PAGE_H - TOP_OFFSET - h1
      const y2 = y1 - GAP - h2

      page.drawImage(emb1, { x: MARGIN_X, y: y1, width: TEXT_WIDTH, height: h1 })
      page.drawImage(emb2, { x: MARGIN_X, y: y2, width: TEXT_WIDTH, height: h2 })

      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'figure.pdf'
      link.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      setError('The page could not be assembled: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-14">
      <div className="w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="font-mono text-xs tracking-[0.25em] text-[var(--gold)] uppercase mb-3">
            Proof Sheet
          </p>
          <h1 className="font-display text-[var(--ink)] text-4xl uppercase">Assemble your figure page</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-3 leading-relaxed">
            Drop two images into the slots below. They're placed full width with a 0.5&nbsp;cm
            gap, on a Letter page — matching the default LaTeX <span className="font-mono text-xs text-[var(--brass)]">article</span> class
            output — and exported as a real PDF, entirely in your browser.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[var(--paper-panel)] border border-[var(--line)] rounded-2xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.35)]"
        >
          <div className="flex gap-5">
            <Slot index={1} label="Image 1" file={img1} onFile={setImg1} />
            <Slot index={2} label="Image 2" file={img2} onFile={setImg2} />
          </div>

          <div className="my-8 h-px bg-[var(--line)]" />

          <ProofSheet img1={img1} img2={img2} />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-6 text-sm text-center text-[#ff8a7a] bg-[#8a3324]/[0.15] border border-[#8a3324]/40 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-center">
            <motion.button
              onClick={generatePDF}
              disabled={busy}
              whileHover={{ scale: busy ? 1 : 1.04, boxShadow: '0 6px 28px rgba(22,163,74,0.5)' }}
              whileTap={{ scale: busy ? 1 : 0.96 }}
              className="font-mono text-xs tracking-widest uppercase bg-gradient-to-r from-[var(--brass-dark)] to-[var(--brass)] disabled:opacity-40 disabled:cursor-not-allowed text-white px-8 py-3.5 rounded-xl transition-colors"
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full"
                  />
                  Assembling…
                </span>
              ) : (
                'Export PDF'
              )}
            </motion.button>
          </div>
        </motion.div>

        <p className="text-center font-mono text-[11px] text-[var(--ink-soft)] mt-6">
          No upload, no server — the PDF is built locally on your device.
        </p>
      </div>
    </div>
  )
}
