export interface AdditionalWorkItem {
  id: string;
  text: string;
  isCustom?: boolean;
}

export interface MaterialUsedItem {
  id: string;
  material: string;
  details: string;
  isCustom?: boolean;
}

export function createDefaultAdditionalWorks(): AdditionalWorkItem[] {
  return [
    { id: "aw-1", text: "Retaining wall" },
    { id: "aw-2", text: "Earth filling inside the plinth and plot" },
    { id: "aw-3", text: "Electricity connection" },
    { id: "aw-4", text: "All electrical fittings lights & fan etc" },
    { id: "aw-5", text: "All home appliances" },
    { id: "aw-6", text: "Compound wall and gate" },
    { id: "aw-7", text: "Landscaping" },
    { id: "aw-8", text: "Car Porch" },
    { id: "aw-9", text: "Outside stair" },
    { id: "aw-10", text: "Texture painting" },
  ];
}

export function createDefaultMaterialsUsed(): MaterialUsedItem[] {
  return [
    { id: "mu-1", material: "Cement", details: "Ultra tech, Dalmia and Ramco" },
    { id: "mu-2", material: "Tmt", details: "JSW, Vizag, Kalliath" },
    { id: "mu-3", material: "Msand", details: "Used for concrete work and brick work" },
    { id: "mu-4", material: "P sand", details: "Used for plastering work" },
    { id: "mu-5", material: "PVC Pipe", details: "Supreme, Finolex" },
    { id: "mu-6", material: "Pipe fitting", details: "Supreme" },
    { id: "mu-7", material: "Putty", details: "Berger" },
    { id: "mu-8", material: "Paint", details: "Berger" },
    {
      id: "mu-9",
      material: "Closet and Wash basin",
      details: "Jaquar, bathex, parryware, cera",
    },
    { id: "mu-10", material: "Wiring", details: "Finolex, V guard" },
    {
      id: "mu-11",
      material: "Switch (white colour)",
      details: "golgmedal, v quard, GM",
    },
    { id: "mu-12", material: "Water Tank", details: "2000L" },
  ];
}
