export function generateStrategy({
  monthlyGrowth, currentAov, futureAov, auMargin, usMargin, marRevenue, decRevenue, decMargin,
}) {
  const lines = [];

  if (monthlyGrowth < 3) {
    lines.push(
      `At ${monthlyGrowth}% monthly order growth, you're in conservative territory — retention and repeat-purchase flows can likely carry this pace without adding paid acquisition risk.`
    );
  } else if (monthlyGrowth <= 7) {
    lines.push(
      `${monthlyGrowth}% monthly order growth is a steady scaling pace — keep a balanced mix of paid and organic acquisition so CAC doesn't creep up as volume increases.`
    );
  } else {
    lines.push(
      `${monthlyGrowth}% monthly order growth is aggressive — watch CAC and inventory coverage closely, and diversify acquisition channels so you aren't dependent on one paid source scaling with you.`
    );
  }

  const aovJump = (futureAov - currentAov) / currentAov;
  if (aovJump > 0.3) {
    lines.push(
      `The July AOV jump from $${currentAov} to $${futureAov} (${(aovJump * 100).toFixed(0)}% increase) is significant — reinforce it with bundling, upsells, or a free-shipping threshold so the higher basket size sticks rather than reverting.`
    );
  } else {
    lines.push(
      `The July AOV move from $${currentAov} to $${futureAov} is a modest, low-risk step — achievable through merchandising and pricing alone.`
    );
  }

  if (auMargin < usMargin) {
    lines.push(
      `AU margin (${auMargin}%) is trailing US (${usMargin}%) despite AU carrying 60% of revenue — prioritize AU freight cost or discount-depth review to close the gap, since the regional split itself is fixed.`
    );
  } else if (usMargin < auMargin) {
    lines.push(
      `US margin (${usMargin}%) is trailing AU (${auMargin}%) — look at US freight, discounting, or FX exposure to close the gap, since the regional split itself is fixed.`
    );
  } else {
    lines.push(
      `AU and US margins are matched at ${auMargin}% — maintain parity as you scale rather than letting one region absorb more discounting than the other.`
    );
  }

  const multiple = decRevenue / marRevenue;
  lines.push(
    `December is projected at $${Math.round(decRevenue).toLocaleString()}, a ${multiple.toFixed(1)}x multiple of the $${marRevenue.toLocaleString()} March baseline, at a ${decMargin.toFixed(1)}% blended margin — treat this as the north star the above tactics need to serve.`
  );

  return lines;
}
