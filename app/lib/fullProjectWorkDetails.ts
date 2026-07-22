export interface WorkDetailPoint {
  id: string;
  text: string;
  isCustom?: boolean;
}

export interface WorkDetailSection {
  id: string;
  number: number;
  title: string;
  points: WorkDetailPoint[];
  isCustom?: boolean;
}

const point = (id: string, text: string): WorkDetailPoint => ({ id, text });

export function createDefaultWorkDetails(): WorkDetailSection[] {
  return [
    {
      id: "section-1",
      number: 1,
      title: "Earth work. Excavations and Foundations work",
      points: [
        point("s1-p1", "Column pits size: 150cm x 150cm x 150cm"),
        point("s1-p2", "Septic tank size: 150cm x 300cm"),
        point("s1-p3", "Waste tank size: 150cm x 300cm"),
      ],
    },
    {
      id: "section-2",
      number: 2,
      title: "Foundation work - As per column footing method",
      points: [
        point("s2-p1", "Column footing as per plan"),
        point("s2-p2", "16mm and 8mm steel bars as per structural design"),
        point("s2-p3", "Column size: 20cm x 40cm"),
        point("s2-p4", "M20 grade concrete"),
      ],
    },
    {
      id: "section-3",
      number: 3,
      title: "Plinth Beam",
      points: [
        point("s3-p1", "M20 RCC proportion"),
        point("s3-p2", "16mm and 8mm TMT bars as per design"),
        point("s3-p3", "Dr. Fixit waterproofing"),
      ],
    },
    {
      id: "section-4",
      number: 4,
      title: "Brick work - as per plan by using solid block",
      points: [
        point("s4-p1", "Outside walls: 8\" x 8\" x 12\" solid blocks"),
        point("s4-p2", "Inside walls: 6\" x 8\" x 12\" solid blocks"),
        point("s4-p3", "Toilet walls: 4\" x 8\" x 12\" solid blocks"),
      ],
    },
    {
      id: "section-5",
      number: 5,
      title: "Lintel work",
      points: [
        point("s5-p1", "Lintel size: 20cm x 15cm"),
        point("s5-p2", "RCC proportion 1:1.5:3"),
      ],
    },
    {
      id: "section-6",
      number: 6,
      title: "Slab concrete",
      points: [
        point("s6-p1", "Slab thickness: 12 cm"),
        point("s6-p2", "RCC proportion 1:1.5:3, M20"),
      ],
    },
    {
      id: "section-7",
      number: 7,
      title: "Floor concrete",
      points: [
        point("s7-p1", "Cement concrete proportion 1:4:8"),
        point("s7-p2", "Thickness: 10 cm"),
      ],
    },
    {
      id: "section-8",
      number: 8,
      title: "Wall Plastering",
      points: [
        point("s8-p1", "Cement mortar 1:5"),
        point("s8-p2", "Thickness: 12mm, one coat"),
      ],
    },
    {
      id: "section-9",
      number: 9,
      title: "Slab Plastering",
      points: [
        point("s9-p1", "Cement mortar 1:5"),
        point("s9-p2", "Thickness: 12mm"),
      ],
    },
    {
      id: "section-10",
      number: 10,
      title: "Emulsion",
      points: [
        point("s10-p1", "Interior emulsion: Apex range"),
        point("s10-p2", "Exterior emulsion: Premium range"),
        point("s10-p3", "Melamine wood finish for polishing"),
      ],
    },
    {
      id: "section-11",
      number: 11,
      title: "Ceiling Finishes",
      points: [
        point("s11-p1", "Ceiling work in living, dining and kitchen areas"),
      ],
    },
    {
      id: "section-12",
      number: 12,
      title: "Floor finishes",
      points: [
        point("s12-p1", "Epoxy floors where specified"),
        point("s12-p2", "Bathroom waterproofing"),
        point("s12-p3", "Bathroom tiles: Rs 55 per sqft"),
        point("s12-p4", "Room tiles: Rs 65 per sqft"),
        point("s12-p5", "Granite for sit-out and kitchen top: Rs 180 per sqft"),
      ],
    },
    {
      id: "section-13",
      number: 13,
      title: "Door & windows",
      points: [
        point("s13-p1", "Main door with premium wood finish: Rs 20,000/- each"),
        point("s13-p2", "Powder coated aluminum windows"),
        point("s13-p3", "Puja room / terrace door: Rs 12,000/- each"),
        point("s13-p4", "Inside WPC doors: Rs 7,000/- each"),
        point("s13-p5", "Bathroom doors: Rs 6,000/- each"),
        point("s13-p6", "Locks: Rs 800/- each"),
      ],
    },
    {
      id: "section-14",
      number: 14,
      title: "Electrical work",
      points: [
        point("s14-p1", "CCTV provision"),
        point("s14-p2", "Light points and fan points"),
        point("s14-p3", "Switch points"),
        point("s14-p4", "TV and photo points"),
        point("s14-p5", "Power plug points"),
        point("s14-p6", "Chimney and inverter points"),
        point("s14-p7", "AC points in all bedrooms"),
      ],
    },
    {
      id: "section-15",
      number: 15,
      title: "Plumbing and sanitary",
      points: [
        point("s15-p1", "Wall mount closet: Rs 14,000/-"),
        point("s15-p2", "Wash basin: Rs 5,000/-"),
        point("s15-p3", "Wash basin tap: Rs 2,200/-"),
        point("s15-p4", "Mirror: Rs 1,000/-"),
        point("s15-p5", "Soap dish: Rs 500/-"),
        point("s15-p6", "Towel rod: Rs 750/-"),
        point("s15-p7", "Kitchen tap: Rs 5,000/-"),
        point("s15-p8", "Basin tap: Rs 3,500/-"),
      ],
    },
    {
      id: "section-16",
      number: 16,
      title: "Interior work",
      points: [
        point("s16-p1", "Prayer unit with 12mm plywood and mica finish"),
        point("s16-p2", "Partition work as per plan"),
        point("s16-p3", "Crockery unit with 18mm plywood"),
        point("s16-p4", "TV unit with mica finish"),
      ],
    },
    {
      id: "section-17",
      number: 17,
      title: "Kitchen and work area cupboard work up to lintel height (210 cm)",
      points: [
        point("s17-p1", "0.7 density WPC material"),
        point("s17-p2", "Kitchen sink: Rs 6,000/-"),
        point("s17-p3", "Tandem boxes"),
        point("s17-p4", "Cutlery trays"),
        point("s17-p5", "Pullout baskets"),
      ],
    },
    {
      id: "section-18",
      number: 18,
      title: "Wardrobe work",
      points: [
        point("s18-p1", "Cellar floor wardrobe: 1.8m x 2.1m"),
        point("s18-p2", "Ground floor wardrobe: 1.35m x 2.1m"),
        point("s18-p3", "18mm 710 marine plywood with mica finish"),
      ],
    },
    {
      id: "section-19",
      number: 19,
      title: "Elevation and roof work",
      points: [
        point("s19-p1", "Work as per approved design"),
      ],
    },
    {
      id: "section-20",
      number: 20,
      title: "Open terrace water proofing",
      points: [
        point("s20-p1", "Waterproofing for open terrace areas"),
      ],
    },
    {
      id: "section-21",
      number: 21,
      title: "Water tank",
      points: [
        point("s21-p1", "Water tank capacity: 2000L"),
      ],
    },
    {
      id: "section-22",
      number: 22,
      title: "Toughened Glass partition",
      points: [
        point("s22-p1", "Toughened glass partitions in all bathrooms"),
      ],
    },
  ];
}

export function renumberSections(sections: WorkDetailSection[]): WorkDetailSection[] {
  return sections.map((section, index) => ({
    ...section,
    number: index + 1,
  }));
}
