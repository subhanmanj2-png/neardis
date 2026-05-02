/* ============================================================
   NEARDIS — Deals Data
   Add real deals here. Structure shown below.
   ============================================================ */

// Each deal object structure:
// {
//   id: Number,          // unique ID
//   shop: String,        // business name
//   emoji: String,       // emoji representing the deal
//   cat: String,         // food | fashion | electronics | beauty | sports | home
//   title: String,       // deal headline
//   disc: Number,        // discount percentage (e.g. 40)
//   dist: Number,        // distance in km from user (e.g. 0.4)
//   expiry: Number,      // seconds until deal expires (e.g. 7200 = 2 hours)
//   flash: Boolean,      // is it a flash deal?
//   rating: Number,      // 0.0 – 5.0
//   worthit: Number,     // community rating 0–100
//   sightings: Number,   // user confirmations
//   desc: String,        // full description
//   lat: Number,         // % from top for map pin (0-90)
//   lng: Number,         // % from left for map pin (0-90)
//   saved: Boolean,      // default saved state
//   orig: Number,        // original price
//   price: Number,       // deal price
// }

// Example entries (replace with real data):
const DEALS_DATA = [
  {
    id: 1, shop: "Sample Café", emoji: "?", cat: "food",
    title: "30% off all hot drinks", disc: 30, dist: 0.2,
    expiry: 7200, flash: true, rating: 4.5, worthit: 88,
    sightings: 7, desc: "All espresso-based drinks and filter coffee at 30% off. Valid during breakfast hours, dine-in only.",
    lat: 36, lng: 18, saved: false, orig: 500, price: 350
  },
  {
    id: 2, shop: "Sample Electronics", emoji: "??", cat: "electronics",
    title: "Phone accessories bundle deal", disc: 50, dist: 0.5,
    expiry: 28800, flash: false, rating: 4.2, worthit: 80,
    sightings: 3, desc: "Bundle any 2 accessories and get 50% off total. Includes cases, chargers, and earphones.",
    lat: 22, lng: 55, saved: false, orig: 3000, price: 1500
  }
];

// Push all to global Deals array
DEALS_DATA.forEach(d => {
  if (!Deals.find(x => x.id === d.id)) Deals.push(d);
});