import { Schema, model, Document } from 'mongoose';

export interface IPaymentGatewayConfig extends Document {
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  isSandbox: boolean;
  enablePayments: boolean;
  enableSubscriptions: boolean; // Subscription Required ON/OFF
  enableTwilioOtp: boolean; // Twilio OTP ON/OFF
  enableSubscriptionCoupons: boolean;
  enableExternalPayments: boolean;
  enableIOSExternalPayments: boolean;
  enableSaferFoodCoupons: boolean;
  gstPercentage: number; // GST Percentage configured by admin (e.g. 18)
  shopGstPercentage: number; // GST for Shop products
  shopDiscountPercentage: number; // Global Discount for Shop products
  shopShippingFee: number; // Shipping fee for shop orders
  askMitoQuestionFee: number; // Fee per 48h medical query (default 100)
  enableAskMitoImageUpload?: boolean; // Admin Global Image Upload ON/OFF
  safeGlucoseThreshold: number; // Safe limit (default 90)
  moderateGlucoseThreshold: number; // Moderate limit (default 110)
  aiSpikeThreshold: number; // AI triggers coaching above this
  aiQuestions: string[]; // Array of questions to ask sequentially
  aiCompletionMessage: string; // Final message when all answered
  glucoseAlertMinIntervalHours: number; // Minimum hours between consecutive alert emails to prevent spamming
  enableHydrationTracker: boolean; // Hydration Tracker ON/OFF
  hydrationDailyLimitMl: number; // Daily hydration goal limit in ml
  enableWorkoutTracker: boolean; // Workout Tracker ON/OFF
  appName?: string;
  appTagline?: string;
  appLogoUrl?: string;
  cancerTreatmentDisclaimer?: string;
  cancerSecondaryDisclaimer?: string;
  cancerPreventionDisclaimer?: string;
  updatedBy?: Schema.Types.ObjectId; // ref: AdminUser
  createdAt: Date;
  updatedAt: Date;
}

const paymentGatewayConfigSchema = new Schema<IPaymentGatewayConfig>(
  {
    razorpayKeyId: { type: String, trim: true },
    razorpayKeySecret: { type: String, trim: true },
    isSandbox: { type: Boolean, default: true, required: true },
    enablePayments: { type: Boolean, default: false, required: true },
    enableSubscriptions: { type: Boolean, default: false, required: true },
    enableTwilioOtp: { type: Boolean, default: false, required: true },
    enableSubscriptionCoupons: { type: Boolean, default: true },
    enableExternalPayments: { type: Boolean, default: true },
    enableIOSExternalPayments: { type: Boolean, default: false },
    enableSaferFoodCoupons: { type: Boolean, default: true },
    gstPercentage: { type: Number, default: 18, min: 0, required: true },
    shopGstPercentage: { type: Number, default: 0, min: 0 },
    shopDiscountPercentage: { type: Number, default: 0, min: 0 },
    shopShippingFee: { type: Number, default: 0, min: 0 },
    askMitoQuestionFee: { type: Number, default: 100, min: 0 },
    enableAskMitoImageUpload: { type: Boolean, default: true },
    safeGlucoseThreshold: { type: Number, default: 90, required: true },
    moderateGlucoseThreshold: { type: Number, default: 110, required: true },
    aiSpikeThreshold: { type: Number, default: 110 },
    enableHydrationTracker: { type: Boolean, default: true, required: true },
    hydrationDailyLimitMl: { type: Number, default: 3000, required: true },
    enableWorkoutTracker: { type: Boolean, default: true, required: true },
    appName: { type: String, default: 'Mito_Reboot' },
    appTagline: { type: String, default: 'The circadian fasting app' },
    appLogoUrl: { type: String, default: '' },
    cancerTreatmentDisclaimer: { type: String, default: `Lifestyle Guidance & Legal Disclaimer
The recommendations provided in this application are intended solely for educational and general wellness purposes. They are designed to complement—not replace—the advice, diagnosis, or treatment provided by your healthcare professionals.

Recommended Healthy Lifestyle Practices
Where medically appropriate, we encourage you to:
• Complete your evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), if approved by your treating doctor.
• Engage in at least 20 minutes of physical activity each day, such as walking, yoga, stretching, or other suitable exercise.
• Spend at least 20 minutes daily doing an activity you enjoy, such as listening to music, singing, dancing, reading, gardening, painting, or spending time with loved ones.
• Practice meditation, mindfulness, deep breathing, or other relaxation techniques for 10–20 minutes each day to support emotional well-being and stress management.

Important Medical Notice
If you are currently undergoing treatment for cancer, you must discuss these lifestyle recommendations with your treating oncologist or healthcare team before implementing them.
Time-Restricted Eating, exercise, dietary changes, and other lifestyle interventions may not be appropriate for every individual. Their suitability depends on factors including your cancer type and stage, treatment plan, nutritional status, body weight, diabetes or blood sugar control, kidney or liver function, and other medical conditions.
If you experience significant weight loss, poor appetite, dizziness, dehydration, low blood sugar, severe fatigue, persistent vomiting, or any worsening symptoms, discontinue the intervention immediately and seek medical advice.

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is general educational information and does not constitute medical advice.
• All lifestyle modifications are undertaken voluntarily and at your own discretion.
• You are responsible for consulting your treating oncologist or healthcare provider before making any dietary, fasting, exercise, or lifestyle changes.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, or contributors associated with this application shall be liable for any injury, illness, adverse event, complication, treatment outcome, loss, or damage arising directly or indirectly from the use of this application or from reliance on its recommendations.
• This application does not create a doctor–patient relationship between you and the Company or any healthcare professional associated the application.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the recommendations only in consultation with your treating healthcare team.` },
    cancerSecondaryDisclaimer: { type: String, default: `Lifestyle, Nutrition & Antioxidant Guidance for Cancer Survivors
(Cancer Prevention and Survivorship)

Congratulations on completing your cancer treatment. The recommendations provided in this application are intended to support healthy living after cancer treatment and may contribute to overall health and reducing the risk of cancer recurrence. They are not intended to replace regular medical follow-up or evidence-based medical care.

Recommended Healthy Lifestyle Practices
Where medically appropriate and after discussion with your healthcare team, we encourage you to:
• Complete your evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), if suitable for your health.
• Engage in at least 20–30 minutes of physical activity every day, such as brisk walking, yoga, cycling, resistance exercises, or other activities appropriate for your fitness level.
• Consume a balanced diet rich in natural antioxidants, including fruits, vegetables, whole grains, legumes, nuts, seeds, herbs, and spices.
• If you choose to take antioxidant supplements (such as Vitamin C, Vitamin E, Curcumin, Coenzyme Q10, Selenium, Zinc, or other nutritional supplements), discuss their use with your treating oncologist or healthcare provider before starting them.
• Spend at least 20 minutes each day doing an activity you enjoy, such as listening to music, singing, dancing, reading, gardening, painting, or spending time with family and friends.
• Practice meditation, mindfulness, deep breathing, or relaxation exercises for 10–20 minutes daily.
• Maintain a healthy body weight, obtain adequate sleep, avoid tobacco, limit alcohol consumption, and attend all scheduled follow-up appointments.

About Antioxidants
This application may ask questions regarding your intake of natural antioxidant-rich foods and antioxidant supplements to better understand your lifestyle habits and generate personalised wellness insights.
The information collected is not intended to prescribe, recommend, or encourage the use of any specific antioxidant or supplement. While a diet naturally rich in fruits, vegetables, whole grains, legumes, nuts, and seeds is generally recommended for overall health, the benefits and safety of antioxidant supplements may vary depending on your cancer type, previous treatments, treatments, medications, and other medical conditions.
Do not start, stop, or modify any antioxidant supplement without consulting your treating oncologist or healthcare provider.

Important Medical Notice
Even after completing cancer treatment, significant dietary changes, Time-Restricted Eating, fasting, exercise programmes, or nutritional supplements should be discussed with your healthcare provider, particularly if you have:
• Diabetes or blood sugar disorders
• Unintentional weight loss or malnutrition
• Kidney, liver, or heart disease
• Osteoporosis or frailty
• Persistent treatment-related side effects
• Any other significant medical condition

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is for educational, wellness, and survivorship purposes only and does not constitute medical advice, diagnosis, or treatment.
• The lifestyle recommendations, including Time-Restricted Eating, exercise, stress management, natural antioxidant intake, and antioxidant supplements, are intended to provide general wellness guidance and cannot guarantee prevention of cancer recurrence or improved treatment outcomes.
• Any dietary changes, fasting schedules, exercise programmes, or use of antioxidant supplements are undertaken voluntarily and at your own discretion and risk.
• You are solely responsible for discussing these interventions with your treating oncologist or healthcare provider before implementing them.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, collaborators, or contributors associated with this application shall be legally responsible or liable for any injury, illness, allergic reaction, supplement-related adverse effects, drug–nutrient interactions, cancer recurrence, disease progression, treatment outcome, financial loss, or any direct, indirect, incidental, or consequential damages arising from the use of this application or reliance on its recommendations.
• This application does not establish a doctor–patient relationship between you and the Company or any healthcare professional associated with it.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the recommendations only as a complement to regular medical follow-up and professional medical advice.` },
    cancerPreventionDisclaimer: { type: String, default: `Lifestyle Guidance & Legal Disclaimer for the General Public
(Primary Cancer Prevention and Healthy Living)

This application is designed to promote healthy lifestyle habits that are supported by current scientific evidence and public health recommendations. The goal is to encourage behaviours that may help reduce the risk of cancer and other chronic diseases while improving overall health and well-being.

The information provided by this application is intended for educational and wellness purposes only. It is not intended to diagnose, treat, cure, or prevent any disease and should not be considered a substitute for professional medical advice.

Recommended Healthy Lifestyle Practices
We encourage users to:
• Finish their evening meal by 7:00 PM and maintain a consistent overnight fasting period (Time-Restricted Eating), where appropriate.
• Engage in at least 20–30 minutes of physical activity every day.
• Consume a balanced diet rich in natural antioxidants, including fruits, vegetables, whole grains, legumes, nuts, seeds, herbs, and spices.
• Limit ultra-processed foods, sugary beverages, processed meats, and excessive saturated fats.
• Spend at least 20 minutes each day doing an activity they enjoy to promote emotional well-being.
• Practice meditation, mindfulness, or deep breathing for 10–20 minutes daily.
• Maintain a healthy body weight, obtain adequate sleep, avoid tobacco in all forms, and limit or avoid alcohol consumption.

About Antioxidants
This application may ask questions regarding your intake of natural antioxidant-rich foods and antioxidant supplements to provide personalised wellness insights.
A balanced diet containing naturally occurring antioxidants is generally recommended as part of a healthy lifestyle. However, high-dose antioxidant supplements may not be appropriate for everyone and should not be used as a substitute for a healthy diet.
If you are pregnant, breastfeeding, have diabetes, kidney or liver disease, heart disease, or any other significant medical condition, or if you are taking prescription medications, consult your healthcare provider before beginning Time-Restricted Eating, major dietary changes, or antioxidant supplements.

Legal Disclaimer
By using this application, you acknowledge and agree that:
• The information provided is for educational, informational, and wellness purposes only and does not constitute medical advice, diagnosis, or treatment.
• The recommendations contained within this application are based on current scientific literature and recognised healthy lifestyle principles but cannot guarantee prevention of cancer or any other disease.
• Any lifestyle modifications, including Time-Restricted Eating, dietary changes, exercise, meditation, stress-management practices, natural antioxidant intake, or antioxidant supplements, are undertaken voluntarily and entirely at your own discretion and risk.
• You are responsible for seeking advice from a qualified healthcare professional before making significant dietary or lifestyle changes, particularly if you have an existing medical condition or are taking medications.
• Neither the Company, its directors, employees, affiliates, developers, nor any doctors, researchers, advisors, collaborators, or contributors associated with this application shall be legally responsible or liable for any injury, illness, allergic reaction, nutritional deficiency, supplement-related adverse effects, drug–nutrient interactions, medical complications, financial loss, or any direct, indirect, incidental, or consequential damages arising from the use of this application or reliance upon its recommendations.
• This application does not establish a doctor–patient relationship between you and the Company or any healthcare professional associated with it.
• To the fullest extent permitted by applicable law, the Company and its associated healthcare professionals disclaim all legal responsibility and liability for any decisions made or actions taken based on the information provided in this application.

By continuing to use this application, you confirm that you have read, understood, and accepted this disclaimer and agree to use the information responsibly as part of a healthy lifestyle, while seeking professional medical advice whenever appropriate.` },
    aiQuestions: { 
      type: [String], 
      default: ["You recently logged a food that spiked your glucose. Why did you consume this when it's advised to avoid it?", "Did you take a walk afterwards?"] 
    },
    aiCompletionMessage: { type: String, default: "Thank you for sharing this context. We have recorded your activity. Remember to stay hydrated and walk 15 mins after heavy meals!" },
    glucoseAlertMinIntervalHours: { type: Number, default: 2, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'AdminUser' }
  },
  {
    timestamps: true
  }
);

export const PaymentGatewayConfig = model<IPaymentGatewayConfig>('PaymentGatewayConfig', paymentGatewayConfigSchema);
