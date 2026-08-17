import { Request, Response } from 'express';
import IndianCancer from '../models/IndianCancer';
import CancerVideo from '../models/CancerVideo';

// Seeding function for initial data
const seedDefaultCancers = async () => {
  const maleData = [
    { name: "Lip, oral cavity", percentage: 20.4, gender: "Men", riskFactors: ["Tobacco chewing (gutka/khaini)", "Betel nut (paan)", "Smoking", "Alcohol"], description: "Lip and oral cavity cancers represent a highly prevalent group of malignancies in India, driven predominantly by chewing and smoking tobacco products.", displayOrder: 1 },
    { name: "Lung", percentage: 10.1, gender: "Men", riskFactors: ["Smoking", "Secondhand smoke", "Air pollution", "Occupational exposure (asbestos, silica)"], description: "Lung cancer remains a leading cause of cancer-related mortality, heavily linked to smoking and rising ambient air pollution.", displayOrder: 2 },
    { name: "Colorectum", percentage: 6.2, gender: "Men", riskFactors: ["Red/processed meat", "Low-fibre diet", "Obesity", "Sedentary lifestyle", "Alcohol"], description: "Colorectal cancers are rising rapidly due to modern lifestyle shifts, high intake of ultra-processed foods, and physical inactivity.", displayOrder: 3 },
    { name: "Stomach", percentage: 5.8, gender: "Men", riskFactors: ["H. pylori infection", "Salted/smoked/pickled foods", "Tobacco", "Low fruit & vegetable intake"], description: "Stomach cancer has high regional variation in India, associated with dietary habits like high salt consumption and H. pylori bacteria.", displayOrder: 4 },
    { name: "Prostate", percentage: 5.1, gender: "Men", riskFactors: ["Age", "Family history", "Hormonal factors", "High-fat diet"], description: "Prostate cancer increases in incidence with age, and screening options are recommended for high-risk profiles.", displayOrder: 5 },
    { name: "Other cancers", percentage: 52.4, gender: "Men", riskFactors: ["Leukaemia", "Oesophagus", "Liver", "NHL", "Bladder", "And 25+ other sites"], description: "A combination of various other malignancies, each accounting for smaller shares of the total cancer burden.", displayOrder: 6 }
  ];

  const femaleData = [
    { name: "Breast", percentage: 30.4, gender: "Women", riskFactors: ["Obesity", "Late childbirth/no breastfeeding", "Hormone therapy", "Family history", "Alcohol", "Physical inactivity"], description: "Breast cancer is the single most common cancer among Indian women, showing an alarmingly high incidence in urban areas.", displayOrder: 1 },
    { name: "Cervix uteri", percentage: 10.2, gender: "Women", riskFactors: ["HPV infection", "Lack of Pap/HPV screening", "Early marriage", "Multiple pregnancies", "Smoking"], description: "Cervical cancer is highly preventable through timely HPV vaccination and periodic cervical screening (Pap smear / HPV test).", displayOrder: 2 },
    { name: "Lip, oral cavity", percentage: 5.9, gender: "Women", riskFactors: ["Tobacco chewing (gutka, betel nut)", "Smoking"], description: "Oral cancers in females are frequently associated with smokeless tobacco chewing habits.", displayOrder: 3 },
    { name: "Ovary", percentage: 5.8, gender: "Women", riskFactors: ["Family history/BRCA mutation", "Hormonal factors", "Nulliparity", "Endometriosis"], description: "Ovarian cancers are often diagnosed at later stages, highlighting the need for prompt evaluation of persistent abdominal symptoms.", displayOrder: 4 },
    { name: "Colorectum", percentage: 4.5, gender: "Women", riskFactors: ["Low-fibre diet", "Obesity", "Sedentary lifestyle", "Red/processed meat"], description: "Colorectal cancer rates reflect similar dietary and activity-related risk factors as seen in men.", displayOrder: 5 },
    { name: "Other cancers", percentage: 43.2, gender: "Women", riskFactors: ["Oesophagus", "Stomach", "Corpus uteri", "Leukaemia", "Liver", "And 25+ other sites"], description: "Represents the collective share of other cancer sites in females.", displayOrder: 6 }
  ];

  await IndianCancer.insertMany([...maleData, ...femaleData]);
};

export class IndianCancerController {
  
  // Public user API: GET /cancer-screening/indian-cancers
  public static async getIndianCancers(req: Request, res: Response) {
    try {
      let count = await IndianCancer.countDocuments();
      if (count === 0) {
        await seedDefaultCancers();
      }

      const activeCancers = await IndianCancer.find({ status: 'active' }).sort({ displayOrder: 1 });
      const activeVideos = await CancerVideo.find({ status: 'active' }).sort({ displayOrder: 1 });

      // Group active cancers by Men and Women
      const men = activeCancers
        .filter(c => c.gender === 'Men' || c.gender === 'Both')
        .map(c => {
          const videos = activeVideos.filter(v => v.cancerId.toString() === c._id.toString());
          return {
            ...c.toObject(),
            videos
          };
        });

      const women = activeCancers
        .filter(c => c.gender === 'Women' || c.gender === 'Both')
        .map(c => {
          const videos = activeVideos.filter(v => v.cancerId.toString() === c._id.toString());
          return {
            ...c.toObject(),
            videos
          };
        });

      return res.status(200).json({ men, women });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching Indian cancer data.' });
    }
  }

  // Admin GET /admin/indian-cancers
  public static async getAdminIndianCancers(req: Request, res: Response) {
    try {
      let count = await IndianCancer.countDocuments();
      if (count === 0) {
        await seedDefaultCancers();
      }
      const cancers = await IndianCancer.find().sort({ displayOrder: 1, createdAt: -1 });
      return res.status(200).json(cancers);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching admin cancer data.' });
    }
  }

  // Admin POST /admin/indian-cancers
  public static async createIndianCancer(req: Request, res: Response) {
    try {
      const { name, gender, percentage, riskFactors, description, displayOrder, status } = req.body;
      if (!name || !gender || percentage === undefined) {
        return res.status(400).json({ message: 'Name, gender, and percentage are required.' });
      }

      const cancer = new IndianCancer({
        name,
        gender,
        percentage,
        riskFactors: Array.isArray(riskFactors) ? riskFactors : [],
        description: description || '',
        displayOrder: displayOrder || 0,
        status: status || 'active'
      });

      await cancer.save();
      return res.status(201).json(cancer);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error creating cancer category.' });
    }
  }

  // Admin PUT /admin/indian-cancers/:id
  public static async updateIndianCancer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await IndianCancer.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: 'Cancer category not found.' });
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating cancer category.' });
    }
  }

  // Admin DELETE /admin/indian-cancers/:id
  public static async deleteIndianCancer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await IndianCancer.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Cancer category not found.' });
      // Delete associated videos
      await CancerVideo.deleteMany({ cancerId: id });
      return res.status(200).json({ message: 'Cancer category and associated videos deleted.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting cancer category.' });
    }
  }

  // Admin GET /admin/cancer-videos
  public static async getAdminCancerVideos(req: Request, res: Response) {
    try {
      const videos = await CancerVideo.find().populate('cancerId', 'name').sort({ displayOrder: 1, createdAt: -1 });
      return res.status(200).json(videos);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error fetching cancer videos.' });
    }
  }

  // Admin POST /admin/cancer-videos
  public static async createCancerVideo(req: Request, res: Response) {
    try {
      const { cancerId, title, description, videoUrl, thumbnailUrl, displayOrder, status } = req.body;
      if (!cancerId || !title || !videoUrl) {
        return res.status(400).json({ message: 'Cancer ID, title, and video URL are required.' });
      }

      const video = new CancerVideo({
        cancerId,
        title,
        description: description || '',
        videoUrl,
        thumbnailUrl: thumbnailUrl || '',
        displayOrder: displayOrder || 0,
        status: status || 'active'
      });

      await video.save();
      return res.status(201).json(video);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error creating cancer video.' });
    }
  }

  // Admin PUT /admin/cancer-videos/:id
  public static async updateCancerVideo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await CancerVideo.findByIdAndUpdate(id, req.body, { new: true });
      if (!updated) return res.status(404).json({ message: 'Video not found.' });
      return res.status(200).json(updated);
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error updating cancer video.' });
    }
  }

  // Admin DELETE /admin/cancer-videos/:id
  public static async deleteCancerVideo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deleted = await CancerVideo.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ message: 'Video not found.' });
      return res.status(200).json({ message: 'Cancer video deleted successfully.' });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || 'Error deleting cancer video.' });
    }
  }
}
