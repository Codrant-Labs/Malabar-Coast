export type MenuCategory =
  | "small-plates"
  | "seafood"
  | "curries"
  | "biriyani"
  | "vegetarian"
  | "breads-rice"
  | "desserts"
  | "drinks"
  | "children";

export type MenuItem = {
  id: string;
  category: MenuCategory;
  name: string;
  description: string;
  pricePence: number;
  dietary: string[];
  allergens: string[];
  spice: "Gentle" | "Warm" | "Medium" | "Hot" | "Aromatic" | "None";
  available: boolean;
};

export const categoryDetails: Record<MenuCategory, { number: string; title: string; note: string }> = {
  "small-plates": { number: "I", title: "Before departure", note: "Small plates" },
  seafood: { number: "II", title: "From the water", note: "Coastal catch" },
  curries: { number: "III", title: "From the fire", note: "Curries & grills" },
  biriyani: { number: "IV", title: "The dum pot", note: "Biriyani" },
  vegetarian: { number: "V", title: "Garden & grove", note: "Vegetarian" },
  "breads-rice": { number: "VI", title: "Alongside", note: "Rice & breads" },
  desserts: { number: "VII", title: "After landfall", note: "Something sweet" },
  drinks: { number: "VIII", title: "To drink", note: "Coolers & tea" },
  children: { number: "IX", title: "Little sailors", note: "Children" },
};

export const menuItems: MenuItem[] = [
  { id: "malabar-beef-cutlet", category: "small-plates", name: "Malabar beef cutlet", description: "Beetroot pachadi · curry leaf", pricePence: 850, dietary: [], allergens: ["dairy", "gluten"], spice: "Warm", available: true },
  { id: "kallummakkaya", category: "small-plates", name: "Kallummakkaya", description: "Mussels · shallot · roasted coconut", pricePence: 1150, dietary: ["GF", "DF"], allergens: ["molluscs"], spice: "Medium", available: true },
  { id: "pepper-tiger-prawns", category: "small-plates", name: "Black pepper tiger prawns", description: "Tellicherry pepper · curry leaf · charred lime", pricePence: 1295, dietary: ["GF", "DF"], allergens: ["crustaceans"], spice: "Warm", available: true },
  { id: "cauliflower-65", category: "small-plates", name: "Cauliflower 65", description: "Fennel · chilli · coconut yoghurt", pricePence: 825, dietary: ["V"], allergens: ["dairy"], spice: "Medium", available: true },
  { id: "chicken-sukka", category: "small-plates", name: "Chicken sukka", description: "Dry coconut · coriander · black pepper", pricePence: 925, dietary: ["GF", "DF"], allergens: [], spice: "Medium", available: true },

  { id: "haddock-moilee", category: "seafood", name: "Highland haddock moilee", description: "Golden coconut · charred leek · mustard seed", pricePence: 1950, dietary: ["GF"], allergens: ["fish", "mustard"], spice: "Gentle", available: true },
  { id: "charred-sea-bass", category: "seafood", name: "Coconut charred sea bass", description: "Tamarind glaze · green chilli · cassava crisp", pricePence: 1850, dietary: ["GF", "DF"], allergens: ["fish"], spice: "Medium", available: true },
  { id: "peri-peri-lobster", category: "seafood", name: "Peri-peri lobster", description: "Fermented chilli butter · coconut · fragrant rice", pricePence: 2700, dietary: ["GF"], allergens: ["crustaceans", "dairy"], spice: "Hot", available: true },
  { id: "meen-pollichathu", category: "seafood", name: "Meen pollichathu", description: "Banana-leaf fish · shallot · kokum", pricePence: 2150, dietary: ["GF", "DF"], allergens: ["fish"], spice: "Medium", available: true },

  { id: "nadan-chicken", category: "curries", name: "Nadan chicken curry", description: "Black pepper · tomato · shallot", pricePence: 1750, dietary: ["GF", "DF"], allergens: [], spice: "Medium", available: true },
  { id: "cape-malay-lamb", category: "curries", name: "Cape Malay lamb curry", description: "Cardamom · apricot · crisp onion", pricePence: 1995, dietary: ["DF"], allergens: [], spice: "Medium", available: true },
  { id: "beef-ularthiyathu", category: "curries", name: "Beef ularthiyathu", description: "Roasted coconut · curry leaf · pepper", pricePence: 1895, dietary: ["GF", "DF"], allergens: [], spice: "Hot", available: true },
  { id: "chicken-chettinad", category: "curries", name: "Chicken Chettinad", description: "Fennel · kalpasi · toasted chilli", pricePence: 1795, dietary: ["GF", "DF"], allergens: [], spice: "Hot", available: true },

  { id: "lamb-biriyani", category: "biriyani", name: "Thalassery lamb biriyani", description: "Kaima rice · cashew · fried onion", pricePence: 1995, dietary: ["GF"], allergens: ["nuts", "dairy"], spice: "Medium", available: true },
  { id: "chicken-biriyani", category: "biriyani", name: "Malabar chicken biriyani", description: "Kaima rice · mint · saffron", pricePence: 1795, dietary: ["GF"], allergens: ["dairy"], spice: "Medium", available: true },
  { id: "vegetable-biriyani", category: "biriyani", name: "Garden vegetable biriyani", description: "Kaima rice · beans · cashew · mint", pricePence: 1595, dietary: ["V", "GF"], allergens: ["nuts", "dairy"], spice: "Warm", available: true },

  { id: "jackfruit-ishtu", category: "vegetarian", name: "Jackfruit ishtu", description: "Green chilli · coconut milk · ginger", pricePence: 1550, dietary: ["VG", "GF", "DF"], allergens: [], spice: "Gentle", available: true },
  { id: "mushroom-mappas", category: "vegetarian", name: "Wild mushroom mappas", description: "Coconut · tomato · fennel", pricePence: 1595, dietary: ["VG", "GF", "DF"], allergens: [], spice: "Warm", available: true },
  { id: "kerala-dal", category: "vegetarian", name: "Kerala parippu", description: "Moong dal · coconut · cumin", pricePence: 1450, dietary: ["VG", "GF", "DF"], allergens: [], spice: "Gentle", available: true },
  { id: "paneer-pepper-fry", category: "vegetarian", name: "Paneer pepper fry", description: "Peppers · shallot · Tellicherry pepper", pricePence: 1650, dietary: ["V", "GF"], allergens: ["dairy"], spice: "Medium", available: true },

  { id: "malabar-parotta", category: "breads-rice", name: "Malabar parotta", description: "Flaky layered bread", pricePence: 395, dietary: ["V"], allergens: ["gluten", "dairy"], spice: "None", available: true },
  { id: "appam", category: "breads-rice", name: "Appam", description: "Fermented rice & coconut", pricePence: 375, dietary: ["VG", "GF", "DF"], allergens: [], spice: "None", available: true },
  { id: "coconut-rice", category: "breads-rice", name: "Coconut rice", description: "Mustard seed · curry leaf", pricePence: 425, dietary: ["VG", "GF", "DF"], allergens: ["mustard"], spice: "Gentle", available: true },
  { id: "kaima-rice", category: "breads-rice", name: "Steamed kaima rice", description: "Short-grain aromatic rice", pricePence: 350, dietary: ["VG", "GF", "DF"], allergens: [], spice: "None", available: true },
  { id: "seasonal-thoran", category: "breads-rice", name: "Seasonal thoran", description: "Coconut · cumin · green chilli", pricePence: 450, dietary: ["VG", "GF", "DF"], allergens: [], spice: "Warm", available: true },

  { id: "cardamom-nata", category: "desserts", name: "Cardamom pastel de nata", description: "Cashew · black pepper caramel", pricePence: 750, dietary: ["V"], allergens: ["gluten", "dairy", "egg", "nuts"], spice: "Aromatic", available: true },
  { id: "unnakkaya", category: "desserts", name: "Unnakkaya", description: "Banana · coconut · raisin", pricePence: 725, dietary: ["V", "GF"], allergens: ["dairy"], spice: "None", available: true },
  { id: "coconut-pudding", category: "desserts", name: "Tender coconut pudding", description: "Jaggery · lime leaf", pricePence: 695, dietary: ["VG", "GF", "DF"], allergens: [], spice: "None", available: true },
  { id: "payasam", category: "desserts", name: "Ada pradhaman", description: "Rice ada · jaggery · coconut", pricePence: 675, dietary: ["VG", "GF", "DF"], allergens: [], spice: "None", available: true },

  { id: "sulaimani", category: "drinks", name: "Sulaimani", description: "Black tea · mint · lemon", pricePence: 350, dietary: ["VG", "GF", "DF"], allergens: [], spice: "None", available: true },
  { id: "mango-lassi", category: "drinks", name: "Mango lassi", description: "Alphonso mango · yoghurt · cardamom", pricePence: 495, dietary: ["V", "GF"], allergens: ["dairy"], spice: "None", available: true },
  { id: "nannari-soda", category: "drinks", name: "Nannari soda", description: "Sarsaparilla · lime · sparkling water", pricePence: 450, dietary: ["VG", "GF", "DF"], allergens: [], spice: "None", available: true },
  { id: "ginger-lime", category: "drinks", name: "Ginger lime cooler", description: "Fresh ginger · lime · soda", pricePence: 450, dietary: ["VG", "GF", "DF"], allergens: [], spice: "None", available: true },

  { id: "kids-chicken", category: "children", name: "Little chicken curry", description: "Gentle coconut sauce · rice", pricePence: 795, dietary: ["GF"], allergens: [], spice: "Gentle", available: true },
  { id: "kids-fish", category: "children", name: "Crisp haddock bites", description: "Rice · cucumber · yoghurt", pricePence: 825, dietary: [], allergens: ["fish", "gluten", "dairy"], spice: "None", available: true },
  { id: "kids-dal", category: "children", name: "Little dal & rice", description: "Moong dal · coconut · vegetables", pricePence: 695, dietary: ["VG", "GF", "DF"], allergens: [], spice: "Gentle", available: true },
];

export function getMenuItem(id: string) {
  return menuItems.find((item) => item.id === id);
}

export function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);
}
