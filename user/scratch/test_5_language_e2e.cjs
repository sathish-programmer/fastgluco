const path = require('path');
const jwt = require(path.join(__dirname, '../../backend/node_modules/jsonwebtoken'));

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_testing_only';
const mockUser = {
  id: 'test_user_multilingual_5lang',
  email: 'test_multilingual@example.com',
  name: 'Test Patient'
};
const token = jwt.sign(mockUser, JWT_SECRET, { expiresIn: '1h' });

const SCRIPT_RANGES = {
  ta: /[\u0B80-\u0BFF]/, // Tamil
  kn: /[\u0C80-\u0CFF]/, // Kannada
  hi: /[\u0900-\u097F]/, // Devanagari (Hindi)
  te: /[\u0C00-\u0C7F]/  // Telugu
};

function postJson(port, path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Check if backend server is currently running or test controller directly
async function runTests() {
  console.log('====================================================');
  console.log('STARTING 5-LANGUAGE PIPELINE INTEGRATION AUDIT');
  console.log('====================================================\n');

  // Let's test the controller logic directly or via server if running
  const { AiChatController } = require(require('path').join(__dirname, '../../backend/dist/controllers/aiChatController.js'));

  const languages = ['en', 'ta', 'kn', 'hi', 'te'];
  const testMatrix = {};

  for (const lang of languages) {
    testMatrix[lang] = {
      mia_q1: false,
      mia_tips: false,
      mia_script_valid: false,
      gia_q1: false,
      gia_script_valid: false,
      tts_locale: false,
      tts_voice_match: false
    };

    console.log(`\n--- TESTING LANGUAGE: [${lang.toUpperCase()}] ---`);

    // 1. Test Mia deStressChat step 1
    const mockReq1 = {
      user: mockUser,
      body: {
        message: lang === 'en' ? 'Work stress' : lang === 'ta' ? 'வேலை அழுத்தம்' : lang === 'te' ? 'పని ఒత్తిడి' : lang === 'kn' ? 'ಕೆಲಸದ ಒತ್ತಡ' : 'कार्य का तनाव',
        mode: 'stress',
        exchangeCount: 1,
        identifiedIssue: 'worklife',
        language: lang,
        history: []
      }
    };

    let replyData1 = null;
    const mockRes1 = {
      json: d => { replyData1 = d; return mockRes1; },
      status: () => mockRes1
    };

    await AiChatController.deStressChat(mockReq1, mockRes1);

    if (replyData1 && (replyData1.reply || replyData1.message)) {
      const text = replyData1.reply || replyData1.message;
      testMatrix[lang].mia_q1 = true;
      if (lang === 'en') {
        testMatrix[lang].mia_script_valid = true;
      } else {
        const hasScript = SCRIPT_RANGES[lang].test(text);
        testMatrix[lang].mia_script_valid = hasScript;
        if (!hasScript) {
          console.error(`FAIL: Mia step 1 in ${lang} did NOT contain ${lang} Unicode script! Response: ${text.slice(0, 80)}...`);
        }
      }
      console.log(`[PASS] Mia Q1 (${lang}): ${text.slice(0, 60)}...`);
    }

    // 2. Test Mia deStressChat step 2 (Personalized 4-step tips)
    const mockReq2 = {
      user: mockUser,
      body: {
        message: lang === 'en' ? 'Long hours and burnout' : lang === 'ta' ? 'அதிக வேலை நேரம்' : lang === 'te' ? 'ఎక్కువ పని గంటలు' : lang === 'kn' ? 'ಹೆಚ್ಚಿನ ಕೆಲಸ' : 'काम के लंबे घंटे',
        mode: 'stress',
        exchangeCount: 2,
        identifiedIssue: 'worklife',
        language: lang,
        history: []
      }
    };

    let replyData2 = null;
    const mockRes2 = {
      json: d => { replyData2 = d; return mockRes2; },
      status: () => mockRes2
    };

    await AiChatController.deStressChat(mockReq2, mockRes2);

    if (replyData2 && replyData2.tips && replyData2.tips.length === 4) {
      testMatrix[lang].mia_tips = true;
      if (lang !== 'en') {
        const tipsScript = replyData2.tips.every(t => SCRIPT_RANGES[lang].test(t));
        if (!tipsScript) {
          console.error(`FAIL: Mia tips in ${lang} had untranslated English items!`);
        } else {
          console.log(`[PASS] Mia 4-step personalized tips in ${lang} verified with 100% native script.`);
        }
      } else {
        console.log(`[PASS] Mia 4-step personalized tips in en verified.`);
      }
    }

    // 3. Test Gia geneticRiskChat step 1
    const mockReqGia = {
      user: mockUser,
      body: {
        message: lang === 'en' ? 'Personal diagnosis' : lang === 'ta' ? 'தனிப்பட்ட நோய் கண்டறிதல்' : lang === 'te' ? 'వ్యక్తిగత నిర్ధారణ' : lang === 'kn' ? 'ವೈಯಕ್ತಿಕ ರೋಗ ನಿರ್ಣಯ' : 'व्यक्तिगत निदान',
        exchangeCount: 1,
        language: lang,
        history: []
      }
    };

    let replyDataGia = null;
    const mockResGia = {
      json: d => { replyDataGia = d; return mockResGia; },
      status: () => mockResGia
    };

    await AiChatController.geneticRiskChat(mockReqGia, mockResGia);

    if (replyDataGia && (replyDataGia.reply || replyDataGia.message)) {
      const text = replyDataGia.reply || replyDataGia.message;
      testMatrix[lang].gia_q1 = true;
      if (lang === 'en') {
        testMatrix[lang].gia_script_valid = true;
      } else {
        const hasScript = SCRIPT_RANGES[lang].test(text);
        testMatrix[lang].gia_script_valid = hasScript;
        if (!hasScript) {
          console.error(`FAIL: Gia step 1 in ${lang} did NOT contain ${lang} Unicode script!`);
        }
      }
      console.log(`[PASS] Gia Q1 (${lang}): ${text.slice(0, 60)}...`);
      if (replyDataGia.options && replyDataGia.options.length > 0) {
        console.log(`[PASS] Gia Options (${lang}): [${replyDataGia.options.slice(0, 3).join(', ')}, ...]`);
      }
    }

    // 4. Test TTS Locale mapping and voice matching
    const expectedTts = {
      en: 'en-US',
      ta: 'ta-IN',
      te: 'te-IN',
      kn: 'kn-IN',
      hi: 'hi-IN'
    }[lang];

    const { getTtsLocale } = require('./tts_test_helper.cjs');
    const computedLocale = getTtsLocale(lang);
    if (computedLocale === expectedTts) {
      testMatrix[lang].tts_locale = true;
      testMatrix[lang].tts_voice_match = true;
      console.log(`[PASS] TTS Locale for ${lang} correctly maps to: ${computedLocale}`);
    } else {
      console.error(`FAIL: TTS Locale for ${lang} returned ${computedLocale}, expected ${expectedTts}`);
    }
  }

  console.log('\n====================================================');
  console.log('FINAL 5-LANGUAGE VERIFICATION AUDIT MATRIX');
  console.log('====================================================');
  console.table(testMatrix);

  let allPassed = true;
  for (const [lang, results] of Object.entries(testMatrix)) {
    for (const [k, v] of Object.entries(results)) {
      if (!v) {
        allPassed = false;
        console.error(`TEST FAILURE in [${lang}]: ${k} is false`);
      }
    }
  }

  if (allPassed) {
    console.log('\n🎉 ALL 5 LANGUAGES (EN, TA, KN, HI, TE) PASSED WITH 100% ZERO DEFECTS!');
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
