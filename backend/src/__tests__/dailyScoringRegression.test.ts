import test, { describe } from 'node:test';
import assert from 'node:assert';
import { getDailyMotivationForUser } from '../data/dailyMotivationData';

describe('Daily Check-in Scoring Accuracy & Habit Normalization', () => {
  // Helper mimicking DailyLoggingChatbotModal parsing & normalization logic
  const parseChatbotAnswer = (stepId: string, valueStr: string) => {
    const lowerVal = valueStr.toLowerCase();
    const isYes = lowerVal.includes('yes') || lowerVal.includes('completed') || lowerVal.includes('good') || lowerVal.includes('done') || lowerVal.includes('positive');

    if (stepId === 'movement') {
      const isNoMovement = lowerVal.includes('no movement') || lowerVal.includes('no exercise') || lowerVal.includes('rest day') || lowerVal.includes('bed rest') || lowerVal.includes('not today') || lowerVal.includes('none') || lowerVal.startsWith('0 min') || lowerVal.includes(' 0 min') || lowerVal.includes('zero min') || lowerVal.includes('did not') || lowerVal.includes("didn't") || lowerVal.trim() === 'no';
      let mins = 0;
      if (!isNoMovement) {
        if (lowerVal.includes('30+') || lowerVal.includes('30 min') || lowerVal.includes('45 min') || lowerVal.includes('60 min') || lowerVal.includes('1 hour') || lowerVal.includes('strength training') || lowerVal.includes('walk / run') || lowerVal.includes('jog') || lowerVal.includes('gym')) {
          mins = 30;
        } else if (lowerVal.includes('<20') || lowerVal.includes('light') || lowerVal.includes('stretch') || lowerVal.includes('15') || lowerVal.includes('10')) {
          mins = 15;
        } else if (lowerVal.includes('20+') || lowerVal.includes('20 min') || lowerVal.includes('20')) {
          mins = 20;
        } else if (isYes || lowerVal.includes('walk') || lowerVal.includes('yoga') || lowerVal.includes('exercise') || lowerVal.includes('workout') || lowerVal.includes('cycling') || lowerVal.includes('swimming')) {
          mins = 30;
        }
      }
      const isCompleted = mins >= 20;
      return { minutes: mins, done: isCompleted, isCompleted, score: isCompleted ? 1 : 0, activity: valueStr, option: valueStr };
    }

    if (stepId === 'safer_products') {
      const isNotToday = lowerVal.includes('not today') || lowerVal.includes('no') || lowerVal.includes('none') || lowerVal.includes('skip') || lowerVal.includes('synthetic');
      const isSafe = !isNotToday && (isYes || lowerVal.includes('yes') || lowerVal.includes('safe') || lowerVal.includes('clean'));
      return { saferProductsUsed: isSafe, score: isSafe ? 1 : 0, option: valueStr };
    }

    if (stepId === 'fasting') {
      const isSkipped = lowerVal.includes('no') || lowerVal.includes('skip') || lowerVal.includes('not today');
      const hours = isSkipped ? 0 : lowerVal.includes('16') ? 16 : lowerVal.includes('12') ? 12 : isYes ? 14 : 0;
      const isCompleted = !isSkipped && (hours >= 12 || isYes);
      return { completed: isCompleted, hours, score: isCompleted ? 1 : 0, option: valueStr };
    }

    if (stepId === 'antioxidants') {
      const isNotToday = lowerVal.includes('not today') || lowerVal.includes('no') || lowerVal.includes('none') || lowerVal.includes('skip');
      const isConsumed = !isNotToday && (isYes || lowerVal.includes('consumed') || lowerVal.includes('berries') || lowerVal.includes('turmeric'));
      return { consumed: isConsumed, score: isConsumed ? 1 : 0, option: valueStr };
    }

    if (stepId === 'stress') {
      const isStressed = lowerVal.includes('high') || lowerVal.includes('moderate') || lowerVal.includes('strain') || lowerVal.includes('severe') || lowerVal.includes('drained') || lowerVal.includes('anxiety') || lowerVal.includes('worry') || lowerVal.includes('overwhelm');
      return {
        faceId: isStressed ? 'stressed' : 'calm',
        score: isStressed ? -1 : 0,
        stressScore: isStressed ? 7 : 0,
        option: valueStr
      };
    }

    return null;
  };

  // Helper mimicking NonCancerDashboard score evaluators
  const evaluateMovementDashboardScore = (logValue: any) => {
    if (!logValue) return null;
    const optStr = (typeof logValue === 'object' ? (logValue.option || logValue.notes || logValue.activity || '') : `${logValue}`).toLowerCase();
    const isExplicitNo = optStr.includes('no movement') || optStr.includes('not today') || optStr.includes('none') || optStr.includes('rest day') || optStr.includes('bed rest') || optStr.includes('did not') || optStr.includes("didn't") || logValue?.done === false || logValue?.isCompleted === false || logValue?.minutes === 0 || logValue?.score === 0;
    if (isExplicitNo) return 0;
    if (logValue === 1 || (typeof logValue === 'number' && logValue >= 20) || logValue?.score > 0 || (typeof logValue?.minutes === 'number' && logValue.minutes >= 20) || logValue?.done === true || logValue?.isCompleted === true) return 1;
    if ((optStr.includes('walk') || optStr.includes('run') || optStr.includes('30+') || optStr.includes('yoga') || optStr.includes('strength')) && !optStr.includes('no')) return 1;
    return 0;
  };

  const evaluateSaferProductsDashboardScore = (logValue: any) => {
    if (!logValue) return null;
    const optStr = (typeof logValue === 'object' ? (logValue.option || logValue.notes || '') : `${logValue}`).toLowerCase();
    const isExplicitNo = optStr.includes('not today') || optStr.includes('no') || optStr.includes('skip') || logValue?.saferProductsUsed === false || logValue?.score === 0;
    if (isExplicitNo) return 0;
    if (logValue === 1 || logValue?.score > 0 || logValue?.saferProductsUsed === true || optStr.includes('yes') || optStr.includes('safe')) return 1;
    return 0;
  };

  const evaluateFastingDashboardScore = (logValue: any) => {
    if (!logValue) return null;
    const optStr = (typeof logValue === 'object' ? (logValue.option || logValue.notes || '') : `${logValue}`).toLowerCase();
    const isExplicitNo = optStr.includes('no') || optStr.includes('skip') || optStr.includes('not today') || logValue?.completed === false || (typeof logValue?.hours === 'number' && logValue.hours < 12 && !logValue?.completed);
    if (isExplicitNo) return 0;
    if (logValue === 1 || (typeof logValue?.hours === 'number' && logValue.hours >= 12) || logValue?.completed === true || optStr.includes('yes') || optStr.includes('16') || optStr.includes('12') || (logValue?.started && logValue?.ended)) return 1;
    return 0;
  };

  const evaluateAntioxidantsDashboardScore = (logValue: any) => {
    if (!logValue) return null;
    const optStr = (typeof logValue === 'object' ? (logValue.option || logValue.notes || '') : `${logValue}`).toLowerCase();
    const isExplicitNo = optStr.includes('not today') || optStr.includes('no') || optStr.includes('none') || optStr.includes('skip') || logValue?.consumed === false || logValue?.score === 0;
    if (isExplicitNo) return 0;
    if (logValue === 1 || logValue?.score > 0 || logValue?.consumed === true || optStr.includes('yes') || optStr.includes('consumed')) return 1;
    return 0;
  };

  test('Exercise: No movement today yields 0 points, never +1', () => {
    const parsed = parseChatbotAnswer('movement', 'No Movement Today');
    assert.strictEqual(parsed?.minutes, 0);
    assert.strictEqual(parsed?.done, false);
    assert.strictEqual(parsed?.score, 0);

    const dashboardScore = evaluateMovementDashboardScore(parsed);
    assert.strictEqual(dashboardScore, 0);
  });

  test('Exercise: 30+ min Walk / Run awards +1 point', () => {
    const parsed = parseChatbotAnswer('movement', '30+ min Walk / Run');
    assert.strictEqual(parsed?.minutes, 30);
    assert.strictEqual(parsed?.done, true);
    assert.strictEqual(parsed?.score, 1);

    const dashboardScore = evaluateMovementDashboardScore(parsed);
    assert.strictEqual(dashboardScore, 1);
  });

  test('Exercise: Rest Day / Bed Rest does not award +1', () => {
    const parsed = parseChatbotAnswer('movement', 'Rest Day');
    assert.strictEqual(parsed?.minutes, 0);
    assert.strictEqual(parsed?.done, false);
    assert.strictEqual(parsed?.score, 0);
    assert.strictEqual(evaluateMovementDashboardScore(parsed), 0);
  });

  test('Exercise: Light activity under 20 min does not award +1', () => {
    const parsed = parseChatbotAnswer('movement', 'Light Activity (<20 min)');
    assert.strictEqual(parsed?.minutes, 15);
    assert.strictEqual(parsed?.done, false);
    assert.strictEqual(parsed?.score, 0);
    assert.strictEqual(evaluateMovementDashboardScore(parsed), 0);
  });

  test('Safer Products: Not Today yields 0 points, never +1', () => {
    const parsed = parseChatbotAnswer('safer_products', 'Not Today');
    assert.strictEqual(parsed?.saferProductsUsed, false);
    assert.strictEqual(parsed?.score, 0);

    const dashboardScore = evaluateSaferProductsDashboardScore(parsed);
    assert.strictEqual(dashboardScore, 0);
  });

  test('Safer Products: Yes (Safe Products Used) awards +1 point', () => {
    const parsed = parseChatbotAnswer('safer_products', 'Yes (Safe Products Used)');
    assert.strictEqual(parsed?.saferProductsUsed, true);
    assert.strictEqual(parsed?.score, 1);

    const dashboardScore = evaluateSaferProductsDashboardScore(parsed);
    assert.strictEqual(dashboardScore, 1);
  });

  test('Fasting: No (Skipped) yields 0 points, never +1', () => {
    const parsed = parseChatbotAnswer('fasting', 'No (Skipped)');
    assert.strictEqual(parsed?.completed, false);
    assert.strictEqual(parsed?.hours, 0);
    assert.strictEqual(parsed?.score, 0);
    assert.strictEqual(evaluateFastingDashboardScore(parsed), 0);
  });

  test('Fasting: Yes (16+ hrs) awards +1 point', () => {
    const parsed = parseChatbotAnswer('fasting', 'Yes (16+ hrs)');
    assert.strictEqual(parsed?.completed, true);
    assert.strictEqual(parsed?.hours, 16);
    assert.strictEqual(parsed?.score, 1);
    assert.strictEqual(evaluateFastingDashboardScore(parsed), 1);
  });

  test('Antioxidants: Not Today yields 0 points, Yes yields +1', () => {
    const notToday = parseChatbotAnswer('antioxidants', 'Not Today');
    assert.strictEqual(notToday?.consumed, false);
    assert.strictEqual(evaluateAntioxidantsDashboardScore(notToday), 0);

    const consumed = parseChatbotAnswer('antioxidants', 'Yes (Consumed)');
    assert.strictEqual(consumed?.consumed, true);
    assert.strictEqual(evaluateAntioxidantsDashboardScore(consumed), 1);
  });

  test('Emotional Wellbeing: Calm vs Stressed mappings', () => {
    const calm = parseChatbotAnswer('stress', 'No Stress (Calm)');
    assert.strictEqual(calm?.faceId, 'calm');
    assert.strictEqual(calm?.score, 0);
    assert.strictEqual(calm?.stressScore, 0);

    const highStress = parseChatbotAnswer('stress', 'High Stress');
    assert.strictEqual(highStress?.faceId, 'stressed');
    assert.strictEqual(highStress?.score, -1);
    assert.strictEqual(highStress?.stressScore, 7);
  });

  test('Edit Answer Behavior: Editing replaces score, does not accumulate', () => {
    const sessionAnswers: Record<string, any> = {};

    // User initially selected "30+ min Walk / Run"
    sessionAnswers['movement'] = parseChatbotAnswer('movement', '30+ min Walk / Run');
    assert.strictEqual(evaluateMovementDashboardScore(sessionAnswers['movement']), 1);

    // User edits answer to "No Movement Today"
    sessionAnswers['movement'] = parseChatbotAnswer('movement', 'No Movement Today');
    assert.strictEqual(evaluateMovementDashboardScore(sessionAnswers['movement']), 0);
  });

  test('Daily Motivation progression: Users starting on launch date begin at Day 1', () => {
    const launchDate = new Date();
    const result = getDailyMotivationForUser(launchDate);
    assert.strictEqual(result.dayNumber, 1);
    assert.strictEqual(typeof result.text, 'string');
    assert.ok(result.text.length > 5);
  });
});
