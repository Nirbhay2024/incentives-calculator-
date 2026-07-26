import { ruleToEnglish } from './rulePreview';

export function evaluateSchemeRules(bucket, targets, products, rules) {
  let nudges = [];
  let explanations = [];

  // 1. Calculate sales count by segment
  let innovativeSales = 0;
  let flagshipSales = 0;

  Object.entries(bucket).forEach(([id, units]) => {
    if (units <= 0) return;
    const p = products.find(x => x.id === id);
    if (!p || p.category !== 'Smartphone') return;
    if (p.series === 'S' || p.series === 'Z' || p.flagship) flagshipSales += units;
    else innovativeSales += units;
  });

  const targetInn = Math.max(targets.innovative || 1, 1);
  const targetFlag = Math.max(targets.flagship || 1, 1);
  const innAchievement = innovativeSales / targetInn;
  const flagAchievement = flagshipSales / targetFlag;

  // Base model units aggregator
  const baseModelUnits = {};
  Object.entries(bucket).forEach(([id, units]) => {
    if (units <= 0) return;
    const p = products.find(x => x.id === id);
    if (!p) return;
    const key = p.baseModel || p.model;
    baseModelUnits[key] = (baseModelUnits[key] || 0) + units;
  });

  // Find active rules by type
  const dpSlabRule = rules.find(r => r.type === 'dp_slab_base' && r.category === 'Smartphone');
  const fmMultiplierRule = rules.find(r => r.type === 'series_multiplier' && r.category === 'Smartphone');
  const focusRules = rules.filter(r => r.type === 'focus_model_volume' && r.category === 'Smartphone');
  const kickerRule = rules.find(r => r.type === 'kicker_bonus' && r.category === 'Smartphone');
  const flagshipGridRule = rules.find(r => r.type === 'flagship_achievement_grid');
  const innGateRule = rules.find(r => r.type === 'target_gate' && r.segment === 'Innovative');
  const flagGateRule = rules.find(r => r.type === 'target_gate' && r.segment === 'Flagship');

  const wearableFlatRule = rules.find(r => r.type === 'wearable_flat');
  const wearableIncrRule = rules.find(r => r.type === 'volume_incremental');

  const tabletRule = rules.find(r => r.type === 'dp_range_slab' && r.category === 'Tablet');
  const notebookRule = rules.find(r => r.type === 'volume_bonus_gate' && r.category === 'Notebook');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. SMARTPHONES - INNOVATIVE
  // ───────────────────────────────────────────────────────────────────────────
  let innovativeTotal = 0;
  const processedFocus = new Set();

  Object.entries(bucket).forEach(([id, units]) => {
    if (units <= 0) return;
    const product = products.find(x => x.id === id);
    if (!product || product.category !== 'Smartphone') return;
    if (product.flagship || product.series === 'S' || product.series === 'Z') return;

    const baseName = product.baseModel || product.model;
    const fRule = focusRules.find(r => r.model === baseName);

    if (fRule && fRule.slabs) {
      if (processedFocus.has(baseName)) return;
      processedFocus.add(baseName);

      const totalUnits = baseModelUnits[baseName] || 0;
      const slabs = fRule.slabs || [];
      const currentTier = [...slabs].reverse().find(r => totalUnits >= r.min);

      if (currentTier) {
        const earned = currentTier.reward * totalUnits;
        innovativeTotal += earned;
        explanations.push({
          ruleId: fRule.id,
          name: fRule.name,
          category: 'Smartphone',
          status: 'earned',
          amount: earned,
          text: `Sold ${totalUnits} ${baseName} units. Tier hit: ${currentTier.min}+ units @ ₹${currentTier.reward}/unit.`
        });
      }

      // Nudge for next tier
      const nextTier = slabs.find(r => totalUnits < r.min);
      if (nextTier) {
        const gap = nextTier.min - totalUnits;
        const extra = (nextTier.reward - (currentTier ? currentTier.reward : 0)) * totalUnits;
        nudges.push({
          type: 'focus',
          emoji: '🎯',
          impact: extra,
          title: `${gap} more ${baseName} = ₹${extra.toLocaleString()} extra`,
          body: `You're at ${totalUnits} unit${totalUnits !== 1 ? 's' : ''}. Sell ${gap} more ${baseName} to jump to ₹${nextTier.reward}/unit and unlock ₹${extra.toLocaleString()} additional earnings!`
        });
      }
    } else {
      // Standard DP Slab
      let reward = 0;
      if (dpSlabRule && dpSlabRule.slabs && product.dpSlab) {
        reward = dpSlabRule.slabs[product.dpSlab]?.reward || 0;
      }

      // Series multiplier check (e.g. F & M series)
      if (fmMultiplierRule && fmMultiplierRule.series?.includes(product.series)) {
        const isExcepted = fmMultiplierRule.exceptions?.includes(baseName);
        if (!isExcepted) {
          reward = reward * (fmMultiplierRule.multiplier || 0.5);
        }
      }

      const earned = reward * units;
      innovativeTotal += earned;

      if (earned > 0) {
        explanations.push({
          ruleId: dpSlabRule?.id || 'dp-slab',
          name: `${product.model} Base Incentive`,
          category: 'Smartphone',
          status: 'earned',
          amount: earned,
          text: `Sold ${units} units @ ₹${reward}/unit (DP Slab: ${product.dpSlab || 'Standard'}).`
        });
      }
    }
  });

  // A27 / Kicker check
  if (kickerRule && kickerRule.model) {
    const kModel = kickerRule.model;
    const kUnits = baseModelUnits[kModel] || 0;
    const minReq = kickerRule.minUnits || 5;
    const rPerUnit = kickerRule.rewardPerUnit || 150;

    if (kUnits >= minReq) {
      const earned = rPerUnit * kUnits;
      innovativeTotal += earned;
      nudges.push({
        type: 'kicker_achieved',
        emoji: '🔥',
        impact: earned,
        title: `${kModel} Kicker Unlocked! +₹${earned.toLocaleString()}`,
        body: `You sold ${kUnits} ${kModel} units and unlocked the ₹${rPerUnit}/unit kicker bonus!`
      });
      explanations.push({
        ruleId: kickerRule.id,
        name: kickerRule.name,
        category: 'Smartphone',
        status: 'earned',
        amount: earned,
        text: `Sold ${kUnits} ${kModel} units (>= ${minReq} required). Bonus: ₹${rPerUnit}/unit.`
      });
    } else if (kUnits > 0) {
      const gap = minReq - kUnits;
      const potential = rPerUnit * minReq;
      nudges.push({
        type: 'kicker',
        emoji: '💰',
        impact: potential,
        title: `${gap} more ${kModel} = ₹${potential.toLocaleString()} kicker bonus`,
        body: `Sell ${gap} more ${kModel} to unlock a ₹${rPerUnit}/unit kicker on all ${minReq} units!`
      });
      explanations.push({
        ruleId: kickerRule.id,
        name: kickerRule.name,
        category: 'Smartphone',
        status: 'missed',
        amount: 0,
        text: `Sold ${kUnits} ${kModel} units. Need ${gap} more to hit ${minReq} units threshold.`
      });
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // INNOVATIVE TARGET GATE
  // ───────────────────────────────────────────────────────────────────────────
  let innovativeLocked = false;
  const minInnGate = innGateRule?.minAchievement || 0.8;

  if (innAchievement < minInnGate) {
    innovativeLocked = true;
    const needed = Math.ceil(targetInn * minInnGate) - innovativeSales;
    nudges.push({
      type: 'target_locked',
      emoji: '🔒',
      impact: innovativeTotal,
      title: `Sell ${needed} more Innovative phones to unlock your payout`,
      body: `You're at ${Math.round(innAchievement * 100)}% of your Innovative target. Hit ${Math.round(minInnGate * 100)}% to start earning!`
    });
    explanations.push({
      ruleId: innGateRule?.id || 'inn-gate',
      name: innGateRule?.name || 'Innovative Target Gate',
      category: 'Smartphone',
      status: 'locked',
      amount: 0,
      text: `Target achievement is ${Math.round(innAchievement * 100)}% (Minimum required: ${Math.round(minInnGate * 100)}%). ₹${Math.round(innovativeTotal).toLocaleString()} held until 80% is reached.`
    });
    innovativeTotal = 0;
  } else if (innAchievement < 1.0) {
    const fullTotal = innovativeTotal;
    innovativeTotal = Math.round(innovativeTotal * innAchievement);
    const needed = Math.ceil(targetInn) - innovativeSales;
    const uplift = fullTotal - innovativeTotal;
    nudges.push({
      type: 'target_partial',
      emoji: '📈',
      impact: uplift,
      title: `${needed} more Innovative phones = ₹${uplift.toLocaleString()} more payout`,
      body: `At ${Math.round(innAchievement * 100)}% target, you earn pro-rated. Hit 100% to unlock full ₹${Math.round(fullTotal).toLocaleString()} payout!`
    });
    explanations.push({
      ruleId: innGateRule?.id || 'inn-gate',
      name: 'Innovative Pro-rated Multiplier',
      category: 'Smartphone',
      status: 'partial',
      amount: innovativeTotal,
      text: `At ${Math.round(innAchievement * 100)}% target, payout is pro-rated (${Math.round(innAchievement * 100)}% of full ₹${Math.round(fullTotal).toLocaleString()}).`
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 2. SMARTPHONES - FLAGSHIP
  // ───────────────────────────────────────────────────────────────────────────
  let flagshipTotal = 0;
  const minFlagGate = flagGateRule?.minAchievement || 0.8;

  Object.entries(bucket).forEach(([id, units]) => {
    if (units <= 0) return;
    const product = products.find(x => x.id === id);
    if (!product || product.category !== 'Smartphone') return;
    if (!product.flagship && product.series !== 'S' && product.series !== 'Z') return;

    if (flagAchievement >= minFlagGate && flagshipGridRule && flagshipGridRule.grid) {
      const row = flagshipGridRule.grid.find(r =>
        flagAchievement >= r.achieveMin &&
        flagAchievement <= r.achieveMax &&
        r.dpSlab === product.dpSlab
      );
      const reward = row ? row.reward : 0;
      const earned = reward * units;
      flagshipTotal += earned;

      if (earned > 0) {
        explanations.push({
          ruleId: flagshipGridRule.id,
          name: `${product.model} Flagship Reward`,
          category: 'Smartphone',
          status: 'earned',
          amount: earned,
          text: `Achieved ${Math.round(flagAchievement * 100)}% Flagship target. DP Slab: ${product.dpSlab}. Reward: ₹${reward}/unit × ${units} units.`
        });
      }
    }
  });

  if (flagAchievement < minFlagGate && flagshipSales > 0) {
    const needed = Math.ceil(targetFlag * minFlagGate) - flagshipSales;
    nudges.push({
      type: 'flagship_locked',
      emoji: '⭐',
      impact: 2000,
      title: `${needed} more Flagship unit${needed !== 1 ? 's' : ''} to unlock Flagship incentives`,
      body: `You're at ${Math.round(flagAchievement * 100)}% of your Flagship target. You need ${Math.round(minFlagGate * 100)}% to unlock per-unit rewards!`
    });
    explanations.push({
      ruleId: flagGateRule?.id || 'flag-gate',
      name: 'Flagship Target Gate',
      category: 'Smartphone',
      status: 'locked',
      amount: 0,
      text: `Flagship target achievement is ${Math.round(flagAchievement * 100)}% (Minimum required: ${Math.round(minFlagGate * 100)}%).`
    });
  } else if (flagAchievement >= minFlagGate && flagAchievement < 1.2) {
    const needed = Math.ceil(targetFlag * 1.2) - flagshipSales;
    nudges.push({
      type: 'flagship_tier',
      emoji: '🚀',
      impact: 1000,
      title: `${needed} more Flagship unit${needed !== 1 ? 's' : ''} to hit 120% and max your reward`,
      body: `At ${Math.round(flagAchievement * 100)}% Flagship achievement, push to 120% for top grid payouts!`
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. WEARABLES
  // ───────────────────────────────────────────────────────────────────────────
  let wearableTotal = 0;
  let totalWatches = 0;
  let totalBuds = 0;

  Object.entries(bucket).forEach(([id, units]) => {
    if (units <= 0) return;
    const product = products.find(x => x.id === id && x.category === 'Wearable');
    if (!product) return;

    if (product.subCategory === 'Watch') totalWatches += units;
    if (product.subCategory === 'Buds') totalBuds += units;

    const baseName = product.baseModel || product.model;
    const flatRewards = wearableFlatRule?.flatRewards || {};
    const flatReward = flatRewards[baseName] ??
      (product.subCategory === 'Watch' ? flatRewards['Other Watches'] || 500 : flatRewards['Other Buds'] || 200);

    const earned = flatReward * units;
    wearableTotal += earned;

    if (earned > 0) {
      explanations.push({
        ruleId: wearableFlatRule?.id || 'wearable-flat',
        name: `${product.model} Base Incentive`,
        category: 'Wearable',
        status: 'earned',
        amount: earned,
        text: `Sold ${units} units @ ₹${flatReward}/unit flat reward.`
      });
    }
  });

  // Incremental Watch/Buds rewards
  if (wearableIncrRule && wearableIncrRule.incrementalRewards) {
    const inc = wearableIncrRule.incrementalRewards;

    if (totalWatches > 0 && inc.Watch) {
      const rule = [...inc.Watch].reverse().find(r => totalWatches >= r.min);
      if (rule) {
        const bonus = rule.reward * totalWatches;
        wearableTotal += bonus;
        explanations.push({
          ruleId: wearableIncrRule.id,
          name: 'Watch Volume Bonus',
          category: 'Wearable',
          status: 'earned',
          amount: bonus,
          text: `Sold ${totalWatches} watches (>= ${rule.min} tier). Incremental bonus: ₹${rule.reward}/watch.`
        });
      }
      const nextRule = inc.Watch.find(r => totalWatches < r.min);
      if (nextRule) {
        const gap = nextRule.min - totalWatches;
        const extra = nextRule.reward * totalWatches;
        nudges.push({
          type: 'wearable',
          emoji: '⌚',
          impact: extra,
          title: `${gap} more Watch = extra ₹${nextRule.reward}/unit`,
          body: `You sold ${totalWatches} watch${totalWatches !== 1 ? 'es' : ''}. Sell ${gap} more to earn an extra ₹${nextRule.reward} per watch across all units!`
        });
      }
    }

    if (totalBuds > 0 && inc.Buds) {
      const rule = [...inc.Buds].reverse().find(r => totalBuds >= r.min);
      if (rule) {
        const bonus = rule.reward * totalBuds;
        wearableTotal += bonus;
        explanations.push({
          ruleId: wearableIncrRule.id,
          name: 'Buds Volume Bonus',
          category: 'Wearable',
          status: 'earned',
          amount: bonus,
          text: `Sold ${totalBuds} Buds (>= ${rule.min} tier). Incremental bonus: ₹${rule.reward}/unit.`
        });
      }
      const nextRule = inc.Buds.find(r => totalBuds < r.min);
      if (nextRule) {
        const gap = nextRule.min - totalBuds;
        const extra = nextRule.reward * totalBuds;
        nudges.push({
          type: 'wearable',
          emoji: '🎧',
          impact: extra,
          title: `${gap} more Buds = extra ₹${nextRule.reward}/unit`,
          body: `You sold ${totalBuds} Buds. Sell ${gap} more to earn ₹${nextRule.reward} per Buds unit across all units!`
        });
      }
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 4. TABLETS
  // ───────────────────────────────────────────────────────────────────────────
  let tabletTotal = 0;
  let tabletUnits = 0;

  Object.entries(bucket).forEach(([id, units]) => {
    if (units <= 0) return;
    const product = products.find(x => x.id === id && x.category === 'Tablet');
    if (!product) return;

    tabletUnits += units;
    const baseName = product.baseModel || product.model;

    if (tabletRule?.focusModels && tabletRule.focusModels[baseName]) {
      const reward = tabletRule.focusModels[baseName];
      const earned = reward * units;
      tabletTotal += earned;
      explanations.push({
        ruleId: tabletRule.id,
        name: `${product.model} Focus Tablet`,
        category: 'Tablet',
        status: 'earned',
        amount: earned,
        text: `Focus tablet reward: ₹${reward}/unit × ${units} units.`
      });
    } else if (tabletRule?.slabs) {
      const slab = tabletRule.slabs.find(s => (product.dp || 0) >= s.dpMin && (product.dp || 0) <= s.dpMax);
      const reward = slab ? slab.reward : 0;
      const earned = reward * units;
      tabletTotal += earned;
      if (earned > 0) {
        explanations.push({
          ruleId: tabletRule.id,
          name: `${product.model} Tablet Base`,
          category: 'Tablet',
          status: 'earned',
          amount: earned,
          text: `DP Slab reward (DP: ₹${(product.dp || 0).toLocaleString()}): ₹${reward}/unit × ${units} units.`
        });
      }
    }
  });

  const minTabletGate = tabletRule?.minimumGate || 2;
  if (tabletUnits > 0 && tabletUnits < minTabletGate) {
    const gap = minTabletGate - tabletUnits;
    nudges.push({
      type: 'tablet',
      emoji: '📱',
      impact: tabletTotal,
      title: `${gap} more Tablet to unlock Tablet incentives`,
      body: `You need at least ${minTabletGate} tablets to qualify. Sell ${gap} more to unlock ₹${tabletTotal.toLocaleString()} payout!`
    });
    explanations.push({
      ruleId: tabletRule?.id || 'tablet-gate',
      name: 'Tablet Category Gate',
      category: 'Tablet',
      status: 'locked',
      amount: 0,
      text: `Sold ${tabletUnits} tablet(s). Minimum ${minTabletGate} required to unlock payout.`
    });
    tabletTotal = 0;
  } else if (tabletRule?.maximumEarning && tabletTotal > tabletRule.maximumEarning) {
    tabletTotal = tabletRule.maximumEarning;
    explanations.push({
      ruleId: tabletRule.id,
      name: 'Tablet Earning Cap',
      category: 'Tablet',
      status: 'capped',
      amount: tabletTotal,
      text: `Tablet earnings capped at maximum limit of ₹${tabletRule.maximumEarning.toLocaleString()}.`
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 5. NOTEBOOKS
  // ───────────────────────────────────────────────────────────────────────────
  let notebookTotal = 0;
  let notebookUnits = 0;

  Object.entries(bucket).forEach(([id, units]) => {
    if (units <= 0) return;
    const product = products.find(x => x.id === id && x.category === 'Notebook');
    if (!product) return;

    notebookUnits += units;
    const baseName = product.baseModel || product.model;
    const rewards = notebookRule?.rewards || {};
    const reward = rewards[baseName] ?? rewards['Other Models'] ?? 750;
    const earned = reward * units;
    notebookTotal += earned;

    if (earned > 0) {
      explanations.push({
        ruleId: notebookRule?.id || 'notebook-base',
        name: `${product.model} Base Incentive`,
        category: 'Notebook',
        status: 'earned',
        amount: earned,
        text: `Notebook reward: ₹${reward}/unit × ${units} units.`
      });
    }
  });

  const nbGate = notebookRule?.additionalRewardGate || 10;
  const nbBonusPerUnit = notebookRule?.additionalReward || 500;

  if (notebookUnits > 0 && notebookUnits < nbGate) {
    const gap = nbGate - notebookUnits;
    const potentialBonus = nbBonusPerUnit * nbGate;
    nudges.push({
      type: 'notebook',
      emoji: '💻',
      impact: potentialBonus,
      title: `${gap} more Notebooks = ₹${nbBonusPerUnit} bonus per unit`,
      body: `Sell ${gap} more notebooks to unlock a ₹${nbBonusPerUnit}/unit bonus on ALL notebooks!`
    });
  } else if (notebookUnits >= nbGate) {
    const bonus = nbBonusPerUnit * notebookUnits;
    notebookTotal += bonus;
    explanations.push({
      ruleId: notebookRule.id,
      name: 'Notebook Volume Bonus',
      category: 'Notebook',
      status: 'earned',
      amount: bonus,
      text: `Sold ${notebookUnits} notebooks (>= ${nbGate} gate). Bonus: ₹${nbBonusPerUnit}/unit on all units.`
    });
  }

  if (notebookRule?.maximumEarning && notebookTotal > notebookRule.maximumEarning) {
    notebookTotal = notebookRule.maximumEarning;
    explanations.push({
      ruleId: notebookRule.id,
      name: 'Notebook Earning Cap',
      category: 'Notebook',
      status: 'capped',
      amount: notebookTotal,
      text: `Notebook earnings capped at maximum limit of ₹${notebookRule.maximumEarning.toLocaleString()}.`
    });
  }

  // Sort nudges by highest financial impact first
  nudges.sort((a, b) => (b.impact || 0) - (a.impact || 0));

  const breakdown = {
    innovative: Math.round(innovativeTotal),
    flagship: Math.round(flagshipTotal),
    smartphones: Math.round(innovativeTotal + flagshipTotal),
    wearables: Math.round(wearableTotal),
    tablets: Math.round(tabletTotal),
    notebooks: Math.round(notebookTotal),
    innovativeLocked,
    innAchievement,
    flagAchievement,
    innovativeSales,
    flagshipSales
  };

  const totalIncentive = breakdown.smartphones + breakdown.wearables + breakdown.tablets + breakdown.notebooks;

  return { totalIncentive, breakdown, nudges, explanations };
}
