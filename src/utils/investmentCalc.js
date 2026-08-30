/** Pure port of legacy `calcInvestment()` — ROI, payback period, and a 3-year projection. */
export function calcInvestment({ name, initial, monthlyRev, monthlyCost, growth }) {
  const monthlyProfit = monthlyRev - monthlyCost
  const annualProfit = monthlyProfit * 12
  const annualROI = initial > 0 ? (annualProfit / initial) * 100 : 0
  const paybackMonths = monthlyProfit > 0 ? Math.ceil(initial / monthlyProfit) : Infinity

  const years = []
  let cumulative = 0
  let yearProfit = annualProfit
  for (let y = 1; y <= 3; y++) {
    cumulative += yearProfit
    years.push({ year: y, profit: yearProfit, cumulative })
    yearProfit *= 1 + growth / 100
  }

  let score, scoreLabel, scoreColor
  if (annualROI < 0) {
    score = 0
    scoreLabel = 'Loss — negative cash flow'
    scoreColor = '#E05C5C'
  } else if (annualROI < 5) {
    score = 1
    scoreLabel = 'Poor'
    scoreColor = '#d85a30'
  } else if (annualROI < 15) {
    score = 2
    scoreLabel = 'Fair'
    scoreColor = '#E08A3C'
  } else if (annualROI < 30) {
    score = 3
    scoreLabel = 'Good'
    scoreColor = '#C9A227'
  } else if (annualROI < 50) {
    score = 4
    scoreLabel = 'Great'
    scoreColor = '#5CB85C'
  } else {
    score = 5
    scoreLabel = 'Excellent'
    scoreColor = '#3d9e75'
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
    years,
    score,
    scoreLabel,
    scoreColor,
  }
}
