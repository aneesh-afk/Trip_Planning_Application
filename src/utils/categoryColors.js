export const CATEGORY_COLORS = {
  food: {
    bg: 'bg-route/10',
    text: 'text-route',
    border: 'border-route/20'
  },
  sightseeing: {
    bg: 'bg-horizon/10',
    text: 'text-horizon',
    border: 'border-horizon/20'
  },
  transport: {
    bg: 'bg-ink/10',
    text: 'text-ink',
    border: 'border-ink/20'
  },
  other: {
    bg: 'bg-muted/10',
    text: 'text-muted',
    border: 'border-border'
  }
};

export function getCategoryStyles(category) {
  const normalized = (category || 'other').toLowerCase();
  return CATEGORY_COLORS[normalized] || CATEGORY_COLORS.other;
}
