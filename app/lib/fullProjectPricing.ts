export interface ProjectCostItem {
  id: string;
  name: string;
  type: "per_sqft" | "fixed";
  rate?: number;
  sqFeet?: number;
  fixedAmount?: number;
  totalAmount: number;
}

export interface ProjectPricingInput {
  sqFeet: number;
  constructionCostPerSqFt: number;
  interiorCostType: "per_sqft" | "fixed";
  interiorCostPerSqFt?: number;
  interiorFixedCost?: number;
  customItems: ProjectCostItem[];
}

export function calculateCustomItemTotal(
  item: Omit<ProjectCostItem, "totalAmount">,
  defaultSqFeet: number
): number {
  if (item.type === "fixed") {
    return item.fixedAmount || 0;
  }
  const sqFeet = item.sqFeet ?? defaultSqFeet;
  return sqFeet * (item.rate || 0);
}

export function calculateProjectTotal(pricing: ProjectPricingInput): number {
  const constructionTotal = pricing.sqFeet * pricing.constructionCostPerSqFt;

  const interiorTotal =
    pricing.interiorCostType === "per_sqft"
      ? pricing.sqFeet * (pricing.interiorCostPerSqFt || 0)
      : pricing.interiorFixedCost || 0;

  const customTotal = pricing.customItems.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0
  );

  return constructionTotal + interiorTotal + customTotal;
}

export function getProjectCostBreakdown(pricing: ProjectPricingInput) {
  const constructionTotal = pricing.sqFeet * pricing.constructionCostPerSqFt;
  const interiorTotal =
    pricing.interiorCostType === "per_sqft"
      ? pricing.sqFeet * (pricing.interiorCostPerSqFt || 0)
      : pricing.interiorFixedCost || 0;
  const customTotal = pricing.customItems.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0
  );

  return {
    constructionTotal,
    interiorTotal,
    customTotal,
    grandTotal: constructionTotal + interiorTotal + customTotal,
  };
}
