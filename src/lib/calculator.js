import { evaluateSchemeRules } from './ruleEngine';

export function calculateIncentives(bucket, targets, products, rules) {
  return evaluateSchemeRules(bucket, targets, products, rules);
}
