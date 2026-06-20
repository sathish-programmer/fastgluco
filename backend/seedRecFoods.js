require('dotenv').config();
const mongoose = require('mongoose');

const RecommendedFoodSchema = new mongoose.Schema({
  category: { type: String, required: true },
  productName: { type: String, required: true },
  image: { type: String },
  nutritionDetails: { type: String },
  ingredients: { type: String },
  pesticideInfo: { type: String },
  certifications: { type: String },
  doctorNotes: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

const RecommendedFood = mongoose.models.RecommendedFood || mongoose.model('RecommendedFood', RecommendedFoodSchema);

async function seed() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/fastgluco';
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    const seedData = [
      {
        category: 'Millet/Grains',
        productName: 'Organic Foxtail Millet Packet (500g)',
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?q=80&w=400&auto=format&fit=crop',
        nutritionDetails: 'Calories: 331 kcal, Carbs: 60g, Protein: 12g, Fiber: 8g (per 100g)',
        ingredients: '100% Unpolished Foxtail Millet',
        pesticideInfo: 'Grown without synthetic pesticides. Verified via gas chromatography testing.',
        certifications: 'USDA Organic, India Organic (NPOP)',
        doctorNotes: 'Excellent low-GI alternative to white rice. Helps maintain steady blood glucose spikes.',
        status: 'active'
      },
      {
        category: 'Millet/Grains',
        productName: 'Pearl Millet (Bajra) Flour - Stone Ground',
        image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=400&auto=format&fit=crop',
        nutritionDetails: 'Calories: 361 kcal, Carbs: 67g, Protein: 11g, Fiber: 11g (per 100g)',
        ingredients: 'Whole Pearl Millet Grains',
        pesticideInfo: 'Sourced from natural dryland farms avoiding chemical sprays.',
        certifications: 'FSSAI Certified, Non-GMO',
        doctorNotes: 'Highly recommended for winter months and making traditional rotis. Very dense in fiber.',
        status: 'active'
      },
      {
        category: 'Organic Products',
        productName: 'Pure A2 Gir Cow Ghee (500ml)',
        image: 'https://images.unsplash.com/photo-1627056086884-60bc6e2cefc2?q=80&w=400&auto=format&fit=crop',
        nutritionDetails: 'Calories: 898 kcal, Fat: 99.8g (per 100g)',
        ingredients: 'A2 Milk fat from grass-fed Gir Cows',
        pesticideInfo: 'Cows grass-fed on pastures with zero pesticide application.',
        certifications: 'A2 Certified, Organic Pasture',
        doctorNotes: 'Great healthy fat to add to meals. Slows down digestion and carbohydrate absorption.',
        status: 'active'
      }
    ];

    await RecommendedFood.insertMany(seedData);
    console.log('Successfully seeded recommended foods!');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Seed error:', error);
    mongoose.connection.close();
  }
}

seed();
