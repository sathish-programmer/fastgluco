require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    specialty: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    avatar: { type: String },
    qualification: { type: String },
    experience: { type: Number },
    hospitalName: { type: String },
    registrationNumber: { type: String },
    consultationFee: { type: Number },
    onlineConsultationFee: { type: Number, default: 0 },
    offlineConsultationFee: { type: Number, default: 0 },
    extraFeePer15Min: { type: Number, default: 0 },
    feePolicy: { type: String, default: "" },
    sleepEvaluationNote: { type: String, default: "" },
    phone: { type: String },
    address: { type: String },
    languagesKnown: { type: [String], default: [] },
    workingHours: { type: String, default: "09:00 - 17:00" },
    availableDays: { type: [String], default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    slotDuration: { type: Number, default: 30 },
    holidays: { type: [String], default: [] },
    visibility: { type: Boolean, default: true },
    notificationPreferences: { type: String, default: "{}" },
    deaddictionHelpline: { type: String, default: "1800-11-0031" },
    commissionType: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
    commissionValue: { type: Number, default: 10 }
  },
  { timestamps: true }
);

const DoctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, unique: true },
    availableDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    availableTimeSlots: [
      {
        start: { type: String, required: true },
        end: { type: String, required: true }
      }
    ],
    holidays: { type: [Date], default: [] },
    leaves: { type: [Date], default: [] },
    slotDuration: { type: Number, default: 30 },
    maxAppointmentsPerSlot: { type: Number, default: 1 }
  },
  { timestamps: true }
);

const Doctor = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
const DoctorAvailability = mongoose.models.DoctorAvailability || mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);

const AppointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }
}, { strict: false });
const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

async function seedDoctors() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/fastgluco';
    console.log(`Connecting to MongoDB: ${mongoUri.replace(/:([^:@]{3,})@/, ':***@')}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    const defaultPasswordHash = await bcrypt.hash('Doctor@123', 10);

    const doctorsData = [
      {
        name: 'Dr Krishnaveni Renganathan',
        email: 'dr.krishnaveni@fastgluco.com',
        passwordHash: defaultPasswordHash,
        avatar: '/uploads/dr_krishnaveni_renganathan.jpg',
        specialty: 'Consultant pulmonologist , allergy and sleep specialist',
        qualification: 'MBBS, MD,DNB(Respiratory Medicine ) , DAA (CMC vellore ), Fellowship in sleep medicine (St John’s medical college , blore )',
        experience: 13,
        slotDuration: 30,
        consultationFee: 750,
        onlineConsultationFee: 750,
        offlineConsultationFee: 750,
        extraFeePer15Min: 100,
        feePolicy: 'extra 100/- every 15 mins , if consultation exceeds 30mins',
        sleepEvaluationNote: 'Sleep evaluation helps detect treatable sleep disorders, improving recovery, immunity, energy, and overall quality of life',
        description: 'Consultant pulmonologist, allergy and sleep specialist with 13 years experience.',
        languagesKnown: ['English', 'Tamil', 'Kannada', 'Hindi'],
        workingHours: '09:00 - 17:00',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        isActive: true,
        isDeleted: false,
        visibility: true
      },
      {
        name: 'Ms. Sailee Dayanand Rao',
        email: 'sailee.rao@fastgluco.com',
        passwordHash: defaultPasswordHash,
        avatar: '/uploads/ms_sailee_dayanand_rao.jpg',
        specialty: 'Psycho-oncology, de- addiction counselling',
        qualification: 'M.Sc Psycho-oncology, Certified Addiction Counselor',
        experience: 5,
        slotDuration: 30,
        consultationFee: 500,
        onlineConsultationFee: 500,
        offlineConsultationFee: 500,
        extraFeePer15Min: 100,
        feePolicy: 'extra 100/- every 15 mins , if consultation exceeds 30mins',
        sleepEvaluationNote: 'for getting restorative sleep',
        description: 'Specialist in Psycho-oncology and de-addiction counselling for restorative mental well-being.',
        languagesKnown: ['English', 'Hindi', 'Marathi'],
        workingHours: '10:00 - 18:00',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isActive: true,
        isDeleted: false,
        visibility: true
      }
    ];

    const keepEmails = doctorsData.map(d => d.email.toLowerCase());
    const keepNames = doctorsData.map(d => d.name);

    // 1. Remove old/hardcoded doctors not matching the two real doctors
    const oldDoctors = await Doctor.find({
      email: { $nin: keepEmails },
      name: { $nin: keepNames }
    });

    if (oldDoctors.length > 0) {
      const oldDocIds = oldDoctors.map(d => d._id);
      console.log(`Found ${oldDoctors.length} old/test doctor(s) to remove:`, oldDoctors.map(d => d.name));
      await DoctorAvailability.deleteMany({ doctorId: { $in: oldDocIds } });
      await Doctor.deleteMany({ _id: { $in: oldDocIds } });
      console.log('Old/test doctors and their availability schedules successfully deleted.');
    } else {
      console.log('No outdated/test doctors found to remove.');
    }

    // 2. Upsert the two real doctors with full details and photos
    for (const docInfo of doctorsData) {
      let doctor = await Doctor.findOne({ 
        $or: [
          { email: docInfo.email },
          { name: docInfo.name }
        ]
      });

      if (doctor) {
        Object.assign(doctor, docInfo);
        await doctor.save();
        console.log(`Updated existing doctor with photo & details: ${doctor.name} (${doctor._id})`);
      } else {
        doctor = await Doctor.create(docInfo);
        console.log(`Created new doctor: ${doctor.name} (${doctor._id})`);
      }

      // Ensure DoctorAvailability exists
      let avail = await DoctorAvailability.findOne({ doctorId: doctor._id });
      if (!avail) {
        avail = await DoctorAvailability.create({
          doctorId: doctor._id,
          availableDays: [1, 2, 3, 4, 5, 6],
          availableTimeSlots: [
            { start: '09:00', end: '13:00' },
            { start: '14:00', end: '18:00' }
          ],
          slotDuration: doctor.slotDuration || 30,
          maxAppointmentsPerSlot: 1
        });
        console.log(`Created availability schedule for: ${doctor.name}`);
      } else {
        avail.slotDuration = doctor.slotDuration || 30;
        await avail.save();
        console.log(`Updated availability schedule slot duration for: ${doctor.name}`);
      }
    }

    // 3. Remove any old appointments referencing deleted doctors
    const validDoctorIds = (await Doctor.find({}, '_id')).map(d => d._id);
    const orphanAppts = await Appointment.deleteMany({ doctorId: { $nin: validDoctorIds } });
    if (orphanAppts.deletedCount > 0) {
      console.log(`Cleaned ${orphanAppts.deletedCount} old appointment(s) referencing deleted test doctors.`);
    }

    const currentDoctors = await Doctor.find();
    console.log(`\nCurrently active doctors in database (${currentDoctors.length}):`);
    currentDoctors.forEach(d => {
      console.log(`- ${d.name} | ${d.specialty} | Fee: ₹${d.consultationFee}/${d.slotDuration}m | Avatar: ${d.avatar}`);
    });

    console.log('\nDoctor seeding & old doctor cleanup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding doctors:', err);
    process.exit(1);
  }
}

seedDoctors();
