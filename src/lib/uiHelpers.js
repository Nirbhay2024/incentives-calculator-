// Selects the full value on focus so tapping/clicking an input with an
// existing number (e.g. a quantity or price) lets you just start typing to
// replace it, instead of having to manually delete the old value first.
export const selectOnFocus = (e) => e.target.select();
