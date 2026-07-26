import { evaluateSchemeRules } from './ruleEngine';
import { getActiveScheme, getProducts, getRules } from './storage';

export function calculateIncentives(bucket, targets, schemeOverride) {
  // If schemeOverride is passed (e.g. in tests or initial seed), build rules from it if rules array not provided
  let products = getProducts();
  let rules = getRules();

  if (schemeOverride && schemeOverride.products) {
    products = schemeOverride.products;
  }

  return evaluateSchemeRules(bucket, targets, products, rules);
}
