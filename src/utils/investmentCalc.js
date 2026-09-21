/** Pure port of legacy `calcInvestment()` — ROI, payback period, and a multi-year projection. */
export function calcInvestment({ name, initial, monthlyRev, monthlyCost, growth, projectionYears = 3 }) {
  const monthlyProfit = monthlyRev - monthlyCost
  const annualProfit = monthlyProfit * 12
  const annualROI = initial > 0 ? (annualProfit / initial) * 100 : 0
  const paybackMonths = monthlyProfit > 0 ? Math.ceil(initial / monthlyProfit) : Infinity

  const years = []
  let cumulative = 0
  let yearProfit = annualProfit
  for (let y = 1; y <= projectionYears; y++) {
    cumulative += yearProfit
    years.push({ year: y, profit: yearProfit, cumulative })
    yearProfit *= 1 + growth / 100
  }

  let score, scoreLabel, scoreTier
  if (annualROI < 0) {
    score = 0
    scoreLabel = 'Loss — negative cash flow'
    scoreTier = 'loss'
  } else if (annualROI < 5) {
    score = 1
    scoreLabel = 'Poor'
    scoreTier = 'poor'
  } else if (annualROI < 15) {
    score = 2
    scoreLabel = 'Fair'
    scoreTier = 'fair'
  } else if (annualROI < 30) {
    score = 3
    scoreLabel = 'Good'
    scoreTier = 'good'
  } else if (annualROI < 50) {
    score = 4
    scoreLabel = 'Great'
    scoreTier = 'great'
  } else {
    score = 5
    scoreLabel = 'Excellent'
    scoreTier = 'excellent'
  }

  return {
    name,
    initial,
    monthlyRev,
    monthlyCost,
    growth,
    monthlyProfit,
    annualProfit,
    annualROI,
    paybackMonths,
    projectionYears,
    years,
    score,
    scoreLabel,
    scoreTier,
  }
}
