<script setup>
import { computed, reactive, ref } from 'vue'
import { GRUNDERWERBSTEUER, computeBaufinanzierung, computeBewertung } from '../../utils/baufinanzierungCalc.js'
import { fmtCurrency } from '../../utils/format.js'
import RestschuldChart from './RestschuldChart.vue'

const inputTab = ref('immobilie')
const inputTabs = [
  { key: 'immobilie', label: '🏠 Immobilie' },
  { key: 'person', label: '🧑 Person' },
  { key: 'optional', label: '＋ Optional' },
]

const state = reactive({
  // Immobilie
  immobilienart: 'Eigentumswohnung',
  kaufpreis: 299000,
  zzglMakler: false,
  maklerProzent: 3.57,
  mitModernisierung: false,
  modernisierungskosten: 0,
  bundesland: 'Baden-Württemberg',
  nutzung: 'Selbstnutzung',
  // Person
  alter: 30,
  beschaeftigung: 'Angestellte:r',
  nettoeinkommen: 3000,
  mitfinanzierende: false,
  partnerEinkommen: 0,
  eigenkapital: 21000,
  // Optional
  wohnflaeche: 0,
  baujahr: 0,
  mieteinnahmen: 0,
  sonstigeEinnahmen: 0,
  mtlKreditrate: 0,
  // Finanzierungsspielraum
  tilgung: 1.5,
  rateMode: false,
  zielRate: 1200,
  sondertilgungJahr: 0,
  selectedZb: 10,
})
const overrides = reactive({})
const showDetails = ref(false)

const immobilienartOptions = ['Eigentumswohnung', 'Ein- und Zweifamilienhaus', 'Mehrfamilienhaus']
const beschaeftigungOptions = ['Angestellte:r', 'Beamte:r', 'Selbstständig', 'Freiberufler:in', 'Rentner:in']
const bundeslandOptions = Object.keys(GRUNDERWERBSTEUER)

function setOverride(jahre, val) {
  overrides[jahre] = val
}
function clearOverride(jahre) {
  delete overrides[jahre]
}

const calc = computed(() =>
  computeBaufinanzierung({
    kaufpreis: state.kaufpreis,
    bundesland: state.bundesland,
    zzglMakler: state.zzglMakler,
    maklerProzent: state.maklerProzent,
    mitModernisierung: state.mitModernisierung,
    modernisierungskosten: state.modernisierungskosten,
    eigenkapital: state.eigenkapital,
    tilgung: state.tilgung,
    rateMode: state.rateMode,
    zielRate: state.zielRate,
    sondertilgungJahr: state.sondertilgungJahr,
    selectedZb: state.selectedZb,
    overrides,
    nettoeinkommen: state.nettoeinkommen,
    mitfinanzierende: state.mitfinanzierende,
    partnerEinkommen: state.partnerEinkommen,
    mieteinnahmen: state.mieteinnahmen,
    sonstigeEinnahmen: state.sonstigeEinnahmen,
    mtlKreditrate: state.mtlKreditrate,
  })
)
const bewertung = computed(() =>
  computeBewertung(calc.value, { kaufpreis: state.kaufpreis, eigenkapital: state.eigenkapital })
)

const finanzierbar = computed(() => calc.value.belastungsquote > 0 && calc.value.belastungsquote <= 40)
const grenzwertig = computed(() => calc.value.belastungsquote > 40 && calc.value.belastungsquote <= 45)

const sensitivityDeltas = [-1, 0, 1, 2]
function sensitivityRate(delta) {
  const zins = Math.max(calc.value.selected.zins + delta, 0.1)
  const rate = (calc.value.selected.restschuld * (zins + calc.value.selected.tilgung)) / 100 / 12
  return { zins, rate }
}

const detailRows = computed(() => [
  ['Anfängliche Tilgung', `${calc.value.selected.tilgung.toFixed(2)} %`],
  ['Gebundener Sollzins', `${calc.value.selected.zins.toFixed(2)} %`],
  ['Effektiver Jahreszins p.a.', `${calc.value.selected.eff.toFixed(2)} %`],
  ['Beleihungsauslauf (LTV)', `${calc.value.ltv.toFixed(1)}%`],
  ['Restschuld nach Zinsbindung', fmtCurrency(calc.value.selected.restschuld)],
  ['Angenommene Kosten am Laufzeitende', fmtCurrency(calc.value.selected.angenommeneKosten)],
  [
    'Kalkulierte Gesamtlaufzeit',
    calc.value.selected.gesamtlaufzeitJahre ? `${calc.value.selected.gesamtlaufzeitJahre} Jahre` : '> 45 Jahre',
  ],
  ['Nettodarlehensbetrag', fmtCurrency(calc.value.darlehen)],
  ['Monatliche Rate', fmtCurrency(calc.value.selected.payment)],
  ['Zinsbindung', `${state.selectedZb} Jahre`],
  ['Anzahl der Raten', `${calc.value.selected.anzahlRaten}`],
  [
    'Zinssatz-Quelle',
    calc.value.selected.isOverridden
      ? 'Eigene Eingabe'
      : calc.value.selected.measured
        ? 'Live-Marktdaten (Interhyp, 04.08.2026)'
        : 'Geschätzt',
  ],
])

const costRows = computed(() => {
  const rows = [
    ['Kaufpreis', fmtCurrency(state.kaufpreis)],
    [`Grunderwerbsteuer (${calc.value.grest}%)`, fmtCurrency(calc.value.grestBetrag)],
    [`Notar + Grundbuch (${calc.value.notarProzent.toFixed(2)}%, GNotKG-Modell)`, fmtCurrency(calc.value.notarBetrag)],
  ]
  if (state.zzglMakler) rows.push([`Maklergebühr (${state.maklerProzent}%)`, fmtCurrency(calc.value.maklerBetrag)])
  if (state.mitModernisierung) rows.push(['Modernisierungskosten', fmtCurrency(calc.value.modKosten)])
  return rows
})
</script>

<template>
  <div class="card">
    <div class="fin-tabs">
      <button
        v-for="t in inputTabs"
        :key="t.key"
        class="fin-tab"
        :class="{ active: inputTab === t.key }"
        @click="inputTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <div v-if="inputTab === 'immobilie'">
      <div class="field">
        <div class="inv-label">Immobilienart</div>
        <select v-model="state.immobilienart">
          <option v-for="o in immobilienartOptions" :key="o" :value="o">{{ o }}</option>
        </select>
      </div>
      <div class="field">
        <div class="inv-label">Kaufpreis (ohne Nebenkosten)</div>
        <input v-model.number="state.kaufpreis" type="number" min="0" step="5000" />
      </div>
      <label class="check-row">
        <input v-model="state.zzglMakler" type="checkbox" />
        Zzgl. Maklergebühr
      </label>
      <div v-if="state.zzglMakler" class="field">
        <div class="inv-label">Maklergebühr</div>
        <input v-model.number="state.maklerProzent" type="number" min="0" step="0.1" />
      </div>
      <label class="check-row">
        <input v-model="state.mitModernisierung" type="checkbox" />
        Mit Modernisierungskosten
      </label>
      <div v-if="state.mitModernisierung" class="field">
        <div class="inv-label">Modernisierungskosten</div>
        <input v-model.number="state.modernisierungskosten" type="number" min="0" step="1000" />
      </div>
      <div class="field">
        <div class="inv-label">Bundesland (für Grunderwerbsteuer) · aktuell {{ calc.grest }}%</div>
        <select v-model="state.bundesland">
          <option v-for="o in bundeslandOptions" :key="o" :value="o">{{ o }}</option>
        </select>
      </div>
      <div class="field">
        <div class="inv-label">Nutzung</div>
        <div class="seg">
          <button
            v-for="o in ['Selbstnutzung', 'Vermietung']"
            :key="o"
            class="seg-btn"
            :class="{ active: state.nutzung === o }"
            @click="state.nutzung = o"
          >
            {{ o }}
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="inputTab === 'person'">
      <div class="field">
        <div class="inv-label">Alter</div>
        <input v-model.number="state.alter" type="number" min="0" step="1" />
      </div>
      <div class="field">
        <div class="inv-label">Beschäftigungsverhältnis</div>
        <select v-model="state.beschaeftigung">
          <option v-for="o in beschaeftigungOptions" :key="o" :value="o">{{ o }}</option>
        </select>
      </div>
      <div class="field">
        <div class="inv-label">Mtl. Nettoeinkommen (€)</div>
        <input v-model.number="state.nettoeinkommen" type="number" min="0" step="100" />
      </div>
      <label class="check-row">
        <input v-model="state.mitfinanzierende" type="checkbox" />
        Mitfinanzierende Person hinzufügen
      </label>
      <div v-if="state.mitfinanzierende" class="field">
        <div class="inv-label">Mtl. Nettoeinkommen Mitfinanzierende:r (€)</div>
        <input v-model.number="state.partnerEinkommen" type="number" min="0" step="100" />
      </div>
      <div class="field">
        <div class="inv-label">Eigenkapital (€)</div>
        <input v-model.number="state.eigenkapital" type="number" min="0" step="5000" />
      </div>
    </div>

    <div v-else>
      <div class="sg2">
        <div class="field">
          <div class="inv-label">Wohnfläche (m²)</div>
          <input v-model.number="state.wohnflaeche" type="number" min="0" step="1" />
        </div>
        <div class="field">
          <div class="inv-label">Baujahr</div>
          <input v-model.number="state.baujahr" type="number" min="0" step="1" />
        </div>
      </div>
      <div class="field">
        <div class="inv-label">Mieteinnahmen (€/Monat)</div>
        <input v-model.number="state.mieteinnahmen" type="number" min="0" step="50" />
      </div>
      <div class="field">
        <div class="inv-label">Sonstige mtl. Einnahmen (€) · z.B. Unterhalt, Nebenjob</div>
        <input v-model.number="state.sonstigeEinnahmen" type="number" min="0" step="50" />
      </div>
      <div class="field">
        <div class="inv-label">Mtl. Rate aktueller Kredite (€)</div>
        <input v-model.number="state.mtlKreditrate" type="number" min="0" step="50" />
      </div>
    </div>
  </div>

  <div class="card">
    <div class="section-title">Meine Konditionen</div>
    <div class="sg3">
      <div class="sc">
        <div class="sl">Nettodarlehen</div>
        <div class="sv">{{ fmtCurrency(calc.darlehen) }}</div>
      </div>
      <div class="sc">
        <div class="sl">Beleihung (LTV)</div>
        <div class="sv">{{ calc.ltv.toFixed(1) }}%</div>
      </div>
      <div class="sc">
        <div class="sl">Soll- / Effektivzins</div>
        <div class="sv">{{ calc.selected.zins.toFixed(2) }} / {{ calc.selected.eff.toFixed(2) }}%</div>
      </div>
    </div>
    <div class="sc" style="margin-bottom: 12px">
      <div class="sl">Monatliche Rate</div>
      <div class="sv" style="color: var(--color-primary)">{{ fmtCurrency(calc.selected.payment) }}</div>
    </div>

    <div v-if="!calc.selected.isOverridden && calc.ltv <= 60" class="hint-box">
      Unter 60% Beleihung wurde nicht mehr direkt getestet; der Zinssatz ist vermutlich ähnlich oder etwas niedriger als
      bei 60%.
    </div>
    <div class="status-line" :class="finanzierbar ? 'status-gut' : grenzwertig ? 'status-mittel' : 'status-schwach'">
      <template v-if="finanzierbar">
        Die Rate liegt bei rund {{ calc.belastungsquote.toFixed(0) }}% des verfügbaren Einkommens. Auf dieser Basis
        wirkt das Projekt finanzierbar.
      </template>
      <template v-else-if="grenzwertig">
        Die Rate liegt bei rund {{ calc.belastungsquote.toFixed(0) }}% des verfügbaren Einkommens. Das ist grenzwertig,
        Banken kalkulieren hier meist enger.
      </template>
      <template v-else-if="calc.belastungsquote > 45">
        Die Rate liegt bei rund {{ calc.belastungsquote.toFixed(0) }}% des verfügbaren Einkommens. Das ist deutlich zu
        hoch für eine übliche Bankfinanzierung.
      </template>
      <template v-else>
        Bitte Nettoeinkommen und Eigenkapital angeben, um die Finanzierbarkeit einzuschätzen.
      </template>
    </div>
    <div v-if="!calc.eigenkapitalDeckt" class="hint-box status-mittel">
      Das Eigenkapital deckt die Kaufnebenkosten ({{ fmtCurrency(calc.nebenkosten) }}) nicht vollständig.
    </div>
  </div>

  <div class="card">
    <div class="section-title">Wie gut ist diese Finanzierung?</div>
    <p class="bewertung-gesamt" :class="'status-' + bewertung.gesamtStatus">{{ bewertung.gesamt }}</p>
    <div class="kriterium" v-for="k in bewertung.kriterien" :key="k.name">
      <span class="kriterium-dot" :class="'status-' + k.status">●</span>
      <div class="kriterium-body">
        <div class="kriterium-head">
          <span>{{ k.name }}</span>
          <span class="kriterium-wert" :class="'status-' + k.status">{{ k.wert }}</span>
        </div>
        <p class="kriterium-hinweis">{{ k.hinweis }}</p>
      </div>
    </div>
    <p class="footnote">
      Einschätzung auf Basis allgemeiner Richtwerte (u.a. Interhyp-Empfehlung zur Mindesttilgung, übliche Bankgrenzen
      bei der Belastungsquote), nicht der individuellen Bonitätsprüfung einer bestimmten Bank. Ersetzt keine Beratung.
    </p>
  </div>

  <div class="card">
    <div class="section-title">Mein Finanzierungsspielraum</div>
    <p class="section-sub">
      Zinssätze automatisch aus der Beleihung geschätzt (Marktdaten 04.08.2026). Zum Überschreiben: Zinssatz direkt in
      der Tabelle anpassen.
    </p>

    <div class="seg" style="margin-bottom: 10px">
      <button class="seg-btn" :class="{ active: !state.rateMode }" @click="state.rateMode = false">
        Tilgung vorgeben
      </button>
      <button class="seg-btn" :class="{ active: state.rateMode }" @click="state.rateMode = true">
        Mtl. Rate vorgeben
      </button>
    </div>
    <div v-if="!state.rateMode" class="field">
      <div class="inv-label">Anfängliche Tilgung (für alle Zinsbindungen)</div>
      <input v-model.number="state.tilgung" type="number" min="0" step="0.1" />
    </div>
    <div v-else class="field">
      <div class="inv-label">Gewünschte monatliche Rate (für alle Zinsbindungen)</div>
      <input v-model.number="state.zielRate" type="number" min="0" step="25" />
      <div class="hint-text">Die Tilgung wird je Zinsbindung passend zurückgerechnet.</div>
      <div v-if="calc.rows.some(r => r.rateUnterDeckt)" class="hint-box status-schwach">
        Bei mindestens einer Zinsbindung deckt diese Rate kaum mehr als die Zinsen. Eine höhere Rate wäre für eine echte
        Tilgung nötig.
      </div>
    </div>

    <div class="field">
      <div class="inv-label">Jährliche Sondertilgung (€/Jahr)</div>
      <input v-model.number="state.sondertilgungJahr" type="number" min="0" step="500" />
      <div class="hint-text">
        Viele Banken erlauben kostenlose Sondertilgungen bis 5% des Darlehens pro Jahr, das wären hier
        {{ fmtCurrency(calc.darlehen * 0.05) }}. Bitte mit der eigenen Bank abklären.
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Bindung</th>
            <th>Zins p.a.</th>
            <th>Tilgung</th>
            <th>Mtl. Rate</th>
            <th>Restschuld</th>
            <th>Laufzeit</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in calc.rows"
            :key="r.jahre"
            class="zb-row"
            :class="{ selected: state.selectedZb === r.jahre }"
            @click="state.selectedZb = r.jahre"
          >
            <td class="zb-jahre">{{ r.jahre }} J.</td>
            <td @click.stop>
              <input
                type="number"
                step="0.05"
                class="zb-input"
                :class="{ overridden: r.isOverridden }"
                :value="r.zins.toFixed(2)"
                @input="setOverride(r.jahre, parseFloat($event.target.value) || 0)"
              />
              <button v-if="r.isOverridden" class="reset-link" @click.stop="clearOverride(r.jahre)">reset</button>
            </td>
            <td :class="{ 'status-schwach': r.rateUnterDeckt }">{{ r.tilgung.toFixed(2) }}%</td>
            <td @click.stop>
              <input
                v-if="state.rateMode"
                type="number"
                step="25"
                class="zb-input overridden"
                :value="Math.round(r.payment)"
                @input="state.zielRate = parseFloat($event.target.value) || 0"
              />
              <span v-else>{{ fmtCurrency(r.payment) }}</span>
            </td>
            <td>{{ fmtCurrency(r.restschuld) }}</td>
            <td>{{ r.gesamtlaufzeitJahre ? `${r.gesamtlaufzeitJahre} J.` : '> 45 J.' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint-text" style="margin-top: 6px">
      Zeile anklicken wählt die Zinsbindung für die Details unten. Zinssatz-Feld anklicken, um eine eigene Bankkondition
      einzutragen.
    </p>
  </div>

  <div class="card">
    <div class="section-title">Restschuld über die Zeit ({{ state.selectedZb }} Jahre Zinsbindung)</div>
    <RestschuldChart :points="calc.selected.yearly" :mark-year="state.selectedZb" />
  </div>

  <div class="card">
    <div class="section-title">Anschlussfinanzierung: Zinsrisiko</div>
    <p class="section-sub">
      Wie sich die Rate nach Ende der Zinsbindung ändert. Restschuld: {{ fmtCurrency(calc.selected.restschuld) }},
      Tilgung wie bisher ({{ calc.selected.tilgung.toFixed(2) }}%).
    </p>
    <div class="sg2">
      <div v-for="delta in sensitivityDeltas" :key="delta" class="sc" :class="{ current: delta === 0 }">
        <div class="sl">{{ delta === 0 ? 'gleicher Zins' : delta > 0 ? `+${delta} Pp.` : `${delta} Pp.` }}</div>
        <div class="sv">{{ sensitivityRate(delta).zins.toFixed(2) }}%</div>
        <div class="sensitivity-rate">{{ fmtCurrency(sensitivityRate(delta).rate) }}</div>
      </div>
    </div>
    <p class="footnote">
      Illustrativ, keine Prognose: niemand kennt den Zins in {{ state.selectedZb }} Jahren. Eine lange Zinsbindung oder
      ein Forward-Darlehen kann dieses Risiko begrenzen, das ist hier nicht mit eingerechnet.
    </p>
  </div>

  <div class="card">
    <button class="details-toggle" @click="showDetails = !showDetails">
      <span>Finanzierungsdetails ({{ state.selectedZb }} Jahre)</span>
      <span>{{ showDetails ? '–' : '+' }}</span>
    </button>
    <div v-if="showDetails" class="kv-list">
      <div v-for="[k, v] in detailRows" :key="k" class="kv-row">
        <span class="kv-key">{{ k }}</span>
        <span class="kv-val">{{ v }}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="section-title">Kostenaufstellung</div>
    <div v-for="[k, v] in costRows" :key="k" class="kv-row dotted">
      <span class="kv-key">{{ k }}</span>
      <span class="kv-val">{{ v }}</span>
    </div>
    <div class="kv-row dotted total">
      <span class="kv-key">Gesamtkosten</span>
      <span class="kv-val">{{ fmtCurrency(calc.gesamtkosten) }}</span>
    </div>
    <div class="kv-row dotted">
      <span class="kv-key">abzgl. Eigenkapital</span>
      <span class="kv-val">- {{ fmtCurrency(state.eigenkapital) }}</span>
    </div>
    <div class="kv-row dotted total">
      <span class="kv-key">Darlehensbetrag</span>
      <span class="kv-val">{{ fmtCurrency(calc.darlehen) }}</span>
    </div>
    <p v-if="calc.darlehen !== Math.round(calc.darlehenExakt)" class="hint-text">
      Der Darlehensbetrag ist aufgerundet (exakt: {{ fmtCurrency(calc.darlehenExakt) }}).
    </p>
  </div>

  <p class="footnote">
    Zinssätze basieren auf live abgefragten Werten des Interhyp-Baufinanzierungsrechners (04.08.2026, Karlsruhe, 2%
    Tilgung) je Beleihungsband und Zinsbindung, keine Bankkondition. Marktzinsen ändern sich wöchentlich, ein späterer
    Abgleich mit einem echten Angebot ersetzt diese Schätzung. Grunderwerbsteuer-Sätze wurden gegen eine aktuelle Quelle
    (Stand 2026) geprüft, können sich aber weiterhin ändern. Notar- und Grundbuchkosten werden über ein GNotKG-Modell
    (Tabelle B, degressiv) berechnet, kalibriert an einem realen Beispiel (270.000€ → 4.860€), keine exakte
    Einzelfall-Gebührenrechnung. Ein Vergleich mehrerer Anbieter lohnt sich real um ca. 0,1–0,2 Prozentpunkte. Bonität
    (Einkommen, SCHUFA, Beschäftigungsart) beeinflusst den Zins real und spürbar, das ist bankinterne, nicht
    standardisierte Risikologik und wird erst im echten Beratungsgespräch sichtbar. Keine Anlage- oder
    Finanzierungsberatung.
  </p>
</template>

<style scoped>
.field {
  margin-bottom: 14px;
}
.check-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 13px;
  cursor: pointer;
}
.check-row input {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.seg {
  display: flex;
  gap: 6px;
}
.seg-btn {
  flex: 1;
  background: var(--color-surface);
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px;
  font-size: 12px;
  font-weight: 500;
}
.seg-btn.active {
  background: var(--color-primary);
  color: var(--color-primary-text, #fff);
  border-color: var(--color-primary);
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
}
.section-sub {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  line-height: 1.4;
}
.hint-text {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
  line-height: 1.4;
}
.hint-box {
  font-size: 12px;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 8px 10px;
  margin-top: 8px;
  line-height: 1.4;
}
.status-line {
  font-size: 13px;
  margin-top: 10px;
  line-height: 1.4;
  font-weight: 500;
}

.status-gut {
  color: var(--color-success);
}
.status-mittel {
  color: var(--color-warning);
}
.status-schwach {
  color: var(--color-danger);
}
.status-unbekannt {
  color: var(--color-text-muted);
}

.bewertung-gesamt {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}
.kriterium {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
}
.kriterium-dot {
  font-size: 12px;
  line-height: 1.6;
}
.kriterium-body {
  flex: 1;
  min-width: 0;
}
.kriterium-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}
.kriterium-wert {
  font-weight: 700;
  white-space: nowrap;
}
.kriterium-hinweis {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 3px;
  line-height: 1.4;
}

.table-wrap {
  overflow-x: auto;
  margin: 0 -4px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th {
  text-align: left;
  padding: 4px 6px;
  color: var(--color-text-muted);
  font-weight: 500;
  white-space: nowrap;
}
td {
  padding: 6px;
  border-top: 1px solid var(--color-border);
  white-space: nowrap;
}
.zb-row {
  cursor: pointer;
}
.zb-row.selected {
  background: var(--color-surface);
}
.zb-row.selected .zb-jahre {
  font-weight: 700;
  color: var(--color-primary);
}
.zb-input {
  width: 60px;
  padding: 3px 5px;
  font-size: 12px;
}
.zb-input.overridden {
  border-color: var(--color-primary);
}
.reset-link {
  font-size: 10px;
  color: var(--color-primary);
  text-decoration: underline;
  margin-left: 4px;
  background: transparent;
  padding: 0;
}

.current {
  border-color: var(--color-primary);
}
.sensitivity-rate {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.details-toggle {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  font-weight: 600;
  padding: 0;
}
.kv-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kv-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}
.kv-row.dotted {
  border-bottom: 1px dotted var(--color-border);
  padding-bottom: 3px;
}
.kv-row.total .kv-key,
.kv-row.total .kv-val {
  font-weight: 700;
}
.kv-key {
  color: var(--color-text-muted);
}
.kv-row.dotted .kv-key,
.kv-row.total .kv-key {
  color: var(--color-text);
}
.kv-val {
  font-weight: 500;
  white-space: nowrap;
}
</style>
