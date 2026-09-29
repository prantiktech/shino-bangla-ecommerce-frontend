import { Category } from "@/types";

export interface CategoryTreeNode {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  subCategories?: { id: string; name: string; slug: string; count?: number }[];
}

export const FILTER_CATEGORIES_TREE: CategoryTreeNode[] = [
  {
    id: "action-adventure-toys",
    name: "Action & Adventure Toys",
    slug: "action-adventure-toys",
    icon: "Shield",
    subCategories: [
      { id: "action-figures", name: "Action Figures", slug: "action-figures", count: 42 },
      { id: "friction-toy", name: "Friction Toy", slug: "friction-toy", count: 28 },
      { id: "toy-guns-blasters", name: "Toy Guns & Blasters", slug: "toy-guns-blasters", count: 35 },
      { id: "transformers", name: "Transformers", slug: "transformers", count: 19 }
    ]
  },
  {
    id: "board-puzzle-games",
    name: "Board & Puzzle Games",
    slug: "board-puzzle-games",
    icon: "Gamepad2",
    subCategories: [
      { id: "brain-teasers", name: "Brain Teasers", slug: "brain-teasers", count: 24 },
      { id: "family-board-games", name: "Family Board Games", slug: "family-board-games", count: 31 },
      { id: "puzzle-games", name: "Puzzle Games", slug: "puzzle-games", count: 45 }
    ]
  },
  {
    id: "building-construction",
    name: "Building & Construction",
    slug: "building-construction",
    icon: "Layers",
    subCategories: [
      { id: "construction-connecting", name: "Construction & Connecting Toys", slug: "construction-connecting-toys", count: 29 },
      { id: "lego-building-bricks", name: "LEGO-style Building Bricks", slug: "lego-building-bricks", count: 64 },
      { id: "magnetic-tiles", name: "Magnetic Tiles", slug: "magnetic-tiles", count: 38 },
      { id: "wooden-blocks", name: "Wooden Blocks", slug: "wooden-blocks", count: 22 }
    ]
  },
  {
    id: "educational-learning-toys",
    name: "Educational & Learning Toys",
    slug: "educational-learning-toys",
    icon: "GraduationCap",
    subCategories: [
      { id: "learning-boards", name: "Learning Boards", slug: "learning-boards", count: 18 },
      { id: "montessori-toys", name: "Montessori Toys", slug: "montessori-toys", count: 52 },
      { id: "stem-science-kits", name: "STEM & Science Kits", slug: "stem-science-kits", count: 34 },
      { id: "toy", name: "Toy", slug: "toy-general", count: 15 }
    ]
  },
  {
    id: "ride-on-vehicle-toys",
    name: "Ride-On & Vehicle Toys",
    slug: "ride-on-vehicle-toys",
    icon: "Car",
    subCategories: [
      { id: "electric-cars", name: "Electric Cars", slug: "electric-cars", count: 42 },
      { id: "electric-bikes", name: "Electric Bikes", slug: "electric-bikes", count: 28 },
      { id: "kids-scooters", name: "Kids Scooters", slug: "kids-scooters", count: 35 },
      { id: "rc-high-speed-cars", name: "R/C Cars", slug: "rc-high-speed-cars", count: 53 }
    ]
  }
];

export const CATEGORIES_DATA: Category[] = [
  {
    id: "sensors",
    name: "Sensors",
    slug: "sensors",
    icon: "Radio",
    subCategories: [
      { id: "automation-sensors", name: "Automation Sensors", slug: "automation-sensors", icon: "Radio", itemCount: 28 },
      { id: "proximity-sensors", name: "Proximity Sensors", slug: "proximity-sensors", icon: "Radio", itemCount: 34 },
      { id: "photoelectric-sensors", name: "Photoelectric Sensors", slug: "photoelectric-sensors", icon: "Sparkles", itemCount: 19 },
      { id: "temperature-sensors", name: "Temperature Controllers", slug: "temperature-controllers", icon: "Shield", itemCount: 22 }
    ]
  },
  {
    id: "industrial-electrical",
    name: "Industrial Electrical",
    slug: "industrial-electrical",
    icon: "Layers",
    subCategories: [
      { id: "contactors-relays", name: "Magnetic Contactors & Relays", slug: "contactors-relays", icon: "Layers", itemCount: 45 },
      { id: "circuit-breakers", name: "Molded Case Circuit Breakers", slug: "circuit-breakers", icon: "Shield", itemCount: 31 },
      { id: "vfd-inverters", name: "Variable Frequency Drives (VFD)", slug: "vfd-inverters", icon: "Radio", itemCount: 18 },
      { id: "terminal-blocks", name: "Terminal Blocks & Connectors", slug: "terminal-blocks", icon: "Package", itemCount: 52 }
    ]
  },
  {
    id: "industrial-boiler",
    name: "Industrial Boiler",
    slug: "industrial-boiler",
    icon: "Sparkles",
    subCategories: [
      { id: "u-shape-heaters", name: "U-Shaped Heating Elements", slug: "u-shape-heaters", icon: "Sparkles", itemCount: 36 },
      { id: "flanged-immersion", name: "Flanged Immersion Heaters", slug: "flanged-immersion", icon: "Sparkles", itemCount: 24 },
      { id: "thermostats-gauges", name: "Boiler Pressure Gauges", slug: "boiler-pressure-gauges", icon: "Shield", itemCount: 15 },
      { id: "spring-molded-heaters", name: "Runner Spring Coil Heaters", slug: "spring-coil-heaters", icon: "Package", itemCount: 20 }
    ]
  },
  {
    id: "industrial-automation",
    name: "Industrial Automation",
    slug: "industrial-automation",
    icon: "Gamepad2",
    subCategories: [
      { id: "plcs-hmis", name: "PLCs & Touch Screen HMIs", slug: "plcs-hmis", icon: "Gamepad2", itemCount: 17 },
      { id: "stepper-servo-motors", name: "Stepper & Servo Motors", slug: "stepper-servo-motors", icon: "Car", itemCount: 29 },
      { id: "limit-switches", name: "Micro Roller Lever Limit Switches", slug: "limit-switches", icon: "Radio", itemCount: 41 },
      { id: "encoders-counters", name: "Rotary Encoders & Counters", slug: "rotary-encoders", icon: "Layers", itemCount: 14 }
    ]
  },
  {
    id: "household-electrical",
    name: "Household Electrical",
    slug: "household-electrical",
    icon: "Armchair",
    subCategories: [
      { id: "switches-sockets", name: "Modern Wall Switches & Sockets", slug: "switches-sockets", icon: "Armchair", itemCount: 62 },
      { id: "led-lighting", name: "Energy-Saving LED Fixtures", slug: "led-lighting", icon: "Sparkles", itemCount: 48 },
      { id: "cables-wires", name: "Heatproof Silicone Insulated Wires", slug: "cables-wires", icon: "Layers", itemCount: 37 }
    ]
  },
  {
    id: "industrial-machinery",
    name: "Industrial Machinery",
    slug: "industrial-machinery",
    icon: "Package",
    subCategories: [
      { id: "pneumatics", name: "Pneumatic Air Cylinders", slug: "pneumatic-cylinders", icon: "Package", itemCount: 26 },
      { id: "solenoid-valves", name: "High Pressure Solenoid Valves", slug: "solenoid-valves", icon: "Shield", itemCount: 33 },
      { id: "bearings", name: "Precision Industrial Bearings", slug: "industrial-bearings", icon: "Car", itemCount: 50 }
    ]
  },
  {
    id: "tools-hardware",
    name: "Tools & Hardware",
    slug: "tools-hardware",
    icon: "Shield",
    subCategories: [
      { id: "crimping-tools", name: "Terminal Wire Crimping Pliers", slug: "crimping-pliers", icon: "Shield", itemCount: 21 },
      { id: "multimeters", name: "Digital Clamp Multimeters", slug: "digital-multimeters", icon: "Radio", itemCount: 19 },
      { id: "soldering-stations", name: "Adjustable Soldering Stations", slug: "soldering-stations", icon: "Sparkles", itemCount: 16 }
    ]
  },
  {
    id: "ride-on-vehicle",
    name: "Ride-On & Vehicle Toys",
    slug: "ride-on-vehicle-toys",
    icon: "Car",
    subCategories: [
      { id: "electric-cars", name: "Electric Cars", slug: "electric-cars", icon: "Car", itemCount: 42 },
      { id: "electric-bikes", name: "Electric Bikes", slug: "electric-bikes", icon: "Bike", itemCount: 28 },
      { id: "tricycles", name: "Tricycles & Swing Cars", slug: "tricycles-swing-cars", icon: "Bike", itemCount: 35 },
      { id: "scooters", name: "Kids Scooters", slug: "kids-scooters", icon: "SunMedium", itemCount: 19 },
      { id: "rc-vehicles", name: "R/C High Speed Cars", slug: "rc-high-speed-cars", icon: "Radio", itemCount: 53 },
      { id: "pedal-go-karts", name: "Pedal Go-Karts", slug: "pedal-go-karts", icon: "Car", itemCount: 14 }
    ]
  },
  {
    id: "mother-baby",
    name: "Mother & Baby Essentials",
    slug: "mother-baby-essentials",
    icon: "Baby",
    subCategories: [
      { id: "potty-seats", name: "Potty Seats", slug: "potty-seats", icon: "Armchair" },
      { id: "baby-carriers", name: "Baby Carriers & Slings", slug: "baby-carriers-slings", icon: "HeartHandshake" },
      { id: "baby-high-chairs", name: "Baby High Chairs", slug: "baby-high-chairs", icon: "Armchair" },
      { id: "baby-skincare", name: "Baby skin care", slug: "baby-skin-care", icon: "Sparkles" },
      { id: "baby-strollers", name: "Baby Strollers", slug: "baby-strollers", icon: "Baby" },
      { id: "baby-walkers", name: "Baby Walkers", slug: "baby-walkers", icon: "Bike" },
      { id: "diapers", name: "Diapers", slug: "diapers", icon: "Package" },
      { id: "feeding", name: "Feeding", slug: "feeding", icon: "Milk" },
      { id: "baby-safety", name: "Baby safety products", slug: "baby-safety-products", icon: "Shield" },
      { id: "baby-care-item", name: "Baby Care Item", slug: "baby-care-item", icon: "Smile" },
      { id: "tooth-brush", name: "Tooth brush", slug: "tooth-brush", icon: "Sparkles" }
    ]
  },
  {
    id: "pretend-role-play",
    name: "Pretend & Role Play",
    slug: "pretend-role-play",
    icon: "Gamepad2",
    subCategories: [
      { id: "toy-appliances", name: "Toy Home Appliances", slug: "toy-home-appliances", icon: "Package" },
      { id: "beauty-makeup", name: "Beauty & Makeup Kits", slug: "beauty-makeup-kits", icon: "Sparkles" },
      { id: "doctor-sets", name: "Doctor Sets", slug: "doctor-sets", icon: "Shield" },
      { id: "dollhouses", name: "Dollhouses (e.g., Barbie House)", slug: "dollhouses", icon: "Armchair" },
      { id: "dress-up", name: "Dress-Up & Costumes", slug: "dress-up-costumes", icon: "Smile" },
      { id: "kitchen-sets", name: "Kitchen Sets", slug: "kitchen-sets", icon: "Package" },
      { id: "play-food", name: "Play Food & Grocery", slug: "play-food-grocery", icon: "Milk" },
      { id: "play-mats", name: "Mats & Activity Rugs", slug: "mats-activity-rugs", icon: "Layers" },
      { id: "train-sets", name: "Train Sets & Tracks", slug: "train-sets-tracks", icon: "Car" }
    ]
  },
  {
    id: "baby-formula-foods",
    name: "Baby Formula Milk & Foods",
    slug: "baby-formula-foods",
    icon: "Milk",
    subCategories: [
      { id: "formula-stage1", name: "Stage 1 Infant Milk", slug: "stage-1-infant-milk", icon: "Milk" },
      { id: "formula-stage2", name: "Stage 2 Follow-on Milk", slug: "stage-2-follow-on-milk", icon: "Milk" },
      { id: "organic-purees", name: "Organic Baby Purees", slug: "organic-baby-purees", icon: "Package" },
      { id: "cereals-biscuits", name: "Cereals & Teething Biscuits", slug: "cereals-biscuits", icon: "Package" },
      { id: "nutritional-drinks", name: "Nutritional Health Drinks", slug: "nutritional-health-drinks", icon: "Milk" }
    ]
  },
  {
    id: "special-categories",
    name: "Special Categories",
    slug: "special-categories",
    icon: "Sparkles",
    isSpecial: true,
    subCategories: [
      { id: "mega-deals", name: "Flash Mega Deals", slug: "flash-mega-deals", icon: "Sparkles" },
      { id: "best-sellers", name: "Best Sellers of 2026", slug: "best-sellers", icon: "Shield" },
      { id: "birthday-gifts", name: "Birthday Gift Hampers", slug: "birthday-gift-hampers", icon: "Package" },
      { id: "combo-packs", name: "Value Combo Packs", slug: "value-combo-packs", icon: "Layers" },
      { id: "clearance", name: "Clearance Sale (Up to 50%)", slug: "clearance-sale", icon: "Sparkles" }
    ]
  },
  {
    id: "outdoor-physical",
    name: "Outdoor & Physical Play",
    slug: "outdoor-physical-play",
    icon: "SunMedium",
    subCategories: [
      { id: "trampolines", name: "Kids Trampolines", slug: "kids-trampolines", icon: "SunMedium" },
      { id: "slides-swings", name: "Outdoor Slides & Swings", slug: "outdoor-slides-swings", icon: "Bike" },
      { id: "sports-games", name: "Basketball & Football Sets", slug: "sports-games-sets", icon: "Shield" },
      { id: "water-sand", name: "Water Guns & Sand Tables", slug: "water-guns-sand-tables", icon: "Sparkles" },
      { id: "playhouses-tents", name: "Tents & Tunnel Houses", slug: "tents-tunnel-houses", icon: "Armchair" }
    ]
  },
  {
    id: "shop-by-age",
    name: "Shop by Age",
    slug: "shop-by-age",
    icon: "Calendar",
    subCategories: [
      { id: "age-0-12m", name: "0 - 12 Months (Infants)", slug: "age-0-12m", icon: "Baby" },
      { id: "age-1-2y", name: "1 - 2 Years (Toddlers)", slug: "age-1-2y", icon: "Baby" },
      { id: "age-3-5y", name: "3 - 5 Years (Preschoolers)", slug: "age-3-5y", icon: "Smile" },
      { id: "age-6-8y", name: "6 - 8 Years (Early School)", slug: "age-6-8y", icon: "GraduationCap" },
      { id: "age-9plus", name: "9+ Years (Big Kids & Teens)", slug: "age-9plus", icon: "Gamepad2" }
    ]
  },
  {
    id: "educational-learning",
    name: "Educational & Learning Toys",
    slug: "educational-learning-toys",
    icon: "GraduationCap",
    subCategories: [
      { id: "learning-boards", name: "Learning Boards", slug: "learning-boards", icon: "Layers" },
      { id: "montessori-toys", name: "Montessori Toys", slug: "montessori-toys", icon: "GraduationCap" },
      { id: "stem-science-kits", name: "STEM & Science Kits", slug: "stem-science-kits", icon: "Sparkles" },
      { id: "toy", name: "Toy", slug: "toy-general", icon: "Package" },
      { id: "activity-workbook-sets", name: "Activity & Workbook Sets", slug: "activity-workbook-sets", icon: "GraduationCap" },
      { id: "alphabet-number-sets", name: "Alphabet & Number Sets", slug: "alphabet-number-sets", icon: "Smile" },
      { id: "baby-table", name: "baby Table", slug: "baby-table", icon: "Armchair" }
    ]
  }
];

export interface TopCategoryItem {
  id: string;
  name: string;
  slug: string;
  image: string;
  iconName: string;
  bgColor?: string;
}

export const TOP_CATEGORIES: TopCategoryItem[] = [
  {
    id: "strollers",
    name: "Baby Strollers",
    slug: "baby-strollers",
    image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=300&auto=format&fit=crop&q=80",
    iconName: "Baby"
  },
  {
    id: "special-remote",
    name: "Special & Remote Cars",
    slug: "rc-high-speed-cars",
    image: "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?w=300&auto=format&fit=crop&q=80",
    iconName: "Radio"
  },
  {
    id: "baby-formula",
    name: "Baby Formula Milk & Food",
    slug: "baby-formula-foods",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80",
    iconName: "Milk"
  },
  {
    id: "tricycle-swing",
    name: "Tricycle & swing car",
    slug: "tricycles-swing-cars",
    image: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300&auto=format&fit=crop&q=80",
    iconName: "Bike"
  },
  {
    id: "baby-swings",
    name: "Baby Swings & Bouncers",
    slug: "baby-swings-rockers",
    image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300&auto=format&fit=crop&q=80",
    iconName: "Armchair"
  },
  {
    id: "musical-instruments",
    name: "Musical Instruments",
    slug: "musical-instruments",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
    iconName: "Music"
  },
  {
    id: "rc-cars",
    name: "R/C Cars",
    slug: "rc-high-speed-cars",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&auto=format&fit=crop&q=80",
    iconName: "Car"
  },
  {
    id: "action-adventure",
    name: "Action & Adventure Toys",
    slug: "action-figures",
    image: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=300&auto=format&fit=crop&q=80",
    iconName: "Shield"
  },
  {
    id: "soft-plush",
    name: "Soft & Plush Toys",
    slug: "soft-plush-toys",
    image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=300&auto=format&fit=crop&q=80",
    iconName: "HeartHandshake"
  },
  {
    id: "teethers-rattles",
    name: "Teethers & Rattles",
    slug: "teethers-rattles",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300&auto=format&fit=crop&q=80",
    iconName: "Smile"
  },
  {
    id: "baby-bike",
    name: "Baby Bike",
    slug: "electric-bikes",
    image: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=300&auto=format&fit=crop&q=80",
    iconName: "Bike"
  }
];
