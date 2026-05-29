require('dotenv').config();
const sequelize = require('./config/database');

require('./models/WardrobeItem.model');
require('./models/CalendarEvent.model');

const WardrobeItem = require('./models/WardrobeItem.model');
const CalendarEvent = require('./models/CalendarEvent.model');

// ── Helpers ───────────────────────────────────────────────────────────────────
function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // DATEONLY: "YYYY-MM-DD"
}

// ── Wardrobe ──────────────────────────────────────────────────────────────────
const WARDROBE = [
  // Tops
  { name: 'White Oxford Shirt',     category: 'tops',       color: 'white',      tags: ['formal', 'business'], wornCount: 8,  wornSinceWash: 2 },
  { name: 'Navy Crew-Neck Tee',     category: 'tops',       color: 'navy',       tags: ['casual', 'summer'],   wornCount: 14, wornSinceWash: 1 },
  { name: 'Grey Henley',            category: 'tops',       color: 'grey',       tags: ['casual', 'spring'],   wornCount: 6,  wornSinceWash: 0 },
  { name: 'Black Turtleneck',       category: 'tops',       color: 'black',      tags: ['formal', 'winter'],   wornCount: 5,  wornSinceWash: 0 },
  { name: 'Olive Linen Shirt',      category: 'tops',       color: 'olive',      tags: ['casual', 'summer'],   wornCount: 3,  wornSinceWash: 1 },
  { name: 'Burgundy Flannel Shirt', category: 'tops',       color: 'burgundy',   tags: ['casual', 'fall'],     wornCount: 4,  wornSinceWash: 2 },
  { name: 'White Polo Shirt',       category: 'tops',       color: 'white',      tags: ['sport', 'casual'],    wornCount: 7,  wornSinceWash: 0 },

  // Bottoms
  { name: 'Dark Wash Slim Jeans',   category: 'bottoms',    color: 'dark blue',  tags: ['casual', 'fall'],     wornCount: 20, wornSinceWash: 3 },
  { name: 'Navy Chinos',            category: 'bottoms',    color: 'navy',       tags: ['business', 'spring'], wornCount: 12, wornSinceWash: 1 },
  { name: 'Charcoal Dress Trousers',category: 'bottoms',    color: 'charcoal',   tags: ['formal', 'business'], wornCount: 6,  wornSinceWash: 0 },
  { name: 'Khaki Shorts',           category: 'bottoms',    color: 'khaki',      tags: ['casual', 'summer'],   wornCount: 9,  wornSinceWash: 2 },
  { name: 'Black Skinny Jeans',     category: 'bottoms',    color: 'black',      tags: ['casual', 'party'],    wornCount: 11, wornSinceWash: 1 },
  { name: 'Grey Sweatpants',        category: 'bottoms',    color: 'grey',       tags: ['sport', 'casual'],    wornCount: 8,  wornSinceWash: 2 },

  // Outerwear
  { name: 'Charcoal Wool Overcoat', category: 'outerwear',  color: 'charcoal',   tags: ['formal', 'winter'],   wornCount: 10, wornSinceWash: 0 },
  { name: 'Olive Bomber Jacket',    category: 'outerwear',  color: 'olive',      tags: ['casual', 'fall'],     wornCount: 7,  wornSinceWash: 0 },
  { name: 'Navy Puffer Jacket',     category: 'outerwear',  color: 'navy',       tags: ['casual', 'winter'],   wornCount: 5,  wornSinceWash: 0 },
  { name: 'Tan Trench Coat',        category: 'outerwear',  color: 'tan',        tags: ['formal', 'spring'],   wornCount: 4,  wornSinceWash: 0 },
  { name: 'Grey Zip Hoodie',        category: 'outerwear',  color: 'grey',       tags: ['casual', 'sport'],    wornCount: 13, wornSinceWash: 1 },

  // Shoes
  { name: 'White Canvas Sneakers',  category: 'shoes',      color: 'white',      tags: ['casual', 'summer'],   wornCount: 22, wornSinceWash: 0 },
  { name: 'Brown Leather Derby',    category: 'shoes',      color: 'brown',      tags: ['formal', 'business'], wornCount: 9,  wornSinceWash: 0 },
  { name: 'Black Oxford Shoes',     category: 'shoes',      color: 'black',      tags: ['formal', 'business'], wornCount: 6,  wornSinceWash: 0 },
  { name: 'Grey Running Shoes',     category: 'shoes',      color: 'grey',       tags: ['sport', 'outdoor'],   wornCount: 18, wornSinceWash: 0 },
  { name: 'Tan Chelsea Boots',      category: 'shoes',      color: 'tan',        tags: ['casual', 'fall'],     wornCount: 8,  wornSinceWash: 0 },

  // Accessories
  { name: 'Brown Leather Belt',     category: 'accessories', color: 'brown',     tags: ['formal', 'casual'],   wornCount: 30, wornSinceWash: 0 },
  { name: 'Navy Knit Tie',          category: 'accessories', color: 'navy',      tags: ['formal', 'business'], wornCount: 4,  wornSinceWash: 0 },
  { name: 'Silver Watch',           category: 'accessories', color: 'silver',    tags: ['formal', 'casual'],   wornCount: 40, wornSinceWash: 0 },
  { name: 'Black Baseball Cap',     category: 'accessories', color: 'black',     tags: ['casual', 'sport'],    wornCount: 15, wornSinceWash: 1 },
  { name: 'Camel Wool Scarf',       category: 'accessories', color: 'camel',     tags: ['casual', 'winter'],   wornCount: 6,  wornSinceWash: 0 },

  // Dresses (versatile wardrobe)
  { name: 'Black Midi Dress',       category: 'dresses',    color: 'black',      tags: ['formal', 'party'],    wornCount: 3,  wornSinceWash: 0 },
  { name: 'Floral Wrap Dress',      category: 'dresses',    color: 'multicolor', tags: ['casual', 'summer'],   wornCount: 2,  wornSinceWash: 1 },
];

// ── Calendar events ───────────────────────────────────────────────────────────
const EVENTS = [
  // This week
  { title: 'Team standup',        date: dateOffset(0),  eventType: 'work'    },
  { title: 'Client presentation', date: dateOffset(1),  eventType: 'work'    },
  { title: 'Gym session',         date: dateOffset(1),  eventType: 'casual'  },
  { title: 'Lunch with Alex',     date: dateOffset(2),  eventType: 'casual'  },
  { title: 'Product review',      date: dateOffset(2),  eventType: 'work'    },
  { title: 'Evening run',         date: dateOffset(3),  eventType: 'outdoor' },
  { title: 'Dinner date',         date: dateOffset(3),  eventType: 'formal'  },
  { title: 'Coffee with mentor',  date: dateOffset(4),  eventType: 'casual'  },
  { title: 'Board meeting',       date: dateOffset(4),  eventType: 'work'    },
  { title: 'Friday drinks',       date: dateOffset(4),  eventType: 'party'   },

  // Weekend
  { title: 'Farmers market',      date: dateOffset(5),  eventType: 'casual'  },
  { title: 'Hiking trip',         date: dateOffset(6),  eventType: 'outdoor' },

  // Next week
  { title: 'Monday all-hands',    date: dateOffset(7),  eventType: 'work'    },
  { title: 'Yoga class',          date: dateOffset(7),  eventType: 'casual'  },
  { title: 'Design workshop',     date: dateOffset(8),  eventType: 'work'    },
  { title: "Sam's birthday party",date: dateOffset(9),  eventType: 'party'   },
  { title: 'Job interview',       date: dateOffset(10), eventType: 'formal'  },
  { title: 'Park picnic',         date: dateOffset(11), eventType: 'casual'  },
  { title: 'Wedding reception',   date: dateOffset(12), eventType: 'formal'  },
  { title: 'Morning run',         date: dateOffset(13), eventType: 'outdoor' },
];

// ── Run ───────────────────────────────────────────────────────────────────────
async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });

  const [wCount, eCount] = await Promise.all([
    WardrobeItem.count(),
    CalendarEvent.count(),
  ]);

  if (wCount > 0 || eCount > 0) {
    console.log(`DB already has ${wCount} wardrobe items and ${eCount} events.`);
    console.log('To reseed, clear the tables first:');
    console.log('  DELETE FROM wardrobe_items; DELETE FROM calendar_events;');
    process.exit(0);
  }

  await WardrobeItem.bulkCreate(WARDROBE);
  await CalendarEvent.bulkCreate(EVENTS);

  console.log(`✓ Seeded ${WARDROBE.length} wardrobe items`);
  console.log(`✓ Seeded ${EVENTS.length} calendar events`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
