// Ported from extra/baufinanzierungsrechner.py (a React mockup, despite the .py extension).
// All figures/rates below are exactly as sourced in the original: Interhyp live queries and
// GNotKG Anlage 2 anchors from 04.08.2026 — see the disclaimer text rendered at the bottom of
// BaufinanzierungRechner.vue for the full sourcing notes.

export const GRUNDERWERBSTEUER = {
  'Baden-Württemberg': 5.0,
  Bayern: 3.5,
  Berlin: 6.0,
  Brandenburg: 6.5,
  Bremen: 5.5,
  Hamburg: 5.5,
  Hessen: 6.0,
  'Mecklenburg-Vorpommern': 6.0,
  Niedersachsen: 5.0,
  'Nordrhein-Westfalen': 6.5,
  'Rheinland-Pfalz': 5.0,
  Saarland: 6.5,
  Sachsen: 5.5,
  'Sachsen-Anhalt': 5.0,
  'Schleswig-Holstein': 6.5,
  Thüringen: 5.0,
}

// GNotKG "Tabelle B" 1.0-Gebühr is a degressive step function of the Geschäftswert, not a flat
// percentage. Anchors are linearly interpolated between, a close approximation of the real step
// curve for typical Kaufpreis ranges.
const GNOTKG_ANCHORS = [
  [0, 0],
  [1500, 23],
  [13000, 83],
  [125000, 300],
  [280000, 585],
  [350000, 685],
]

function gebuehrTabelleB(wert) {
  if (wert <= 0) return 0
  for (let i = 1; i < GNOTKG_ANCHORS.length; i++) {
    const [x0, y0] = GNOTKG_ANCHORS[i - 1]
    const [x1, y1] = GNOTKG_ANCHORS[i]
    if (wert <= x1) {
      const t = (wert - x0) / (x1 - x0)
      return y0 + t * (y1 - y0)
    }
  }
  const [x0, y0] = GNOTKG_ANCHORS[GNOTKG_ANCHORS.length - 2]
  const [x1, y1] = GNOTKG_ANCHORS[GNOTKG_ANCHORS.length - 1]
  const slope = (y1 - y0) / (x1 - x0)
  return y1 + slope * (wert - x1)
}

// Beurkundung (2,0x) + Vollzug (0,5x) + Betreuung/Fälligkeitsmitteilung (0,5x) = 3,0x Gebühr,
// zzgl. 19% MwSt. Auflassungsvormerkung (0,5x) + Eigentumsumschreibung (1,0x) = 1,5x Gebühr, keine
// MwSt. Grundschuldbestellung + -eintragung approximated over Kaufpreis, calibrated against a
// real example (270.000€ → 4.860€).
export function notarUndGrundbuchkosten(kaufpreis) {
  const g = gebuehrTabelleB(kaufpreis)
  const notar = g * 3.0 * 1.19
  const grundbuch = g * 1.5
  const grundschuldZusatz = kaufpreis * 0.0075
  const gesamt = notar + grundbuch + grundschuldZusatz
  return { gesamt, effektivProzent: kaufpreis > 0 ? (gesamt / kaufpreis) * 100 : 0 }
}

export const ZB_JAHRE = [5, 10, 15, 20]

// Base rates for 10 Jahre Zinsbindung, keyed by Beleihungsauslauf (LTV) band, measured 04.08.2026.
function baseRate10J(ltvPercent) {
  if (ltvPercent > 100) return { rate: 4.38, measured: true }
  if (ltvPercent > 95) return { rate: 4.37, measured: true }
  if (ltvPercent > 85) return { rate: 4.26, measured: true }
  if (ltvPercent > 80) return { rate: 4.03, measured: true }
  return { rate: 3.95, measured: true }
}

// Deltas vs. 10 Jahre, measured at ~100% LTV. The curve is humped/inverted — 10J is cheapest.
const ZB_DELTA = { 5: 0.03, 10: 0, 15: 0.26, 20: 0.39 }

function marketZins(ltvPercent, jahre) {
  const base = baseRate10J(ltvPercent)
  const delta = ZB_DELTA[jahre] ?? 0
  return { rate: Math.max(base.rate + delta, 0.1), measured: base.measured }
}

function effektivAus(sollProJahr) {
  const m = sollProJahr / 100 / 12
  return (Math.pow(1 + m, 12) - 1) * 100
}

export function computeSchedule(loan, zinsPct, tilgungPct, sondertilgungJahr = 0) {
  const monthlyRate = zinsPct / 100 / 12
  const payment = (loan * (zinsPct + tilgungPct)) / 100 / 12
  let balance = loan
  const yearly = [{ year: 0, balance }]
  let month = 0
  const maxMonths = 45 * 12
  let payoffMonth = null

  while (balance > 0.5 && month < maxMonths) {
    month++
    const interest = balance * monthlyRate
    let principal = payment - interest
    if (principal <= 0) break
    if (principal > balance) principal = balance
    balance -= principal
    if (month % 12 === 0 && balance > 0 && sondertilgungJahr > 0) {
      balance = Math.max(balance - sondertilgungJahr, 0)
    }
    if (month % 12 === 0) {
      yearly.push({ year: month / 12, balance: Math.max(balance, 0) })
    }
  }
  if (balance <= 0.5) payoffMonth = month

  return { yearly, payment, payoffMonth }
}

export function computeBaufinanzierung(inputs) {
  const {
    kaufpreis,
    bundesland,
    zzglMakler,
    maklerProzent,
    mitModernisierung,
    modernisierungskosten,
    eigenkapital,
    tilgung,
    rateMode,
    zielRate,
    sondertilgungJahr,
    selectedZb,
    overrides,
    nettoeinkommen,
    mitfinanzierende,
    partnerEinkommen,
    mieteinnahmen,
    sonstigeEinnahmen,
    mtlKreditrate,
  } = inputs

  const grest = GRUNDERWERBSTEUER[bundesland] ?? 5.0
  const grestBetrag = (kaufpreis * grest) / 100
  const { gesamt: notarBetrag, effektivProzent: notarProzent } = notarUndGrundbuchkosten(kaufpreis)
  const maklerBetrag = zzglMakler ? (kaufpreis * maklerProzent) / 100 : 0
  const modKosten = mitModernisierung ? modernisierungskosten : 0
  const nebenkosten = grestBetrag + notarBetrag + maklerBetrag
  const gesamtkosten = kaufpreis + nebenkosten + modKosten
  const darlehenExakt = Math.max(gesamtkosten - eigenkapital, 0)
  const darlehen = Math.ceil(darlehenExakt / 1000) * 1000
  const ltv = kaufpreis > 0 ? (darlehen / kaufpreis) * 100 : 0

  const rows = ZB_JAHRE.map(jahre => {
    const model = marketZins(ltv, jahre)
    const zins = overrides[jahre] ?? model.rate
    const isOverridden = overrides[jahre] !== undefined
    const eff = effektivAus(zins)

    let tilgungForRow = tilgung
    let rateUnterDeckt = false
    if (rateMode && darlehen > 0) {
      const impliedTilgung = ((zielRate * 12) / darlehen) * 100 - zins
      if (impliedTilgung <= 0.05) {
        rateUnterDeckt = true
        tilgungForRow = 0.05
      } else {
        tilgungForRow = impliedTilgung
      }
    }

    const { yearly, payment, payoffMonth } = computeSchedule(darlehen, zins, tilgungForRow, sondertilgungJahr)
    const zbPoint = yearly.find(p => p.year === jahre) || yearly[yearly.length - 1]
    const restschuld = zbPoint ? zbPoint.balance : darlehen
    const gesamtlaufzeitJahre = payoffMonth ? Math.ceil(payoffMonth / 12) : null
    const anzahlRaten = payoffMonth || jahre * 12
    const angenommeneKosten = payoffMonth ? payment * payoffMonth : payment * jahre * 12 * 2

    return {
      jahre,
      zins,
      eff,
      tilgung: tilgungForRow,
      payment,
      restschuld,
      gesamtlaufzeitJahre,
      anzahlRaten,
      yearly,
      angenommeneKosten,
      isOverridden,
      measured: model.measured,
      rateUnterDeckt,
    }
  })

  const selected = rows.find(r => r.jahre === selectedZb) || rows[0]

  const gesamteinnahmen = nettoeinkommen + (mitfinanzierende ? partnerEinkommen : 0) + mieteinnahmen + sonstigeEinnahmen
  const belastung = (selected?.payment || 0) + mtlKreditrate
  const belastungsquote = gesamteinnahmen > 0 ? (belastung / gesamteinnahmen) * 100 : 0

  const eigenkapitalDeckt = eigenkapital >= nebenkosten

  return {
    grest,
    notarProzent,
    grestBetrag,
    notarBetrag,
    maklerBetrag,
    modKosten,
    nebenkosten,
    gesamtkosten,
    darlehen,
    darlehenExakt,
    ltv,
    rows,
    selected,
    gesamteinnahmen,
    belastung,
    belastungsquote,
    eigenkapitalDeckt,
  }
}

// Transparent per-criterion scoring instead of a black-box single score.
export function computeBewertung(calc, { kaufpreis, eigenkapital }) {
  const bq = calc.belastungsquote
  const ekQuote = kaufpreis > 0 ? (eigenkapital / kaufpreis) * 100 : 0
  const tilgungWert = calc.selected.tilgung
  const restAnteil = calc.darlehen > 0 ? (calc.selected.restschuld / calc.darlehen) * 100 : 0
  const ltv = calc.ltv

  const kriterien = [
    {
      name: 'Tragfähigkeit (Rate/Einkommen)',
      wert: bq > 0 ? `${bq.toFixed(0)}%` : '–',
      status: bq <= 0 ? 'unbekannt' : bq <= 35 ? 'gut' : bq <= 40 ? 'mittel' : 'schwach',
      hinweis:
        bq <= 0
          ? 'Bitte Nettoeinkommen angeben.'
          : bq <= 35
            ? 'Komfortable Spanne, Banken sehen das gern.'
            : bq <= 40
              ? 'Noch vertretbar, aber wenig Puffer für Unvorhergesehenes.'
              : 'Über der üblichen Bankgrenze, viele Institute lehnen hier ab oder verlangen mehr Eigenkapital.',
    },
    {
      name: 'Eigenkapitalquote',
      wert: `${ekQuote.toFixed(0)}% vom Kaufpreis`,
      status: !calc.eigenkapitalDeckt ? 'schwach' : ekQuote >= 20 ? 'gut' : ekQuote >= 10 ? 'mittel' : 'schwach',
      hinweis: !calc.eigenkapitalDeckt
        ? 'Deckt nicht einmal die Kaufnebenkosten, das schränkt die Bankauswahl real ein.'
        : ekQuote >= 20
          ? 'Solide Basis, verbessert typischerweise auch den Zinssatz.'
          : ekQuote >= 10
            ? 'Grundsolide, mehr Eigenkapital würde den Zins meist weiter verbessern.'
            : 'Knapp über den Kaufnebenkosten, wenig Verhandlungsspielraum bei der Bank.',
    },
    {
      name: 'Tilgungshöhe',
      wert: `${tilgungWert.toFixed(2)}%`,
      status: tilgungWert >= 2 ? 'gut' : tilgungWert >= 1 ? 'mittel' : 'schwach',
      hinweis:
        tilgungWert >= 2
          ? 'Entspricht der von Vermittlern empfohlenen Mindesttilgung im aktuellen Zinsumfeld.'
          : tilgungWert >= 1
            ? 'Etwas niedrig, die Laufzeit verlängert sich dadurch deutlich.'
            : 'Sehr niedrig, das Darlehen wird nur sehr langsam abgebaut.',
    },
    {
      name: 'Restschuldrisiko nach Zinsbindung',
      wert: `${restAnteil.toFixed(0)}% des Darlehens offen`,
      status: restAnteil <= 50 ? 'gut' : restAnteil <= 75 ? 'mittel' : 'schwach',
      hinweis:
        restAnteil <= 50
          ? 'Weniger als die Hälfte muss zu unbekannten Zukunftskonditionen weiterfinanziert werden.'
          : restAnteil <= 75
            ? 'Ein größerer Teil bleibt vom Zinsrisiko der Anschlussfinanzierung betroffen.'
            : 'Der Großteil des Darlehens hängt noch an der ungewissen Anschlussfinanzierung.',
    },
    {
      name: 'Beleihung (LTV)',
      wert: `${ltv.toFixed(0)}%`,
      status: ltv <= 80 ? 'gut' : ltv <= 95 ? 'mittel' : 'schwach',
      hinweis:
        ltv <= 80
          ? 'Im günstigsten gemessenen Zinsband.'
          : ltv <= 95
            ? 'Mittleres Beleihungsband, leicht über dem günstigsten Zinsniveau.'
            : 'Hohe Beleihung, das oberste Zinsband greift hier.',
    },
  ]

  const schwaechen = kriterien.filter(k => k.status === 'schwach').length
  const unbekannt = kriterien.some(k => k.status === 'unbekannt')
  let gesamt, gesamtStatus
  if (unbekannt) {
    gesamt = 'Noch nicht vollständig einschätzbar'
    gesamtStatus = 'unbekannt'
  } else if (schwaechen === 0) {
    gesamt = 'Solide Finanzierung über alle Kriterien'
    gesamtStatus = 'gut'
  } else if (schwaechen === 1) {
    gesamt = 'Grundsätzlich tragfähig, ein Punkt verdient Aufmerksamkeit'
    gesamtStatus = 'mittel'
  } else {
    gesamt = 'Mehrere Schwachpunkte, vor Abschluss noch einmal prüfen'
    gesamtStatus = 'schwach'
  }

  return { kriterien, gesamt, gesamtStatus }
}
