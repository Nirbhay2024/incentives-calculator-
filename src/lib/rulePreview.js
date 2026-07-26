export function ruleToEnglish(rule) {
  if (!rule) return '';

  switch (rule.type) {
    case 'dp_slab_base': {
      const slabs = rule.slabs || {};
      const parts = Object.entries(slabs)
        .filter(([, v]) => v.reward > 0)
        .map(([k, v]) => `${v.label || k}: ₹${v.reward}/unit`);
      return `Smartphones earn standard per-unit base incentives based on DP slabs (${parts.join(', ')}).`;
    }

    case 'series_multiplier': {
      const seriesList = (rule.series || []).join(' & ');
      const pct = Math.round((rule.multiplier || 0.5) * 100);
      const exc = (rule.exceptions || []).join(', ');
      return `${seriesList} series models earn ${pct}% of standard DP slab rewards. ${exc ? `Exempt models: ${exc}.` : ''}`;
    }

    case 'focus_model_volume': {
      const model = rule.model || 'selected model';
      const slabs = rule.slabs || [];
      const parts = slabs.map(s => `${s.min}${s.max < 999 ? `–${s.max}` : '+'} units → ₹${s.reward}/unit`);
      return `Selling ${model} unlocks progressive volume tier rewards (${parts.join('; ')}). Applied to all ${model} units.`;
    }

    case 'kicker_bonus': {
      const model = rule.model || 'selected model';
      return `Selling at least ${rule.minUnits || 1} ${model} units unlocks an extra ₹${rule.rewardPerUnit || 0} kicker bonus per unit on ALL ${model} units sold.`;
    }

    case 'flagship_achievement_grid': {
      return `Flagship (S & Z series) incentives scale based on target achievement % (80%+ required) and phone DP slab (₹70k–100k or ₹100k+). Earn up to ₹750/unit at 120%+ target.`;
    }

    case 'target_gate': {
      const seg = rule.segment || 'Category';
      const minPct = Math.round((rule.minAchievement || 0.8) * 100);
      if (rule.fullAchievement) {
        return `${seg} earnings are locked below ${minPct}% target achievement. Between ${minPct}% and 100%, payout is pro-rated proportionally.`;
      }
      return `${seg} earnings are locked below ${minPct}% target achievement. Reaching ${minPct}% unlocks full per-unit grid rewards.`;
    }

    case 'wearable_flat': {
      return `Wearables earn fixed flat rewards per unit based on product model (e.g., Watch Ultra ₹1,200, Buds 4 Pro ₹800, Galaxy Ring ₹3,000).`;
    }

    case 'volume_incremental': {
      return `Crossing watch or buds volume thresholds adds an extra per-unit bonus across all units sold in that category (e.g., 2+ Watches → +₹500/unit).`;
    }

    case 'dp_range_slab': {
      const minG = rule.minimumGate || 1;
      const maxE = rule.maximumEarning ? ` (capped at ₹${rule.maximumEarning.toLocaleString()})` : '';
      return `${rule.category || 'Category'} incentive is based on DP price slabs. Must sell at least ${minG} unit(s) to qualify${maxE}.`;
    }

    case 'volume_bonus_gate': {
      const gate = rule.additionalRewardGate || 1;
      const extra = rule.additionalReward || 0;
      const maxE = rule.maximumEarning ? ` (capped at ₹${rule.maximumEarning.toLocaleString()})` : '';
      return `${rule.category || 'Category'} per-model earnings unlock an additional ₹${extra}/unit bonus on ALL units when selling ${gate}+ units${maxE}.`;
    }

    default:
      return rule.description || `${rule.name}: Custom rule configured by admin.`;
  }
}
