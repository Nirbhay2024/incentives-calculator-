import seedScheme from '../config/schemeJuly2026.json';

const SCHEMES_KEY = 'incentives_schemes';
const PRODUCTS_KEY = 'incentives_products';
const RULES_KEY = 'incentives_rules';
const ACTIVE_SCHEME_KEY = 'incentives_active_scheme';

export function initStorage() {
  if (!localStorage.getItem(SCHEMES_KEY)) {
    seedStorage();
  }
}

export function seedStorage() {
  const initialSchemeId = 'scheme-july-2026';
  
  const schemes = [
    {
      id: initialSchemeId,
      name: seedScheme.month || 'July 2026 Scheme',
      description: 'Official July 2026 Incentives Scheme',
      channel: 'MR Channel',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      status: 'Active',
      version: '1.0'
    }
  ];

  // Map seed products
  const products = (seedScheme.products || []).map(p => ({
    ...p,
    status: p.status || 'Active'
  }));

  // Create rules array from initial seed file configuration
  const rules = [];

  // 1. DP Slab Base Rule for Smartphones
  rules.push({
    id: 'rule-dp-slabs-smartphones',
    schemeId: initialSchemeId,
    name: 'Smartphone Base DP Slabs',
    type: 'dp_slab_base',
    category: 'Smartphone',
    description: 'Standard per-unit incentive based on Smartphone DP slabs (10k-15k: ₹30, 15k-20k: ₹75, 20k-30k: ₹250, 30k-40k: ₹300, 40k+: ₹400).',
    slabs: seedScheme.dpSlabRewards?.smartphones || {},
    status: 'Active'
  });

  // 2. F & M Series Multiplier & Exceptions Rule
  rules.push({
    id: 'rule-fm-multiplier',
    schemeId: initialSchemeId,
    name: 'F & M Series Multiplier Override',
    type: 'series_multiplier',
    category: 'Smartphone',
    description: 'F & M series models earn 50% of the standard DP slab reward (Multiplier: 0.5), except for exempted models like F17.',
    series: ['F', 'M'],
    multiplier: seedScheme.smartphones?.f_m_series_multiplier || 0.5,
    exceptions: seedScheme.smartphones?.f_m_exceptions || ['F17'],
    status: 'Active'
  });

  // 3. Focus Models (A57, A37, A27)
  Object.entries(seedScheme.smartphones?.focusModels || {}).forEach(([model, slabs]) => {
    rules.push({
      id: `rule-focus-${model.toLowerCase()}`,
      schemeId: initialSchemeId,
      name: `${model} Focus Model Volume Slabs`,
      type: 'focus_model_volume',
      category: 'Smartphone',
      model: model,
      description: `Sell higher total volume of ${model} to earn higher per-unit rewards.`,
      slabs: slabs,
      status: 'Active'
    });
  });

  // 4. A27 Kicker Bonus Rule
  if (seedScheme.smartphones?.kicker) {
    rules.push({
      id: 'rule-a27-kicker',
      schemeId: initialSchemeId,
      name: 'A27 Volume Kicker Bonus',
      type: 'kicker_bonus',
      category: 'Smartphone',
      model: seedScheme.smartphones.kicker.model,
      minUnits: seedScheme.smartphones.kicker.minUnits,
      rewardPerUnit: seedScheme.smartphones.kicker.reward,
      description: `Sell at least ${seedScheme.smartphones.kicker.minUnits} ${seedScheme.smartphones.kicker.model} units to unlock ₹${seedScheme.smartphones.kicker.reward} extra per unit on all units.`,
      status: 'Active'
    });
  }

  // 5. Flagship Achievement Grid Rule
  if (seedScheme.smartphones?.flagshipGrid) {
    rules.push({
      id: 'rule-flagship-grid',
      schemeId: initialSchemeId,
      name: 'Flagship Achievement Grid',
      type: 'flagship_achievement_grid',
      category: 'Smartphone',
      description: 'Flagship (S & Z series) per-unit earnings based on target achievement % band (80%-120%+) and DP slab (70k-100k, 100k+). Minimum 80% achievement required.',
      grid: seedScheme.smartphones.flagshipGrid,
      status: 'Active'
    });
  }

  // 6. Target Gate Rules
  rules.push({
    id: 'rule-innovative-gate',
    schemeId: initialSchemeId,
    name: 'Innovative Target Gate (80% / 100%)',
    type: 'target_gate',
    category: 'Smartphone',
    segment: 'Innovative',
    minAchievement: 0.8,
    fullAchievement: 1.0,
    description: 'Requires at least 80% achievement on Innovative target to earn payout. Pro-rated between 80% and 100%.',
    status: 'Active'
  });

  rules.push({
    id: 'rule-flagship-gate',
    schemeId: initialSchemeId,
    name: 'Flagship Target Gate (80%)',
    type: 'target_gate',
    category: 'Smartphone',
    segment: 'Flagship',
    minAchievement: 0.8,
    description: 'Requires at least 80% achievement on Flagship target to unlock flagship per-unit earnings.',
    status: 'Active'
  });

  // 7. Wearable Flat & Incremental Rules
  rules.push({
    id: 'rule-wearables-flat',
    schemeId: initialSchemeId,
    name: 'Wearables Flat Rewards per Model',
    type: 'wearable_flat',
    category: 'Wearable',
    description: 'Flat per-unit reward for Watches, Buds, and Rings.',
    flatRewards: seedScheme.wearables?.flatRewards || {},
    status: 'Active'
  });

  rules.push({
    id: 'rule-wearables-incremental',
    schemeId: initialSchemeId,
    name: 'Wearables Volume Incremental Bonus',
    type: 'volume_incremental',
    category: 'Wearable',
    description: 'Incremental volume bonuses for Watches and Buds when quantity thresholds are crossed.',
    incrementalRewards: seedScheme.wearables?.incrementalRewards || {},
    status: 'Active'
  });

  // 8. Tablet Rules
  rules.push({
    id: 'rule-tablets-scheme',
    schemeId: initialSchemeId,
    name: 'Tablet Scheme & DP Slabs',
    type: 'dp_range_slab',
    category: 'Tablet',
    minimumGate: seedScheme.tablets?.minimumGate || 2,
    maximumEarning: seedScheme.tablets?.maximumEarning || 20000,
    slabs: seedScheme.tablets?.slabs || [],
    focusModels: seedScheme.tablets?.focusModels || {},
    description: 'Tablet earnings based on DP slabs or focus model rewards. Minimum 2 tablets required to qualify. Max capping ₹20,000.',
    status: 'Active'
  });

  // 9. Notebook Rules
  rules.push({
    id: 'rule-notebooks-scheme',
    schemeId: initialSchemeId,
    name: 'Notebook Scheme & Volume Bonus',
    type: 'volume_bonus_gate',
    category: 'Notebook',
    rewards: seedScheme.notebooks?.rewards || {},
    additionalRewardGate: seedScheme.notebooks?.additionalRewardGate || 10,
    additionalReward: seedScheme.notebooks?.additionalReward || 500,
    maximumEarning: seedScheme.notebooks?.maximumEarning || 50000,
    description: 'Notebook per-model rewards plus ₹500 extra per unit if 10+ notebooks are sold. Max capping ₹50,000.',
    status: 'Active'
  });

  localStorage.setItem(SCHEMES_KEY, JSON.stringify(schemes));
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  localStorage.setItem(ACTIVE_SCHEME_KEY, initialSchemeId);
}

// Storage API - Schemes
export function getSchemes() {
  initStorage();
  return JSON.parse(localStorage.getItem(SCHEMES_KEY) || '[]');
}

export function getActiveSchemeId() {
  initStorage();
  return localStorage.getItem(ACTIVE_SCHEME_KEY) || 'scheme-july-2026';
}

export function getActiveScheme() {
  const schemes = getSchemes();
  const activeId = getActiveSchemeId();
  return schemes.find(s => s.id === activeId) || schemes[0];
}

export function setActiveSchemeId(id) {
  localStorage.setItem(ACTIVE_SCHEME_KEY, id);
}

export function saveScheme(scheme) {
  const schemes = getSchemes();
  const idx = schemes.findIndex(s => s.id === scheme.id);
  if (idx >= 0) {
    schemes[idx] = scheme;
  } else {
    schemes.push(scheme);
  }
  localStorage.setItem(SCHEMES_KEY, JSON.stringify(schemes));
}

// Storage API - Products
export function getProducts(includeArchived = false) {
  initStorage();
  const products = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
  if (includeArchived) return products;
  return products.filter(p => p.status !== 'Archived');
}

export function saveProduct(product) {
  const products = getProducts(true);
  const idx = products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    products[idx] = product;
  } else {
    products.push(product);
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

export function archiveProduct(id) {
  const products = getProducts(true);
  const idx = products.findIndex(p => p.id === id);
  if (idx >= 0) {
    products[idx].status = 'Archived';
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  }
}

// Storage API - Rules
export function getRules(schemeId) {
  initStorage();
  const rules = JSON.parse(localStorage.getItem(RULES_KEY) || '[]');
  const targetId = schemeId || getActiveSchemeId();
  return rules.filter(r => r.schemeId === targetId);
}

export function saveRule(rule) {
  initStorage();
  const rules = JSON.parse(localStorage.getItem(RULES_KEY) || '[]');
  const idx = rules.findIndex(r => r.id === rule.id);
  if (idx >= 0) {
    rules[idx] = rule;
  } else {
    rules.push(rule);
  }
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}

export function deleteRule(id) {
  initStorage();
  let rules = JSON.parse(localStorage.getItem(RULES_KEY) || '[]');
  rules = rules.filter(r => r.id !== id);
  localStorage.setItem(RULES_KEY, JSON.stringify(rules));
}
