import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const fmtEUR = (n) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(n || 0)));

const fmtEURp = (n) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Math.max(0, n || 0));

const fmtPct = (n) => `${n.toFixed(2).replace(".", ",")} %`;

const GRUNDERWERBSTEUER = {
  "Baden-Württemberg": 5.0,
  "Bayern": 3.5,
  "Berlin": 6.0,
  "Brandenburg": 6.5,
  "Bremen": 5.5,
  "Hamburg": 5.5,
  "Hessen": 6.0,
  "Mecklenburg-Vorpommern": 6.0,
  "Niedersachsen": 5.0,
  "Nordrhein-Westfalen": 6.5,
  "Rheinland-Pfalz": 5.0,
  "Saarland": 6.5,
  "Sachsen": 5.5,
  "Sachsen-Anhalt": 5.0,
  "Schleswig-Holstein": 6.5,
  "Thüringen": 5.0,
};

// --- Notar- und Grundbuchkosten nach GNotKG ---
// The GNotKG "Tabelle B" 1.0-Gebühr is a degressive step function of the
// Geschäftswert, not a flat percentage. Anchor points below are verified
// from official/cited GNotKG Anlage 2 references (04.08.2026); values
// between anchors are linearly interpolated, which is a close approximation
// of the real step curve for typical Kaufpreis ranges.
const GNOTKG_ANCHORS = [
  [0, 0],
  [1500, 23],
  [13000, 83],
  [125000, 300],
  [280000, 585],
  [350000, 685],
];

function gebuehrTabelleB(wert) {
  if (wert <= 0) return 0;
  for (let i = 1; i < GNOTKG_ANCHORS.length; i++) {
    const [x0, y0] = GNOTKG_ANCHORS[i - 1];
    const [x1, y1] = GNOTKG_ANCHORS[i];
    if (wert <= x1) {
      const t = (wert - x0) / (x1 - x0);
      return y0 + t * (y1 - y0);
    }
  }
  const [x0, y0] = GNOTKG_ANCHORS[GNOTKG_ANCHORS.length - 2];
  const [x1, y1] = GNOTKG_ANCHORS[GNOTKG_ANCHORS.length - 1];
  const slope = (y1 - y0) / (x1 - x0);
  return y1 + slope * (wert - x1);
}

// Beurkundung (2,0x) + Vollzug (0,5x) + Betreuung/Fälligkeitsmitteilung (0,5x)
// = 3,0x Gebühr, zzgl. 19% MwSt (Notare sind umsatzsteuerpflichtig).
// Auflassungsvormerkung (0,5x) + Eigentumsumschreibung (1,0x) = 1,5x Gebühr,
// keine MwSt (Grundbuchamt ist eine staatliche Stelle).
// Zusätzlich: Grundschuldbestellung + -eintragung für den finanzierten Teil,
// angenähert über den Kaufpreis (vermeidet eine Zirkelbeziehung zum
// Darlehensbetrag), calibriert gegen ein reales Beispiel (270.000€ → 4.860€).
function notarUndGrundbuchkosten(kaufpreis) {
  const g = gebuehrTabelleB(kaufpreis);
  const notar = g * 3.0 * 1.19;
  const grundbuch = g * 1.5;
  const grundschuldZusatz = kaufpreis * 0.0075;
  const gesamt = notar + grundbuch + grundschuldZusatz;
  return { gesamt, effektivProzent: kaufpreis > 0 ? (gesamt / kaufpreis) * 100 : 0 };
}

// Zinsbindung options offered
const ZB_JAHRE = [5, 10, 15, 20];

// --- Real-market rate model ---
// Derived from live Interhyp Baufinanzierungsrechner queries on 04.08.2026
// (Karlsruhe, 2% Tilgung). Base rates are for 10 Jahre Zinsbindung, keyed by
// Beleihungsauslauf (LTV) band. Deltas adjust for other Zinsbindungen.
// All bands below are directly measured, including <=80%: contrary to some
// marketing pages advertising rates near 3,3% at 80% LTV, this generic
// calculator (no income/Bonität input) showed the curve flattening out
// around 3,9-4,0% from 80% down to 60% LTV. The advertised lower figures
// likely require a specific Bonität profile this tool doesn't ask for.
function baseRate10J(ltvPercent) {
  if (ltvPercent > 100) return { rate: 4.38, measured: true };
  if (ltvPercent > 95) return { rate: 4.37, measured: true };
  if (ltvPercent > 85) return { rate: 4.26, measured: true };
  if (ltvPercent > 80) return { rate: 4.03, measured: true };
  return { rate: 3.95, measured: true };
}

// Deltas vs. 10 Jahre, measured at ~100% LTV on 04.08.2026.
// Note: the curve is currently humped/inverted — 10J is the cheapest point.
const ZB_DELTA = { 5: 0.03, 10: 0, 15: 0.26, 20: 0.39 };

function marketZins(ltvPercent, jahre) {
  const base = baseRate10J(ltvPercent);
  const delta = ZB_DELTA[jahre] ?? 0;
  return { rate: Math.max(base.rate + delta, 0.1), measured: base.measured };
}

function effektivAus(sollProJahr) {
  const m = sollProJahr / 100 / 12;
  return (Math.pow(1 + m, 12) - 1) * 100;
}

function computeSchedule(loan, zinsPct, tilgungPct, sondertilgungJahr = 0) {
  const monthlyRate = zinsPct / 100 / 12;
  const payment = (loan * (zinsPct + tilgungPct)) / 100 / 12;
  let balance = loan;
  const yearly = [{ year: 0, balance }];
  let month = 0;
  const maxMonths = 45 * 12;
  let payoffMonth = null;

  while (balance > 0.5 && month < maxMonths) {
    month++;
    const interest = balance * monthlyRate;
    let principal = payment - interest;
    if (principal <= 0) break;
    if (principal > balance) principal = balance;
    balance -= principal;
    if (month % 12 === 0 && balance > 0 && sondertilgungJahr > 0) {
      balance = Math.max(balance - sondertilgungJahr, 0);
    }
    if (month % 12 === 0) {
      yearly.push({ year: month / 12, balance: Math.max(balance, 0) });
    }
  }
  if (balance <= 0.5) payoffMonth = month;

  return { yearly, payment, payoffMonth };
}

function Tab({ active, onClick, label, icon }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-1.5 pb-2 pt-1"
      style={{
        borderBottom: active ? "2px solid #16213D" : "2px solid #D8D3C7",
        color: active ? "#16213D" : "#8A8272",
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block mb-4">
      <span
        className="block text-xs uppercase tracking-wider mb-1.5"
        style={{ color: "#5B6472", letterSpacing: "0.07em" }}
      >
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-xs mt-1" style={{ color: "#8A8272" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function NumInput({ value, onChange, suffix, step = 1 }) {
  return (
    <div
      className="flex items-center rounded-md overflow-hidden border"
      style={{ borderColor: "#D8D3C7", background: "#FFFFFF" }}
    >
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full px-3 py-2.5 text-base outline-none bg-transparent"
        style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D" }}
      />
      {suffix && (
        <span
          className="px-3 text-sm"
          style={{ color: "#8A8272", fontFamily: "'IBM Plex Mono', monospace" }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-md border outline-none text-base bg-white"
      style={{ borderColor: "#D8D3C7", color: "#16213D" }}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
      <span
        className="relative inline-block w-9 h-5 rounded-full transition-colors"
        style={{ background: checked ? "#16213D" : "#D8D3C7" }}
        onClick={() => onChange(!checked)}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ left: checked ? 18 : 2 }}
        />
      </span>
      <span className="text-sm" style={{ color: "#3A3527" }} onClick={() => onChange(!checked)}>
        {label}
      </span>
    </label>
  );
}

function Segmented({ options, value, onChange, render }) {
  return (
    <div className="flex gap-2 mb-4">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className="flex-1 py-2.5 rounded-md text-sm transition-colors"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            background: value === o ? "#16213D" : "#FFFFFF",
            color: value === o ? "#F6F3EC" : "#16213D",
            border: "1px solid #D8D3C7",
          }}
        >
          {render ? render(o) : o}
        </button>
      ))}
    </div>
  );
}

export default function BaufinanzierungsrechnerPro() {
  const [tab, setTab] = useState("immobilie");

  // Immobilie
  const [immobilienart, setImmobilienart] = useState("Eigentumswohnung");
  const [kaufpreis, setKaufpreis] = useState(400000);
  const [zzglMakler, setZzglMakler] = useState(false);
  const [maklerProzent, setMaklerProzent] = useState(3.57);
  const [mitModernisierung, setMitModernisierung] = useState(false);
  const [modernisierungskosten, setModernisierungskosten] = useState(0);
  const [bundesland, setBundesland] = useState("Baden-Württemberg");
  const [nutzung, setNutzung] = useState("Selbstnutzung");

  // Person
  const [alter, setAlter] = useState(35);
  const [beschaeftigung, setBeschaeftigung] = useState("Angestellte:r");
  const [nettoeinkommen, setNettoeinkommen] = useState(4000);
  const [mitfinanzierende, setMitfinanzierende] = useState(false);
  const [partnerEinkommen, setPartnerEinkommen] = useState(0);
  const [eigenkapital, setEigenkapital] = useState(80000);

  // Optional
  const [wohnflaeche, setWohnflaeche] = useState(0);
  const [baujahr, setBaujahr] = useState(0);
  const [mieteinnahmen, setMieteinnahmen] = useState(0);
  const [sonstigeEinnahmen, setSonstigeEinnahmen] = useState(0);
  const [mtlKreditrate, setMtlKreditrate] = useState(0);

  // Finanzierungsspielraum
  const [tilgung, setTilgung] = useState(2.0);
  const [rateMode, setRateMode] = useState(false); // false = Tilgung vorgeben, true = Rate vorgeben
  const [zielRate, setZielRate] = useState(1200);
  const [sondertilgungJahr, setSondertilgungJahr] = useState(0);
  const [selectedZb, setSelectedZb] = useState(10);
  const [showDetails, setShowDetails] = useState(false);
  // Manual per-Zinsbindung overrides, e.g. once a real bank quote is in hand
  const [overrides, setOverrides] = useState({});

  const calc = useMemo(() => {
    const grest = GRUNDERWERBSTEUER[bundesland] ?? 5.0;
    const grestBetrag = (kaufpreis * grest) / 100;
    const { gesamt: notarBetrag, effektivProzent: notarProzent } = notarUndGrundbuchkosten(kaufpreis);
    const maklerBetrag = zzglMakler ? (kaufpreis * maklerProzent) / 100 : 0;
    const modKosten = mitModernisierung ? modernisierungskosten : 0;
    const nebenkosten = grestBetrag + notarBetrag + maklerBetrag;
    const gesamtkosten = kaufpreis + nebenkosten + modKosten;
    const darlehenExakt = Math.max(gesamtkosten - eigenkapital, 0);
    const darlehen = Math.ceil(darlehenExakt / 1000) * 1000;
    const ltv = kaufpreis > 0 ? (darlehen / kaufpreis) * 100 : 0;

    const rows = ZB_JAHRE.map((jahre) => {
      const model = marketZins(ltv, jahre);
      const zins = overrides[jahre] ?? model.rate;
      const isOverridden = overrides[jahre] !== undefined;
      const eff = effektivAus(zins);

      // Either Tilgung is given (classic) or a target Mtl. Rate is given and
      // Tilgung is solved backward: Rate = Darlehen * (Zins + Tilgung) / 100 / 12
      let tilgungForRow = tilgung;
      let rateUnterDeckt = false;
      if (rateMode && darlehen > 0) {
        const impliedTilgung = (zielRate * 12) / darlehen * 100 - zins;
        if (impliedTilgung <= 0.05) {
          rateUnterDeckt = true;
          tilgungForRow = 0.05; // floor so the loan still amortizes minimally
        } else {
          tilgungForRow = impliedTilgung;
        }
      }

      const { yearly, payment, payoffMonth } = computeSchedule(darlehen, zins, tilgungForRow, sondertilgungJahr);
      const zbPoint =
        yearly.find((p) => p.year === jahre) || yearly[yearly.length - 1];
      const restschuld = zbPoint ? zbPoint.balance : darlehen;
      const gesamtlaufzeitJahre = payoffMonth ? Math.ceil(payoffMonth / 12) : null;
      const anzahlRaten = payoffMonth || jahre * 12;
      const angenommeneKosten = payoffMonth ? payment * payoffMonth : payment * jahre * 12 * 2;

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
      };
    });

    const selected = rows.find((r) => r.jahre === selectedZb) || rows[0];

    const gesamteinnahmen =
      nettoeinkommen +
      (mitfinanzierende ? partnerEinkommen : 0) +
      mieteinnahmen +
      sonstigeEinnahmen;
    const belastung = (selected?.payment || 0) + mtlKreditrate;
    const belastungsquote = gesamteinnahmen > 0 ? (belastung / gesamteinnahmen) * 100 : 0;

    const eigenkapitalDeckt = eigenkapital >= nebenkosten;

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
    };
  }, [
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
  ]);

  const setOverride = (jahre, val) => {
    setOverrides((prev) => ({ ...prev, [jahre]: val }));
  };
  const clearOverride = (jahre) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[jahre];
      return next;
    });
  };

  const finanzierbar = calc.belastungsquote > 0 && calc.belastungsquote <= 40;
  const grenzwertig = calc.belastungsquote > 40 && calc.belastungsquote <= 45;

  // --- Bewertung: transparente Einzelkriterien statt Black-Box-Score ---
  const bewertung = (() => {
    const bq = calc.belastungsquote;
    const ekQuote = kaufpreis > 0 ? (eigenkapital / kaufpreis) * 100 : 0;
    const tilgungWert = calc.selected.tilgung;
    const restAnteil = calc.darlehen > 0 ? (calc.selected.restschuld / calc.darlehen) * 100 : 0;
    const ltv = calc.ltv;

    const kriterien = [
      {
        name: "Tragfähigkeit (Rate/Einkommen)",
        wert: bq > 0 ? `${bq.toFixed(0)}%` : "–",
        status: bq <= 0 ? "unbekannt" : bq <= 35 ? "gut" : bq <= 40 ? "mittel" : "schwach",
        hinweis:
          bq <= 0
            ? "Bitte Nettoeinkommen angeben."
            : bq <= 35
            ? "Komfortable Spanne, Banken sehen das gern."
            : bq <= 40
            ? "Noch vertretbar, aber wenig Puffer für Unvorhergesehenes."
            : "Über der üblichen Bankgrenze, viele Institute lehnen hier ab oder verlangen mehr Eigenkapital.",
      },
      {
        name: "Eigenkapitalquote",
        wert: `${ekQuote.toFixed(0)}% vom Kaufpreis`,
        status: !calc.eigenkapitalDeckt ? "schwach" : ekQuote >= 20 ? "gut" : ekQuote >= 10 ? "mittel" : "schwach",
        hinweis: !calc.eigenkapitalDeckt
          ? "Deckt nicht einmal die Kaufnebenkosten, das schränkt die Bankauswahl real ein."
          : ekQuote >= 20
          ? "Solide Basis, verbessert typischerweise auch den Zinssatz."
          : ekQuote >= 10
          ? "Grundsolide, mehr Eigenkapital würde den Zins meist weiter verbessern."
          : "Knapp über den Kaufnebenkosten, wenig Verhandlungsspielraum bei der Bank.",
      },
      {
        name: "Tilgungshöhe",
        wert: `${tilgungWert.toFixed(2)}%`,
        status: tilgungWert >= 2 ? "gut" : tilgungWert >= 1 ? "mittel" : "schwach",
        hinweis:
          tilgungWert >= 2
            ? "Entspricht der von Vermittlern empfohlenen Mindesttilgung im aktuellen Zinsumfeld."
            : tilgungWert >= 1
            ? "Etwas niedrig, die Laufzeit verlängert sich dadurch deutlich."
            : "Sehr niedrig, das Darlehen wird nur sehr langsam abgebaut.",
      },
      {
        name: "Restschuldrisiko nach Zinsbindung",
        wert: `${restAnteil.toFixed(0)}% des Darlehens offen`,
        status: restAnteil <= 50 ? "gut" : restAnteil <= 75 ? "mittel" : "schwach",
        hinweis:
          restAnteil <= 50
            ? "Weniger als die Hälfte muss zu unbekannten Zukunftskonditionen weiterfinanziert werden."
            : restAnteil <= 75
            ? "Ein größerer Teil bleibt vom Zinsrisiko der Anschlussfinanzierung betroffen."
            : "Der Großteil des Darlehens hängt noch an der ungewissen Anschlussfinanzierung.",
      },
      {
        name: "Beleihung (LTV)",
        wert: `${ltv.toFixed(0)}%`,
        status: ltv <= 80 ? "gut" : ltv <= 95 ? "mittel" : "schwach",
        hinweis:
          ltv <= 80
            ? "Im günstigsten gemessenen Zinsband."
            : ltv <= 95
            ? "Mittleres Beleihungsband, leicht über dem günstigsten Zinsniveau."
            : "Hohe Beleihung, das oberste Zinsband greift hier.",
      },
    ];

    const schwaechen = kriterien.filter((k) => k.status === "schwach").length;
    const unbekannt = kriterien.some((k) => k.status === "unbekannt");
    let gesamt, gesamtFarbe;
    if (unbekannt) {
      gesamt = "Noch nicht vollständig einschätzbar";
      gesamtFarbe = "#5B6472";
    } else if (schwaechen === 0) {
      gesamt = "Solide Finanzierung über alle Kriterien";
      gesamtFarbe = "#2F5738";
    } else if (schwaechen === 1) {
      gesamt = "Grundsätzlich tragfähig, ein Punkt verdient Aufmerksamkeit";
      gesamtFarbe = "#8A4A24";
    } else {
      gesamt = "Mehrere Schwachpunkte, vor Abschluss noch einmal prüfen";
      gesamtFarbe = "#8A2E2E";
    }

    return { kriterien, gesamt, gesamtFarbe };
  })();

  return (
    <div className="min-h-screen w-full" style={{ background: "#EEF1EC", fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;700&display=swap');`}</style>

      <div style={{ background: "#16213D" }} className="px-5 py-6 md:px-10 md:py-8">
        <div className="text-xs uppercase tracking-widest mb-1" style={{ color: "#B8763F", letterSpacing: "0.15em" }}>
          Immobilienkauf · Baufinanzierung
        </div>
        <h1 className="text-2xl md:text-3xl" style={{ fontFamily: "'Fraunces', serif", color: "#F6F3EC", fontWeight: 600 }}>
          Finanzierungsrechner
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9BA5B8" }}>
          Zinssätze werden automatisch aus Ihrer Beleihung (Kaufpreis/Eigenkapital) geschätzt, auf Basis echter Marktdaten vom 04.08.2026. Eigene Bankkonditionen können jederzeit überschrieben werden.
        </p>
      </div>

      <div className="px-5 py-6 md:px-10 md:py-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* LEFT: Inputs */}
        <div className="md:col-span-2">
          <div className="rounded-lg p-5" style={{ background: "#F6F3EC", border: "1px solid #D8D3C7" }}>
            <div className="flex mb-5">
              <Tab active={tab === "immobilie"} onClick={() => setTab("immobilie")} label="Immobilie" icon="🏠" />
              <Tab active={tab === "person"} onClick={() => setTab("person")} label="Person" icon="🧑" />
              <Tab active={tab === "optional"} onClick={() => setTab("optional")} label="Optional" icon="＋" />
            </div>

            {tab === "immobilie" && (
              <div>
                <Field label="Immobilienart">
                  <Select
                    value={immobilienart}
                    onChange={setImmobilienart}
                    options={["Eigentumswohnung", "Ein- und Zweifamilienhaus", "Mehrfamilienhaus"]}
                  />
                </Field>
                <Field label="Kaufpreis (ohne Nebenkosten)">
                  <NumInput value={kaufpreis} onChange={setKaufpreis} suffix="€" step={5000} />
                </Field>
                <Toggle checked={zzglMakler} onChange={setZzglMakler} label="Zzgl. Maklergebühr" />
                {zzglMakler && (
                  <Field label="Maklergebühr">
                    <NumInput value={maklerProzent} onChange={setMaklerProzent} suffix="%" step={0.1} />
                  </Field>
                )}
                <Toggle checked={mitModernisierung} onChange={setMitModernisierung} label="Mit Modernisierungskosten" />
                {mitModernisierung && (
                  <Field label="Modernisierungskosten">
                    <NumInput value={modernisierungskosten} onChange={setModernisierungskosten} suffix="€" step={1000} />
                  </Field>
                )}
                <Field label="Bundesland (für Grunderwerbsteuer)" hint={`Aktuell: ${calc.grest}% · bitte gegen den aktuellen Stand prüfen`}>
                  <Select
                    value={bundesland}
                    onChange={setBundesland}
                    options={Object.keys(GRUNDERWERBSTEUER)}
                  />
                </Field>
                <Field label="Nutzung">
                  <Segmented options={["Selbstnutzung", "Vermietung"]} value={nutzung} onChange={setNutzung} />
                </Field>
              </div>
            )}

            {tab === "person" && (
              <div>
                <Field label="Alter">
                  <NumInput value={alter} onChange={setAlter} suffix="J" step={1} />
                </Field>
                <Field label="Beschäftigungsverhältnis">
                  <Select
                    value={beschaeftigung}
                    onChange={setBeschaeftigung}
                    options={["Angestellte:r", "Beamte:r", "Selbstständig", "Freiberufler:in", "Rentner:in"]}
                  />
                </Field>
                <Field label="Mtl. Nettoeinkommen">
                  <NumInput value={nettoeinkommen} onChange={setNettoeinkommen} suffix="€" step={100} />
                </Field>
                <Toggle checked={mitfinanzierende} onChange={setMitfinanzierende} label="Mitfinanzierende Person hinzufügen" />
                {mitfinanzierende && (
                  <Field label="Mtl. Nettoeinkommen (Mitfinanzierende Person)">
                    <NumInput value={partnerEinkommen} onChange={setPartnerEinkommen} suffix="€" step={100} />
                  </Field>
                )}
                <Field label="Eigenkapital" hint="Verfügbares Kapital für den Immobilienkauf">
                  <NumInput value={eigenkapital} onChange={setEigenkapital} suffix="€" step={5000} />
                </Field>
              </div>
            )}

            {tab === "optional" && (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Wohnfläche">
                    <NumInput value={wohnflaeche} onChange={setWohnflaeche} suffix="m²" step={1} />
                  </Field>
                  <Field label="Baujahr">
                    <NumInput value={baujahr} onChange={setBaujahr} suffix="" step={1} />
                  </Field>
                </div>
                <Field label="Mieteinnahmen">
                  <NumInput value={mieteinnahmen} onChange={setMieteinnahmen} suffix="€" step={50} />
                </Field>
                <Field label="Sonstige mtl. Einnahmen" hint="z.B. Unterhalt, Nebenjob">
                  <NumInput value={sonstigeEinnahmen} onChange={setSonstigeEinnahmen} suffix="€" step={50} />
                </Field>
                <Field label="Mtl. Rate aktueller Kredite" hint="Summe monatliche Rate für alle Kredite">
                  <NumInput value={mtlKreditrate} onChange={setMtlKreditrate} suffix="€" step={50} />
                </Field>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Results */}
        <div className="md:col-span-3 flex flex-col gap-6">
          {/* Meine Konditionen */}
          <div className="rounded-lg p-5" style={{ background: "#16213D" }}>
            <div className="text-xs uppercase tracking-widest mb-3" style={{ color: "#9BA5B8", letterSpacing: "0.1em" }}>
              Meine Konditionen
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs mb-1" style={{ color: "#9BA5B8" }}>Nettodarlehensbetrag</div>
                <div className="text-lg" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#F6F3EC", fontWeight: 700 }}>
                  {fmtEUR(calc.darlehen)}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9BA5B8" }}>Beleihung (LTV)</div>
                <div className="text-lg" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#F6F3EC", fontWeight: 700 }}>
                  {calc.ltv.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "#9BA5B8" }}>Soll- / Effektivzins</div>
                <div className="text-lg" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#F6F3EC", fontWeight: 700 }}>
                  {calc.selected.zins.toFixed(2)} / {calc.selected.eff.toFixed(2)}%
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <div className="text-xs mb-1" style={{ color: "#9BA5B8" }}>Monatliche Rate</div>
                <div className="text-lg" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#F6F3EC", fontWeight: 700 }}>
                  {fmtEURp(calc.selected.payment)}
                </div>
              </div>
            </div>
            {!calc.selected.isOverridden && calc.ltv <= 60 && (
              <div className="mt-3 text-xs rounded px-3 py-2" style={{ background: "#3A4A63", color: "#C7D0DE" }}>
                Unter 60% Beleihung wurde nicht mehr direkt getestet; der Zinssatz ist vermutlich ähnlich oder etwas niedriger als bei 60%.
              </div>
            )}
            <div
              className="mt-3 text-sm rounded px-3 py-2"
              style={{
                background: finanzierbar ? "#DCE8DE" : grenzwertig ? "#F3E6DC" : "#F0DCDA",
                color: finanzierbar ? "#2F5738" : grenzwertig ? "#8A4A24" : "#8A2E2E",
              }}
            >
              {finanzierbar &&
                `Die Rate liegt bei rund ${calc.belastungsquote.toFixed(0)}% des verfügbaren Einkommens. Auf dieser Basis wirkt das Projekt finanzierbar.`}
              {grenzwertig &&
                `Die Rate liegt bei rund ${calc.belastungsquote.toFixed(0)}% des verfügbaren Einkommens. Das ist grenzwertig, Banken kalkulieren hier meist enger.`}
              {!finanzierbar && !grenzwertig &&
                (calc.belastungsquote > 45
                  ? `Die Rate liegt bei rund ${calc.belastungsquote.toFixed(0)}% des verfügbaren Einkommens. Das ist deutlich zu hoch für eine übliche Bankfinanzierung.`
                  : "Bitte Nettoeinkommen und Eigenkapital angeben, um die Finanzierbarkeit einzuschätzen.")}
            </div>
            {!calc.eigenkapitalDeckt && (
              <div className="mt-2 text-xs rounded px-3 py-2" style={{ background: "#F3E6DC", color: "#8A4A24" }}>
                Das Eigenkapital deckt die Kaufnebenkosten ({fmtEUR(calc.nebenkosten)}) nicht vollständig.
              </div>
            )}
          </div>

          {/* Bewertung */}
          <div className="rounded-lg p-5" style={{ background: "#F6F3EC", border: "1px solid #D8D3C7" }}>
            <h2 className="text-sm uppercase tracking-wider mb-1" style={{ color: "#16213D", letterSpacing: "0.08em" }}>
              Wie gut ist diese Finanzierung?
            </h2>
            <p className="text-sm mt-2 mb-4 font-semibold" style={{ color: bewertung.gesamtFarbe }}>
              {bewertung.gesamt}
            </p>
            <div className="flex flex-col gap-2">
              {bewertung.kriterien.map((k) => {
                const farben = {
                  gut: { bg: "#DCE8DE", fg: "#2F5738", punkt: "●" },
                  mittel: { bg: "#F3E6DC", fg: "#8A4A24", punkt: "●" },
                  schwach: { bg: "#F0DCDA", fg: "#8A2E2E", punkt: "●" },
                  unbekannt: { bg: "#E9E6DC", fg: "#5B6472", punkt: "○" },
                };
                const f = farben[k.status];
                return (
                  <div key={k.name} className="flex items-start gap-3 rounded-md p-3" style={{ background: "#FFFFFF", border: "1px solid #E3DECE" }}>
                    <span style={{ color: f.fg, fontSize: 14, marginTop: 2 }}>{f.punkt}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-sm font-medium" style={{ color: "#16213D" }}>{k.name}</span>
                        <span className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: f.fg, fontWeight: 700 }}>{k.wert}</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: "#5B6472" }}>{k.hinweis}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: "#8A8272" }}>
              Diese Einschätzung basiert auf allgemeinen Richtwerten (u.a. Interhyp-Empfehlung zur Mindesttilgung, übliche Bankgrenzen bei der Belastungsquote), nicht auf der individuellen Bonitätsprüfung einer bestimmten Bank. Sie ersetzt keine Beratung.
            </p>
          </div>

          {/* Finanzierungsspielraum */}
          <div className="rounded-lg p-5" style={{ background: "#F6F3EC", border: "1px solid #D8D3C7" }}>
            <h2 className="text-sm uppercase tracking-wider mb-1" style={{ color: "#16213D", letterSpacing: "0.08em" }}>
              Mein Finanzierungsspielraum
            </h2>
            <p className="text-xs mb-3" style={{ color: "#8A8272" }}>
              Zinssätze werden automatisch aus Ihrer Beleihung geschätzt (Marktdaten 04.08.2026). Zum Überschreiben: Zinssatz direkt in der Tabelle anpassen.
            </p>

            <div className="mb-3">
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setRateMode(false)}
                  className="flex-1 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: !rateMode ? "#16213D" : "#FFFFFF",
                    color: !rateMode ? "#F6F3EC" : "#16213D",
                    border: "1px solid #D8D3C7",
                  }}
                >
                  Tilgung vorgeben
                </button>
                <button
                  onClick={() => setRateMode(true)}
                  className="flex-1 py-2 rounded-md text-xs font-medium transition-colors"
                  style={{
                    background: rateMode ? "#16213D" : "#FFFFFF",
                    color: rateMode ? "#F6F3EC" : "#16213D",
                    border: "1px solid #D8D3C7",
                  }}
                >
                  Mtl. Rate vorgeben
                </button>
              </div>
              {!rateMode ? (
                <div>
                  <span className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#5B6472", letterSpacing: "0.07em" }}>
                    Anfängliche Tilgung (für alle Zinsbindungen)
                  </span>
                  <NumInput value={tilgung} onChange={setTilgung} suffix="%" step={0.1} />
                </div>
              ) : (
                <div>
                  <span className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#5B6472", letterSpacing: "0.07em" }}>
                    Gewünschte monatliche Rate (für alle Zinsbindungen)
                  </span>
                  <NumInput value={zielRate} onChange={setZielRate} suffix="€" step={25} />
                  <span className="block text-xs mt-1" style={{ color: "#8A8272" }}>
                    Die Tilgung wird je Zinsbindung passend zurückgerechnet.
                  </span>
                  {calc.rows.some((r) => r.rateUnterDeckt) && (
                    <div className="mt-2 text-xs rounded px-3 py-2" style={{ background: "#F0DCDA", color: "#8A2E2E" }}>
                      Bei mindestens einer Zinsbindung deckt diese Rate kaum mehr als die Zinsen. Eine höhere Rate wäre für eine echte Tilgung nötig.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-3">
              <span className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: "#5B6472", letterSpacing: "0.07em" }}>
                Jährliche Sondertilgung
              </span>
              <NumInput value={sondertilgungJahr} onChange={setSondertilgungJahr} suffix="€/Jahr" step={500} />
              <span className="block text-xs mt-1" style={{ color: "#8A8272" }}>
                Viele Banken erlauben kostenlose Sondertilgungen bis 5% des Darlehens pro Jahr, das wären hier {fmtEUR(calc.darlehen * 0.05)}. Bitte mit der eigenen Bank abklären, ob und in welcher Höhe das vertraglich möglich ist.
              </span>
            </div>

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ color: "#8A8272" }}>
                    <th className="text-left px-1 py-1.5 font-medium">Zinsbindung</th>
                    <th className="text-left px-1 py-1.5 font-medium">Zins p.a.</th>
                    <th className="text-left px-1 py-1.5 font-medium">Tilgung</th>
                    <th className="text-left px-1 py-1.5 font-medium">Mtl. Rate</th>
                    <th className="text-left px-1 py-1.5 font-medium">Restschuld</th>
                    <th className="text-left px-1 py-1.5 font-medium">Laufzeit</th>
                  </tr>
                </thead>
                <tbody>
                  {calc.rows.map((r) => (
                    <tr
                      key={r.jahre}
                      onClick={() => setSelectedZb(r.jahre)}
                      className="cursor-pointer"
                      style={{
                        background: selectedZb === r.jahre ? "#EADFCB" : "transparent",
                        borderTop: "1px solid #E3DECE",
                      }}
                    >
                      <td className="px-1 py-2" style={{ fontWeight: selectedZb === r.jahre ? 700 : 400, color: "#16213D" }}>
                        {r.jahre} J.
                      </td>
                      <td className="px-1 py-2">
                        <input
                          type="number"
                          step={0.05}
                          value={r.zins.toFixed(2)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setOverride(r.jahre, parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 rounded border text-sm outline-none"
                          style={{
                            borderColor: r.isOverridden ? "#B8763F" : "#D8D3C7",
                            background: r.isOverridden ? "#FBF3E9" : "#FFFFFF",
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: "#16213D",
                          }}
                        />
                        <span className="text-xs" style={{ color: "#8A8272" }}> %</span>
                        {r.isOverridden && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearOverride(r.jahre);
                            }}
                            className="text-xs ml-1 underline"
                            style={{ color: "#B8763F" }}
                          >
                            zurücksetzen
                          </button>
                        )}
                      </td>
                      <td className="px-1 py-2" style={{ fontFamily: "'IBM Plex Mono', monospace", color: r.rateUnterDeckt ? "#8A2E2E" : "#16213D" }}>
                        {r.tilgung.toFixed(2)}%
                      </td>
                      <td className="px-1 py-2">
                        {rateMode ? (
                          <input
                            type="number"
                            step={25}
                            value={Math.round(r.payment)}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setZielRate(parseFloat(e.target.value) || 0)}
                            className="w-20 px-1.5 py-1 rounded border text-sm outline-none"
                            style={{
                              borderColor: "#B8763F",
                              background: "#FBF3E9",
                              fontFamily: "'IBM Plex Mono', monospace",
                              color: "#16213D",
                            }}
                          />
                        ) : (
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D" }}>
                            {fmtEURp(r.payment)}
                          </span>
                        )}
                      </td>
                      <td className="px-1 py-2" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D" }}>
                        {fmtEUR(r.restschuld)}
                      </td>
                      <td className="px-1 py-2" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D" }}>
                        {r.gesamtlaufzeitJahre ? `${r.gesamtlaufzeitJahre} J.` : ">45 J."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-2" style={{ color: "#8A8272" }}>
              Zeile anklicken, um die Zinsbindung für die Details unten auszuwählen. Zinssatz-Feld anklicken, um einen eigenen Wert (z.B. eine echte Bankkondition) einzutragen.
            </p>
          </div>

          {/* Chart for selected */}
          <div className="rounded-lg p-5" style={{ background: "#F6F3EC", border: "1px solid #D8D3C7" }}>
            <h2 className="text-sm uppercase tracking-wider mb-1" style={{ color: "#16213D", letterSpacing: "0.08em" }}>
              Restschuld über die Zeit ({selectedZb} Jahre Zinsbindung)
            </h2>
            <div style={{ width: "100%", height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={calc.selected.yearly} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B8763F" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#B8763F" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#D8D3C7" vertical={false} />
                  <XAxis dataKey="year" tickFormatter={(y) => `J${y}`} tick={{ fontSize: 11, fill: "#8A8272" }} axisLine={{ stroke: "#D8D3C7" }} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 11, fill: "#8A8272" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v) => fmtEUR(v)} labelFormatter={(y) => `Jahr ${y}`} contentStyle={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, borderRadius: 6, border: "1px solid #D8D3C7" }} />
                  <ReferenceLine x={selectedZb} stroke="#16213D" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="balance" stroke="#B8763F" strokeWidth={2} fill="url(#balanceFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Anschlussfinanzierung Sensitivität */}
          <div className="rounded-lg p-5" style={{ background: "#F6F3EC", border: "1px solid #D8D3C7" }}>
            <h2 className="text-sm uppercase tracking-wider mb-1" style={{ color: "#16213D", letterSpacing: "0.08em" }}>
              Anschlussfinanzierung: Zinsrisiko
            </h2>
            <p className="text-xs mb-3" style={{ color: "#8A8272" }}>
              Wie sich die Rate nach Ende der Zinsbindung ändert, je nachdem wohin sich der Markt bewegt. Restschuld: {fmtEUR(calc.selected.restschuld)}, Tilgung wie bisher ({calc.selected.tilgung.toFixed(2)}%).
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[-1, 0, 1, 2].map((delta) => {
                const zinsSzenario = Math.max(calc.selected.zins + delta, 0.1);
                const rateSzenario = (calc.selected.restschuld * (zinsSzenario + calc.selected.tilgung)) / 100 / 12;
                const istJetzt = delta === 0;
                return (
                  <div
                    key={delta}
                    className="rounded-md p-3"
                    style={{ background: istJetzt ? "#EADFCB" : "#FFFFFF", border: "1px solid #D8D3C7" }}
                  >
                    <div className="text-xs" style={{ color: "#8A8272" }}>
                      {delta === 0 ? "gleicher Zins" : delta > 0 ? `+${delta} Prozentpunkt${delta > 1 ? "e" : ""}` : `${delta} Prozentpunkt`}
                    </div>
                    <div className="text-sm mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D", fontWeight: 700 }}>
                      {zinsSzenario.toFixed(2)}%
                    </div>
                    <div className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D" }}>
                      {fmtEURp(rateSzenario)}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: "#8A8272" }}>
              Illustrativ, keine Prognose: niemand kennt den Zins in {selectedZb} Jahren. Eine lange Zinsbindung oder ein Forward-Darlehen kann dieses Risiko begrenzen, das ist hier nicht mit eingerechnet.
            </p>
          </div>

          {/* Details */}
          <div className="rounded-lg p-5" style={{ background: "#F6F3EC", border: "1px solid #D8D3C7" }}>
            <button
              onClick={() => setShowDetails((s) => !s)}
              className="w-full flex justify-between items-center text-sm uppercase tracking-wider"
              style={{ color: "#16213D", letterSpacing: "0.08em" }}
            >
              Finanzierungsdetails ({selectedZb} Jahre)
              <span>{showDetails ? "–" : "+"}</span>
            </button>
            {showDetails && (
              <div className="mt-4 divide-y" style={{ borderColor: "#E3DECE" }}>
                {[
                  ["Anfängliche Tilgung", fmtPct(calc.selected.tilgung)],
                  ["Gebundener Sollzins", fmtPct(calc.selected.zins)],
                  ["Effektiver Jahreszins p.a.", fmtPct(calc.selected.eff)],
                  ["Beleihungsauslauf (LTV)", `${calc.ltv.toFixed(1)}%`],
                  ["Restschuld nach Zinsbindung", fmtEUR(calc.selected.restschuld)],
                  ["Angenommene Kosten am Laufzeitende", fmtEUR(calc.selected.angenommeneKosten)],
                  ["Kalkulierte Gesamtlaufzeit", calc.selected.gesamtlaufzeitJahre ? `${calc.selected.gesamtlaufzeitJahre} Jahre` : "> 45 Jahre"],
                  ["Nettodarlehensbetrag", fmtEUR(calc.darlehen)],
                  ["Monatliche Rate", fmtEURp(calc.selected.payment)],
                  ["Zinsbindung", `${selectedZb} Jahre`],
                  ["Anzahl der Raten", `${calc.selected.anzahlRaten}`],
                  ["Zinssatz-Quelle", calc.selected.isOverridden ? "Eigene Eingabe" : calc.selected.measured ? "Live-Marktdaten (Interhyp, 04.08.2026)" : "Geschätzt (Bestkondition-Richtwert)"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-2 text-sm">
                    <span style={{ color: "#5B6472" }}>{k}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kostenaufstellung */}
          <div className="rounded-lg p-5" style={{ background: "#F6F3EC", border: "1px solid #D8D3C7" }}>
            <h2 className="text-sm uppercase tracking-wider mb-3" style={{ color: "#16213D", letterSpacing: "0.08em" }}>
              Kostenaufstellung
            </h2>
            {[
              ["Kaufpreis", fmtEUR(kaufpreis)],
              [`Grunderwerbsteuer (${calc.grest}%)`, fmtEUR(calc.grestBetrag)],
              [`Notar + Grundbuch (${calc.notarProzent.toFixed(2)}%, GNotKG-Modell)`, fmtEUR(calc.notarBetrag)],
              ...(zzglMakler ? [[`Maklergebühr (${maklerProzent}%)`, fmtEUR(calc.maklerBetrag)]] : []),
              ...(mitModernisierung ? [["Modernisierungskosten", fmtEUR(calc.modKosten)]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2 py-1">
                <span className="whitespace-nowrap text-sm" style={{ color: "#8A8272" }}>{k}</span>
                <span className="flex-1 border-b border-dotted" style={{ borderColor: "#C9C2AF", transform: "translateY(-3px)" }} />
                <span className="whitespace-nowrap text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#3A3527" }}>{v}</span>
              </div>
            ))}
            <div className="flex items-baseline gap-2 py-1 mt-1">
              <span className="whitespace-nowrap text-sm font-semibold" style={{ color: "#16213D" }}>Gesamtkosten</span>
              <span className="flex-1 border-b border-dotted" style={{ borderColor: "#C9C2AF", transform: "translateY(-3px)" }} />
              <span className="whitespace-nowrap text-sm font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D" }}>{fmtEUR(calc.gesamtkosten)}</span>
            </div>
            <div className="flex items-baseline gap-2 py-1">
              <span className="whitespace-nowrap text-sm" style={{ color: "#8A8272" }}>abzgl. Eigenkapital</span>
              <span className="flex-1 border-b border-dotted" style={{ borderColor: "#C9C2AF", transform: "translateY(-3px)" }} />
              <span className="whitespace-nowrap text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#3A3527" }}>- {fmtEUR(eigenkapital)}</span>
            </div>
            <div className="flex items-baseline gap-2 py-1">
              <span className="whitespace-nowrap text-sm font-semibold" style={{ color: "#16213D" }}>Darlehensbetrag</span>
              <span className="flex-1 border-b border-dotted" style={{ borderColor: "#C9C2AF", transform: "translateY(-3px)" }} />
              <span className="whitespace-nowrap text-sm font-bold" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#16213D" }}>{fmtEUR(calc.darlehen)}</span>
            </div>
            {calc.darlehen !== Math.round(calc.darlehenExakt) && (
              <p className="text-xs mt-2" style={{ color: "#8A8272" }}>
                Der Darlehensbetrag ist aufgerundet (exakt: {fmtEUR(calc.darlehenExakt)}).
              </p>
            )}
          </div>

          <p className="text-xs px-1" style={{ color: "#8A8272" }}>
            Hinweise: Zinssätze basieren auf live abgefragten Werten des Interhyp-Baufinanzierungsrechners (04.08.2026, Karlsruhe, 2% Tilgung) je Beleihungsband und Zinsbindung, keine Bankkondition. Getestet und ohne Einfluss auf den Zinssatz: Selbstnutzung vs. Vermietung, Ein-/Mehrfamilienhaus. Die Bänder ab 80% Beleihung sind ebenfalls live gemessen (bis 60,6%); der Zinssatz flacht dort auf ca. 3,9-4,0% ab, deutlich über den 3,3%, die manche Vergleichsportale für Bestkonditionen mit sehr guter Bonität bewerben, dieser generische Rechner fragt keine Bonitätsdaten ab. Marktzinsen ändern sich wöchentlich, ein späterer Abgleich mit einem echten Angebot ersetzt diese Schätzung. Grunderwerbsteuer-Sätze wurden gegen eine aktuelle Quelle (Stand 2026) geprüft und korrigiert (u.a. Bremen, Mecklenburg-Vorpommern, Sachsen), können sich aber weiterhin ändern. Notar- und Grundbuchkosten werden über ein GNotKG-Modell (Tabelle B, degressiv) berechnet, kalibriert an einem realen Beispiel (270.000€ → 4.860€), keine exakte Einzelfall-Gebührenrechnung. Cross-Check: Bei ~97-100% Beleihung lag das Top-Angebot bei Dr. Klein (10 Jahre, 2% Tilgung) bei 4,17% Sollzins, bei Interhyp bei 4,37%, ein realer Unterschied von ca. 0,2 Prozentpunkten zwischen zwei unabhängigen Vermittler-Panels für ein vergleichbares Profil. Die hier hinterlegten Zinssätze sind daher eine plausible Einordnung, kein Bestwert, ein Vergleich mehrerer Anbieter lohnt sich real um ca. 0,1-0,2 Prozentpunkte. Eine dritte, unabhängige Quelle (Finanztip, Stand 27.07.2026) bestätigt zudem, dass der Zinsunterschied zwischen 60% und 80% Beleihung bei 5/10/15 Jahren Zinsbindung praktisch null ist, deckt sich mit den hier gemessenen Werten. Bonität (Einkommen, SCHUFA, Beschäftigungsart) beeinflusst den Zins real und spürbar, aber keine der geprüften Quellen veröffentlicht dafür eine konkrete Zahl, das ist bankinterne, nicht standardisierte Risikologik und wird erst im echten Beratungsgespräch sichtbar. Dieser Rechner kann das daher nicht abbilden.
          </p>
        </div>
      </div>
    </div>
  );
}