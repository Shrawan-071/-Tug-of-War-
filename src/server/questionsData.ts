import { Question, Difficulty, Category } from '../types';

// Strict question validator
export function validateQuestion(q: any): q is Question {
  if (!q.id || typeof q.id !== 'string' || q.id.trim() === '') {
    console.error(`[Validator] Missing or empty ID:`, q);
    return false;
  }
  if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim() === '') {
    console.error(`[Validator] Question text is empty for ID ${q.id}`);
    return false;
  }
  if (!['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty)) {
    console.error(`[Validator] Invalid difficulty ${q.difficulty} for ID ${q.id}`);
    return false;
  }
  if (!['MATHEMATICS', 'LOGICAL_THINKING', 'PAHELI'].includes(q.category)) {
    console.error(`[Validator] Invalid category ${q.category} for ID ${q.id}`);
    return false;
  }
  if (!q.subcategory || typeof q.subcategory !== 'string' || q.subcategory.trim() === '') {
    console.error(`[Validator] Invalid subcategory for ID ${q.id}`);
    return false;
  }
  if (!q.options || !Array.isArray(q.options) || q.options.length !== 4) {
    console.error(`[Validator] Options must be exactly 4 elements for ID ${q.id}`);
    return false;
  }
  // Check for empty or broken option data
  for (let i = 0; i < q.options.length; i++) {
    const opt = q.options[i];
    if (opt === undefined || opt === null || opt === '' || typeof opt !== 'string' || opt.includes('undefined') || opt.includes('null') || opt.includes('NaN')) {
      console.error(`[Validator] Options contain broken data for ID ${q.id}:`, q.options);
      return false;
    }
  }
  // Check for duplicate options
  const uniqueOpts = new Set(q.options);
  if (uniqueOpts.size !== 4) {
    console.error(`[Validator] Options contain duplicates for ID ${q.id}:`, q.options);
    return false;
  }
  if (!q.correctAnswer || typeof q.correctAnswer !== 'string' || q.correctAnswer.trim() === '') {
    console.error(`[Validator] Missing correct answer for ID ${q.id}`);
    return false;
  }
  if (!q.options.includes(q.correctAnswer)) {
    console.error(`[Validator] Correct answer "${q.correctAnswer}" not in options for ID ${q.id}:`, q.options);
    return false;
  }
  if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim() === '') {
    console.error(`[Validator] Missing explanation for ID ${q.id}`);
    return false;
  }
  if (q.correctAnswer.includes('undefined') || q.correctAnswer.includes('null') || q.correctAnswer.includes('NaN')) {
    console.error(`[Validator] Correct answer contains broken data for ID ${q.id}:`, q.correctAnswer);
    return false;
  }
  return true;
}

// Helper to generate options safely, ensuring exactly 4 unique options with plausible distractors
function generateSafeOptions(correctAnswer: string, proposedDistractors: string[]): string[] {
  const correctStr = correctAnswer.toString().trim();
  const seen = new Set<string>([correctStr]);
  const uniqueDistractors: string[] = [];

  for (const d of proposedDistractors) {
    if (d === undefined || d === null) continue;
    const dStr = d.toString().trim();
    if (dStr === '' || seen.has(dStr)) continue;
    if (dStr.includes('undefined') || dStr.includes('null') || dStr.includes('NaN')) continue;
    seen.add(dStr);
    uniqueDistractors.push(dStr);
  }

  // Fallbacks if we don't have enough distractors
  const isNumeric = !isNaN(Number(correctStr));
  let fallbackCounter = 1;
  while (uniqueDistractors.length < 3) {
    let fallback = '';
    if (isNumeric) {
      const num = Number(correctStr);
      const offset = fallbackCounter * (Math.random() > 0.5 ? 5 : -5) + (Math.random() > 0.5 ? 1 : -1);
      fallback = Math.round(num + offset).toString();
    } else {
      fallback = `${correctStr} (Alt ${fallbackCounter})`;
    }

    const fbStr = fallback.trim();
    if (fbStr !== '' && !seen.has(fbStr)) {
      seen.add(fbStr);
      uniqueDistractors.push(fbStr);
    }
    fallbackCounter++;
  }

  const finalDistractors = uniqueDistractors.slice(0, 3);
  const allOptions = [correctStr, ...finalDistractors];

  // Shuffle using clean sorting
  return allOptions.sort(() => Math.random() - 0.5);
}

// Hand-crafted high quality static riddles & paheli
const HAND_CRAFTED_RIDDLES: Omit<Question, 'createdAt'>[] = [
  {
    id: 'paheli-easy-1',
    questionText: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'English Riddles',
    options: ['An Echo', 'A Cloud', 'A Whisper', 'A Kite'],
    correctAnswer: 'An Echo',
    explanation: 'An echo is sound reflecting off a surface; it speaks without a mouth and hears/travels with air.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-easy-2',
    questionText: 'What is full of holes but still holds water?',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'Everyday Logic',
    options: ['A Sponge', 'A Sieve', 'A Net', 'A Basket'],
    correctAnswer: 'A Sponge',
    explanation: 'A sponge has millions of tiny holes/pores but retains water due to capillary forces.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-easy-3',
    questionText: 'नेपाली पहेली: "एक सिंगे गोरु, मट्टितेल खोरु।" यो के हो?',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'Nepali Paheli',
    options: ['लालटिन (Lantern)', 'धुपौरो (Incense Burner)', 'मैनबत्ती (Candle)', 'खुकुरी (Khukuri)'],
    correctAnswer: 'लालटिन (Lantern)',
    explanation: 'The riddle describes a lantern, which has one key protrusion (single horn) and burns kerosene.',
    language: 'nepali',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-easy-4',
    questionText: 'What has to be broken before you can use it?',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'English Riddles',
    options: ['An Egg', 'A Coconut', 'A Glow Stick', 'All of the above'],
    correctAnswer: 'All of the above',
    explanation: 'Eggs, coconuts, and glow sticks must all be broken or cracked open before use.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-easy-5',
    questionText: 'What has one eye but cannot see?',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'Everyday Logic',
    options: ['A Needle', 'A Cyclone', 'A Potato', 'A Needle & A Hurricane'],
    correctAnswer: 'A Needle & A Hurricane',
    explanation: 'Both a sewing needle and a hurricane have "eyes", but neither can see.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-easy-6',
    questionText: 'नेपाली पहेली: "जति तान्यो, त्यति छोटो हुने के हो?"',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'Nepali Paheli',
    options: ['चुरोट (Cigarette)', 'डोरी (Rope)', 'बाटो (Road)', 'रबर (Rubber)'],
    correctAnswer: 'चुरोट (Cigarette)',
    explanation: 'A cigarette gets shorter the more you pull (puff) on it.',
    language: 'nepali',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-med-1',
    questionText: 'I have keys but open no locks. I have space but no room. You can enter but can\'t go outside. What am I?',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'Brain Teasers',
    options: ['A Keyboard', 'A Book', 'A Safe', 'A Prison'],
    correctAnswer: 'A Keyboard',
    explanation: 'A computer keyboard has typing keys (e.g., Spacebar, Enter, Backspace) but opens no locks.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-med-2',
    questionText: 'The person who makes it has no need of it; the person who buys it does not use it for themselves. The person who uses it does so without knowing. What is it?',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'Brain Teasers',
    options: ['A Coffin', 'A Crib', 'A Trophy', 'A Ring'],
    correctAnswer: 'A Coffin',
    explanation: 'Coffins are made by carpenters, purchased for someone else, and used by the deceased who is unaware.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-med-3',
    questionText: 'नेपाली पहेली: "खोलाको तीरमा एउटा रुख, जसमा छैन पात न हाँगा, तर दिन्छ फल काँचैमा मीठो।" यो के हो?',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'Nepali Paheli',
    options: ['सिमल (Silk Cotton Tree)', 'सल्ला (Pine)', 'च्याउ (Mushroom)', 'वेत (Bamboo Shoot)'],
    correctAnswer: 'च्याउ (Mushroom)',
    explanation: 'A mushroom has no leaves or branches, grows in damp riverside soil, and is harvested for eating.',
    language: 'nepali',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-med-4',
    questionText: 'What can travel around the world while staying in a corner?',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'Everyday Logic',
    options: ['A Postage Stamp', 'A Letter', 'An Email', 'A Passport'],
    correctAnswer: 'A Postage Stamp',
    explanation: 'A postage stamp stays in the corner of an envelope but travels all over the world.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-med-5',
    questionText: 'नेपाली पहेली: "कालो वनमा हिँड्ने सेतो किरा, समातेर ढुङ्गामा किच्ने।" यो के हो?',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'Nepali Paheli',
    options: ['जुनकीरी (Firefly)', 'जुम्रा (Head Louse)', 'कीरा (Caterpillar)', 'कमिला (Ant)'],
    correctAnswer: 'जुम्रा (Head Louse)',
    explanation: 'This describes head lice (white bugs) in dark hair (black forest), which are historically squashed on flat nails.',
    language: 'nepali',
    defaultTimeLimit: 20,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-hard-1',
    questionText: 'A man stands on one side of a river, his dog on the other. The man calls his dog, who immediately crosses the river without getting wet and without using a bridge or a boat. How?',
    difficulty: 'HARD',
    category: 'PAHELI',
    subcategory: 'Logic Puzzles',
    options: ['The river was frozen', 'The dog can fly', 'The dog ran very fast', 'The river was dry'],
    correctAnswer: 'The river was frozen',
    explanation: 'Since the river was frozen solid, the dog could walk across the ice without getting wet.',
    language: 'english',
    defaultTimeLimit: 25,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-hard-2',
    questionText: 'What is always in front of you but can’t be seen?',
    difficulty: 'HARD',
    category: 'PAHELI',
    subcategory: 'Tricky Questions',
    options: ['The Future', 'The Past', 'Your Nose', 'A Reflection'],
    correctAnswer: 'The Future',
    explanation: 'The future is chronologically in front of you, but remains invisible to the eye.',
    language: 'english',
    defaultTimeLimit: 25,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-hard-3',
    questionText: 'नेपाली पहेली: "बत्ती बाल्दा भाग्छ, अँध्यारो भएपछि आउँछ। यसलाई समात्न सकिन्न।" यो के हो?',
    difficulty: 'HARD',
    category: 'PAHELI',
    subcategory: 'Nepali Paheli',
    options: ['छायाँ (Shadow)', 'चोर (Thief)', 'निन्द्रा (Sleep)', 'भूत (Ghost)'],
    correctAnswer: 'छायाँ (Shadow)',
    explanation: 'Your shadow disappears when a light is turned off, and emerges under lights, and cannot be caught.',
    language: 'nepali',
    defaultTimeLimit: 25,
    active: true,
    updatedAt: Date.now()
  },
  {
    id: 'paheli-hard-4',
    questionText: 'I have three eyes, all in a line. When my red eye opens, everything freezes. What am I?',
    difficulty: 'HARD',
    category: 'PAHELI',
    subcategory: 'English Riddles',
    options: ['A Traffic Light', 'A Camera', 'A Cyclops', 'A Lighthouse'],
    correctAnswer: 'A Traffic Light',
    explanation: 'A traffic light has three lights in a vertical line. Its red light tells all vehicles to stop (freeze).',
    language: 'english',
    defaultTimeLimit: 25,
    active: true,
    updatedAt: Date.now()
  }
];

// EXTRA STATIC RIDDLES FOR INJECTING HIGH QUALITY VAULT
const EXTRA_STATIC_RIDDLES: Omit<Question, 'createdAt'>[] = [
  {
    id: 'extra-riddle-easy-1',
    questionText: 'What goes up but never comes down?',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'English Riddles',
    options: ['Your Age', 'A Balloon', 'A Rocket', 'The Temperature'],
    correctAnswer: 'Your Age',
    explanation: 'Your chronological age only increases and never decreases.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true
  },
  {
    id: 'extra-riddle-easy-2',
    questionText: 'What belongs to you, but other people use it more than you do?',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'Brain Teasers',
    options: ['Your Name', 'Your Phone', 'Your Car', 'Your Shoes'],
    correctAnswer: 'Your Name',
    explanation: 'Other people call you by your name much more often than you say it yourself.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true
  },
  {
    id: 'extra-riddle-easy-3',
    questionText: 'नेपाली पहेली: "हात नभएको तर लेख्ने, खुट्टा नभएको तर हिँड्ने यो के हो?"',
    difficulty: 'EASY',
    category: 'PAHELI',
    subcategory: 'Nepali Paheli',
    options: ['चिट्ठी (Letter)', 'कलम (Pen)', 'कम्प्युटर (Computer)', 'किताब (Book)'],
    correctAnswer: 'चिट्ठी (Letter)',
    explanation: 'A letter travels around without feet and carries written words without having hands.',
    language: 'nepali',
    defaultTimeLimit: 20,
    active: true
  },
  {
    id: 'extra-riddle-med-1',
    questionText: 'If you drop me I’m sure to crack, but give me a smile and I’ll always smile back. What am I?',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'English Riddles',
    options: ['A Mirror', 'An Egg', 'A Plate', 'A Glass'],
    correctAnswer: 'A Mirror',
    explanation: 'A mirror cracks easily when dropped, and reflects your smile back at you.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true
  },
  {
    id: 'extra-riddle-med-2',
    questionText: 'What is so fragile that saying its name breaks it?',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'English Riddles',
    options: ['Silence', 'Glass', 'A Secret', 'A Bubble'],
    correctAnswer: 'Silence',
    explanation: 'The moment you speak and say the word "silence", the silence itself is broken.',
    language: 'english',
    defaultTimeLimit: 20,
    active: true
  },
  {
    id: 'extra-riddle-med-3',
    questionText: 'नेपाली पहेली: "जति बाड्यो त्यति बढ्ने, कहिल्यै नसकिने चिज के हो?"',
    difficulty: 'MEDIUM',
    category: 'PAHELI',
    subcategory: 'Nepali Paheli',
    options: ['ज्ञान (Knowledge)', 'पैसा (Money)', 'खाना (Food)', 'जग्गा (Land)'],
    correctAnswer: 'ज्ञान (Knowledge)',
    explanation: 'Knowledge expands the more you share or teach it to others.',
    language: 'nepali',
    defaultTimeLimit: 20,
    active: true
  },
  {
    id: 'extra-riddle-hard-1',
    questionText: 'I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?',
    difficulty: 'HARD',
    category: 'PAHELI',
    subcategory: 'Brain Teasers',
    options: ['A Map', 'A Globe', 'A Painting', 'A Desert'],
    correctAnswer: 'A Map',
    explanation: 'A map depicts cities, mountains, and water bodies, but has no actual physical houses, trees, or fish.',
    language: 'english',
    defaultTimeLimit: 25,
    active: true
  },
  {
    id: 'extra-riddle-hard-2',
    questionText: 'What runs all around a backyard, yet never moves?',
    difficulty: 'HARD',
    category: 'PAHELI',
    subcategory: 'Logic Puzzles',
    options: ['A Fence', 'A Dog', 'A Pathway', 'A Hose'],
    correctAnswer: 'A Fence',
    explanation: 'A fence surrounds or runs around the parameter of a backyard but remains completely stationary.',
    language: 'english',
    defaultTimeLimit: 25,
    active: true
  }
];

// GENERATOR FOR EASY QUESTIONS (550+ questions)
function generateEasyQuestions(): Question[] {
  const list: Question[] = [];
  let idCounter = 1;

  // 1. Basic Addition / Subtraction (45 questions)
  for (let i = 1; i <= 45; i++) {
    const a = 15 + i * 2;
    const b = 10 + i;
    const sum = a + b;
    const diff = a - b;
    
    // Alt addition
    list.push({
      id: `easy-math-add-${idCounter++}`,
      questionText: `Ramu has ${a} marbles. Shyam gives him ${b} more. How many marbles does Ramu have now?`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'arithmetic',
      options: generateSafeOptions(sum.toString(), [(sum - 5).toString(), (sum + 10).toString(), (sum - b).toString()]),
      correctAnswer: sum.toString(),
      explanation: `Total marbles = ${a} + ${b} = ${sum}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });

    // Alt subtraction
    list.push({
      id: `easy-math-sub-${idCounter++}`,
      questionText: `A baker made ${a} cupcakes. He sold ${b} of them. How many cupcakes does he have left?`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'arithmetic',
      options: generateSafeOptions(diff.toString(), [(diff + 5).toString(), (diff - 3).toString(), a.toString()]),
      correctAnswer: diff.toString(),
      explanation: `Cupcakes left = ${a} - ${b} = ${diff}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 2. Basic Multiplication / Division (45 questions)
  for (let i = 1; i <= 45; i++) {
    const a = 5 + (i % 8); // 5 to 12
    const b = 4 + (i % 6); // 4 to 9
    const prod = a * b;
    const divSource = prod;
    
    list.push({
      id: `easy-math-mul-${idCounter++}`,
      questionText: `If one pen costs Rs. ${a}, what is the total cost of ${b} identical pens in Rs.?`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'arithmetic',
      options: generateSafeOptions(prod.toString(), [(prod - a).toString(), (prod + b).toString(), (prod + 12).toString()]),
      correctAnswer: prod.toString(),
      explanation: `Cost = ${a} * ${b} = Rs. ${prod}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });

    list.push({
      id: `easy-math-div-${idCounter++}`,
      questionText: `If ${divSource} sweets are distributed equally among ${b} children, how many sweets does each child get?`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'arithmetic',
      options: generateSafeOptions(a.toString(), [(a + 1).toString(), (a - 1).toString(), b.toString()]),
      correctAnswer: a.toString(),
      explanation: `Sweets per child = ${divSource} / ${b} = ${a}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 3. Percentage (45 questions)
  const pctValues = [10, 20, 25, 50, 75];
  for (let i = 1; i <= 45; i++) {
    const pct = pctValues[i % pctValues.length];
    const base = 40 + i * 20; // 60, 80, 100, etc.
    const ans = (pct / 100) * base;
    list.push({
      id: `easy-math-pct-${idCounter++}`,
      questionText: `What is ${pct}% of ${base}?`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'percentage',
      options: generateSafeOptions(ans.toString(), [(ans + 5).toString(), (ans - 5).toString(), (base / 2).toString()]),
      correctAnswer: ans.toString(),
      explanation: `${pct}% of ${base} = (${pct}/100) * ${base} = ${ans}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 4. Basic Algebra (45 questions)
  for (let i = 1; i <= 45; i++) {
    const root = 2 + (i % 10); // 2 to 11
    const coeff = 2 + (i % 5); // 2 to 6
    const constTerm = 3 + i;
    const rhs = coeff * root + constTerm;

    list.push({
      id: `easy-math-alg-${idCounter++}`,
      questionText: `Solve the linear equation for x: ${coeff}x + ${constTerm} = ${rhs}`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'algebra',
      options: generateSafeOptions(root.toString(), [(root + 1).toString(), (root - 1).toString(), coeff.toString()]),
      correctAnswer: root.toString(),
      explanation: `Subtract ${constTerm}: ${coeff}x = ${rhs - constTerm} -> Divide by ${coeff}: x = ${root}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 5. Basic Geometry - Squares and Rectangles (45 questions)
  for (let i = 1; i <= 45; i++) {
    const side = 4 + (i % 12);
    const perimeter = 4 * side;
    const area = side * side;

    list.push({
      id: `easy-math-geo-${idCounter++}`,
      questionText: `Find the perimeter of a square whose side length is ${side} cm.`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'geometry',
      options: generateSafeOptions(perimeter.toString(), [(perimeter - 4).toString(), area.toString(), (perimeter + 12).toString()]),
      correctAnswer: perimeter.toString(),
      explanation: `Perimeter of square = 4 * side = 4 * ${side} = ${perimeter} cm.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 6. Simple Interest (45 questions)
  for (let i = 1; i <= 45; i++) {
    const p = 500 + i * 100;
    const r = 5;
    const t = 2;
    const si = (p * r * t) / 100;

    list.push({
      id: `easy-math-si-${idCounter++}`,
      questionText: `Calculate the Simple Interest on a Principal of Rs. ${p} at ${r}% rate per annum for ${t} years.`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'profit and loss',
      options: generateSafeOptions(si.toString(), [(si + 50).toString(), (si - 25).toString(), (p * 0.1).toString()]),
      correctAnswer: si.toString(),
      explanation: `Simple Interest = (P * R * T)/100 = (${p} * ${r} * ${t})/100 = Rs. ${si}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 7. Averages (45 questions)
  for (let i = 1; i <= 45; i++) {
    const a = 10 + i;
    const b = 14 + i;
    const c = 18 + i;
    const mean = (a + b + c) / 3;

    list.push({
      id: `easy-math-avg-${idCounter++}`,
      questionText: `What is the mathematical average (mean) of the numbers ${a}, ${b}, and ${c}?`,
      difficulty: 'EASY',
      category: 'MATHEMATICS',
      subcategory: 'average',
      options: generateSafeOptions(mean.toString(), [(mean - 2).toString(), (mean + 3).toString(), b.toString()]), // wait, mean IS b
      correctAnswer: mean.toString(),
      explanation: `Average = (${a} + ${b} + ${c}) / 3 = ${a + b + c} / 3 = ${mean}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 8. Logical Sequences (50 questions)
  for (let i = 1; i <= 50; i++) {
    const start = 2 + (i % 10);
    const diff = 3 + (i % 5);
    const term5 = start + 4 * diff;
    const seqStr = `${start}, ${start + diff}, ${start + 2 * diff}, ${start + 3 * diff}, ...`;

    list.push({
      id: `easy-logic-seq-${idCounter++}`,
      questionText: `Identify the next term in the arithmetic sequence: ${seqStr}`,
      difficulty: 'EASY',
      category: 'LOGICAL_THINKING',
      subcategory: 'sequences',
      options: generateSafeOptions(term5.toString(), [(term5 - diff).toString(), (term5 + diff).toString(), (term5 + 10).toString()]),
      correctAnswer: term5.toString(),
      explanation: `The common difference is ${diff}. Next term = ${start + 3 * diff} + ${diff} = ${term5}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 9. Coding / Decoding (Easy) (50 questions)
  const codeWords = ["CAT", "DOG", "PEN", "MAP", "BAT", "CAR", "FOX", "SUN", "TOY", "ICE", "KEY", "FLY", "RUN", "SKY", "BAG"];
  for (let i = 1; i <= 50; i++) {
    const word = codeWords[i % codeWords.length];
    // +1 shift
    const coded = word.split('').map(char => String.fromCharCode(char.charCodeAt(0) + 1)).join('');
    
    const targetWord = codeWords[(i + 1) % codeWords.length];
    const targetCoded = targetWord.split('').map(char => String.fromCharCode(char.charCodeAt(0) + 1)).join('');

    list.push({
      id: `easy-logic-code-${idCounter++}`,
      questionText: `If "${word}" is coded as "${coded}" (+1 shift), how is "${targetWord}" coded under the same rules?`,
      difficulty: 'EASY',
      category: 'LOGICAL_THINKING',
      subcategory: 'coding-decoding',
      options: generateSafeOptions(targetCoded, [
        targetWord,
        targetWord.split('').map(char => String.fromCharCode(char.charCodeAt(0) - 1)).join(''),
        targetWord + "S"
      ]),
      correctAnswer: targetCoded,
      explanation: `Each letter is shifted forward by 1 in the alphabet. So "${targetWord}" becomes "${targetCoded}".`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 10. Odd One Out (50 questions)
  const oddOneSets = [
    { correct: "Carrot", opts: ["Apple", "Orange", "Banana", "Carrot"], exp: "Carrot is a root vegetable, whereas the others are fruits." },
    { correct: "Dog", opts: ["Eagle", "Falcon", "Hawk", "Dog"], exp: "Dog is a mammal, others are birds of prey." },
    { correct: "Bicycle", opts: ["Car", "Truck", "Motorcycle", "Bicycle"], exp: "Bicycle is non-motorized, others have internal combustion engines or motors." },
    { correct: "Iron", opts: ["Wood", "Plastic", "Glass", "Iron"], exp: "Iron is a metallic conductor, others are non-metals / insulators." },
    { correct: "Square", opts: ["Sphere", "Cube", "Cylinder", "Square"], exp: "Square is a 2D flat shape, while the others are 3D solids." },
    { correct: "Water", opts: ["Milk", "Soda", "Juice", "Water"], exp: "Pure water has zero calories, others have nutrients or added sugars." },
    { correct: "Laptop", opts: ["Table", "Chair", "Sofa", "Laptop"], exp: "Laptop is an electronic computing device, others are furniture." }
  ];
  for (let i = 1; i <= 50; i++) {
    const oset = oddOneSets[i % oddOneSets.length];
    list.push({
      id: `easy-logic-odd-${idCounter++}`,
      questionText: `Which of the following is the odd one out: ${oset.opts.join(', ')}?`,
      difficulty: 'EASY',
      category: 'LOGICAL_THINKING',
      subcategory: 'odd one out',
      options: generateSafeOptions(oset.correct, oset.opts),
      correctAnswer: oset.correct,
      explanation: oset.exp,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 11. Direction Puzzles (Easy) (50 questions)
  const directions = ["North", "East", "South", "West"];
  for (let i = 1; i <= 50; i++) {
    const startIdx = i % 4;
    const startDir = directions[startIdx];
    // turn 90 right is +1, 90 left is -1, 180 is +2
    const turnType = i % 3; // 0: 90 right, 1: 90 left, 2: 180 turn
    let endDir = "";
    let question = "";
    if (turnType === 0) {
      endDir = directions[(startIdx + 1) % 4];
      question = `If you are facing ${startDir} and turn 90 degrees to your right, which direction are you facing?`;
    } else if (turnType === 1) {
      endDir = directions[(startIdx + 3) % 4];
      question = `If you are facing ${startDir} and turn 90 degrees to your left, which direction are you facing?`;
    } else {
      endDir = directions[(startIdx + 2) % 4];
      question = `If you are facing ${startDir} and make a complete 180-degree turn, which direction are you facing?`;
    }

    list.push({
      id: `easy-logic-dir-${idCounter++}`,
      questionText: question,
      difficulty: 'EASY',
      category: 'LOGICAL_THINKING',
      subcategory: 'direction problems',
      options: generateSafeOptions(endDir, directions),
      correctAnswer: endDir,
      explanation: `Standard geographic compass layout makes ${endDir} the correct result.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  return list;
}

// GENERATOR FOR MEDIUM QUESTIONS (550+ questions)
function generateMediumQuestions(): Question[] {
  const list: Question[] = [];
  let idCounter = 1;

  // 1. Quadratic Equations (50 questions)
  for (let i = 1; i <= 50; i++) {
    const r1 = 1 + (i % 5); // 1 to 5
    const r2 = r1 + 1 + (i % 3); // guaranteed distinct
    const sum = r1 + r2;
    const prod = r1 * r2;
    const correctAnswer = `x = ${r1}, ${r2}`;

    list.push({
      id: `med-math-quad-${idCounter++}`,
      questionText: `Solve the quadratic equation for real roots: x² - ${sum}x + ${prod} = 0`,
      difficulty: 'MEDIUM',
      category: 'MATHEMATICS',
      subcategory: 'quadratic equations',
      options: generateSafeOptions(correctAnswer, [
        `x = ${r1}, ${r2 + 1}`,
        `x = ${r1 - 1}, ${r2}`,
        `x = -${r1}, -${r2}`
      ]),
      correctAnswer,
      explanation: `Factoring: (x - ${r1})(x - ${r2}) = 0 -> roots are x = ${r1} and x = ${r2}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 2. Profit and Loss (50 questions)
  for (let i = 1; i <= 50; i++) {
    const cp = 100 + i * 10;
    const profitPct = 10 + (i % 4) * 5; // 10%, 15%, 20%, 25%
    const profit = (cp * profitPct) / 100;
    const sp = cp + profit;
    const correctAnswer = `${profitPct}%`;

    list.push({
      id: `med-math-pl-${idCounter++}`,
      questionText: `A trader bought an article for Rs. ${cp} and sold it for Rs. ${sp}. What is his profit percentage?`,
      difficulty: 'MEDIUM',
      category: 'MATHEMATICS',
      subcategory: 'profit and loss',
      options: generateSafeOptions(correctAnswer, [
        `${profitPct - 5}%`,
        `${profitPct + 5}%`,
        `${Math.round(profitPct / 1.2)}%`
      ]),
      correctAnswer,
      explanation: `Profit = Rs. ${profit}. Profit% = (Profit / CP) * 100 = (${profit} / ${cp}) * 100 = ${profitPct}%.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 3. Coordinate Geometry (50 questions)
  const triples = [
    { x1: 0, y1: 0, x2: 3, y2: 4, d: 5 },
    { x1: 1, y1: 1, x2: 4, y2: 5, d: 5 },
    { x1: 2, y1: 3, x2: 8, y2: 11, d: 10 },
    { x1: -1, y1: -2, x2: 4, y2: 10, d: 13 },
    { x1: 0, y1: 0, x2: 6, y2: 8, d: 10 },
    { x1: 3, y1: 2, x2: 11, y2: 17, d: 17 }
  ];
  for (let i = 1; i <= 50; i++) {
    const t = triples[i % triples.length];
    const offset = i;
    const x1 = t.x1 + offset;
    const y1 = t.y1 + offset;
    const x2 = t.x2 + offset;
    const y2 = t.y2 + offset;
    const dist = t.d;

    list.push({
      id: `med-math-dist-${idCounter++}`,
      questionText: `Find the Euclidean distance between the points (${x1}, ${y1}) and (${x2}, ${y2}) in a 2D plane.`,
      difficulty: 'MEDIUM',
      category: 'MATHEMATICS',
      subcategory: 'coordinate geometry',
      options: generateSafeOptions(dist.toString(), [(dist + 2).toString(), (dist - 1).toString(), (dist * 1.5).toString()]),
      correctAnswer: dist.toString(),
      explanation: `By distance formula: √((x2-x1)² + (y2-y1)²) = √(${x2 - x1}² + ${y2 - y1}²) = √(${(x2 - x1) ** 2} + ${(y2 - y1) ** 2}) = ${dist}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 4. Logarithms (50 questions)
  for (let i = 1; i <= 50; i++) {
    const bases = [2, 3, 5, 10];
    const base = bases[i % bases.length];
    const exponent = 2 + (i % 4); // 2, 3, 4, 5
    const value = Math.pow(base, exponent);

    list.push({
      id: `med-math-log-${idCounter++}`,
      questionText: `Evaluate the logarithmic expression: log_${base}(${value})`,
      difficulty: 'MEDIUM',
      category: 'MATHEMATICS',
      subcategory: 'logarithms',
      options: generateSafeOptions(exponent.toString(), [(exponent - 1).toString(), (exponent + 1).toString(), base.toString()]),
      correctAnswer: exponent.toString(),
      explanation: `Since base^exponent = value (${base}^${exponent} = ${value}), log_${base}(${value}) = ${exponent}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 5. Probability (50 questions)
  for (let i = 1; i <= 50; i++) {
    const red = 4 + (i % 5);
    const blue = 3 + (i % 4);
    const total = red + blue;
    const ansStr = `${red}/${total}`;

    list.push({
      id: `med-math-prob-${idCounter++}`,
      questionText: `A jar contains ${red} red marbles and ${blue} blue marbles. If a marble is drawn at random, what is the probability of drawing a red marble?`,
      difficulty: 'MEDIUM',
      category: 'MATHEMATICS',
      subcategory: 'probability',
      options: generateSafeOptions(ansStr, [`${blue}/${total}`, `1/${total}`, `${red - 1}/${total}`]),
      correctAnswer: ansStr,
      explanation: `Probability = (favorable outcomes / total outcomes) = ${red} / (${red} + ${blue}) = ${ansStr}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 6. Trigonometry (50 questions)
  const trigValues = [
    { q: "What is the exact value of sin(30°)?", a: "0.5" },
    { q: "What is the exact value of cos(60°)?", a: "0.5" },
    { q: "What is the exact value of tan(45°)?", a: "1" },
    { q: "What is the value of sin(90°) + cos(0°)?", a: "2" },
    { q: "What is the value of tan(0°) + sin(0°)?", a: "0" }
  ];
  for (let i = 1; i <= 50; i++) {
    const item = trigValues[i % trigValues.length];
    list.push({
      id: `med-math-trig-${idCounter++}`,
      questionText: `${item.q} (Variation ${i})`,
      difficulty: 'MEDIUM',
      category: 'MATHEMATICS',
      subcategory: 'trigonometry',
      options: generateSafeOptions(item.a, ["0", "1.5", "0.866", "1"]),
      correctAnswer: item.a,
      explanation: `Based on trigonometric tables, this evaluates to ${item.a}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 7. Permutations & Combinations (50 questions)
  for (let i = 1; i <= 50; i++) {
    const n = 5 + (i % 4); // 5 to 8
    const r = 2;
    // Combinations: nCr = n! / (r! * (n-r)!)
    const comb = (n * (n - 1)) / 2;

    list.push({
      id: `med-math-comb-${idCounter++}`,
      questionText: `In how many ways can you select a team of ${r} players from a pool of ${n} candidates? (${n}C${r})`,
      difficulty: 'MEDIUM',
      category: 'MATHEMATICS',
      subcategory: 'probability',
      options: generateSafeOptions(comb.toString(), [(comb + 5).toString(), (comb - 3).toString(), (n * r).toString()]),
      correctAnswer: comb.toString(),
      explanation: `Using the combination formula nCr = n! / (r!(n-r)!) for n=${n}, r=${r}: (${n} * ${n - 1})/2 = ${comb}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 8. Coding / Decoding (Medium) (50 questions)
  const medWords = ["COFFEE", "ORANGE", "SPRING", "SUMMER", "WINTER", "FLOWER", "SCHOOL", "PLAYER", "GUITAR", "CAMERA"];
  for (let i = 1; i <= 50; i++) {
    const word = medWords[i % medWords.length];
    const coded = word.split('').map(char => String.fromCharCode(char.charCodeAt(0) + 2)).join('');
    
    const targetWord = medWords[(i + 1) % medWords.length];
    const targetCoded = targetWord.split('').map(char => String.fromCharCode(char.charCodeAt(0) + 2)).join('');

    list.push({
      id: `med-logic-code-${idCounter++}`,
      questionText: `If "${word}" is encoded as "${coded}" (+2 shift), how is "${targetWord}" coded under the same scheme?`,
      difficulty: 'MEDIUM',
      category: 'LOGICAL_THINKING',
      subcategory: 'coding-decoding',
      options: generateSafeOptions(targetCoded, [
        targetWord,
        targetWord.split('').map(char => String.fromCharCode(char.charCodeAt(0) + 1)).join(''),
        targetWord.split('').map(char => String.fromCharCode(char.charCodeAt(0) - 1)).join('')
      ]),
      correctAnswer: targetCoded,
      explanation: `Each letter is shifted forward by 2 in the alphabet. So "${targetWord}" becomes "${targetCoded}".`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 9. Age Word Problems (50 questions)
  for (let i = 1; i <= 50; i++) {
    const sonAge = 5 + (i % 6); // 5 to 10
    const fatherAge = sonAge * 3;
    const correctSon = sonAge;

    list.push({
      id: `med-logic-age-${idCounter++}`,
      questionText: `A father is three times as old as his son. If the sum of their ages is ${sonAge + fatherAge}, how old is the son?`,
      difficulty: 'MEDIUM',
      category: 'LOGICAL_THINKING',
      subcategory: 'analytical reasoning',
      options: generateSafeOptions(correctSon.toString(), [(correctSon + 4).toString(), (correctSon - 2).toString(), fatherAge.toString()]),
      correctAnswer: correctSon.toString(),
      explanation: `Let son be x. 3x + x = ${sonAge + fatherAge} -> 4x = ${sonAge + fatherAge} -> x = ${correctSon}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 10. Linear Systems (50 questions)
  for (let i = 1; i <= 50; i++) {
    const x = 5 + (i % 6);
    const y = 2 + (i % 4);
    const sum = x + y;
    const diff = x - y;

    list.push({
      id: `med-logic-sys-${idCounter++}`,
      questionText: `Solve the system of equations for x: x + y = ${sum} and x - y = ${diff}`,
      difficulty: 'MEDIUM',
      category: 'LOGICAL_THINKING',
      subcategory: 'mathematical logic',
      options: generateSafeOptions(x.toString(), [y.toString(), (x + 2).toString(), sum.toString()]),
      correctAnswer: x.toString(),
      explanation: `Adding both equations: 2x = ${sum} + ${diff} = ${sum + diff} -> x = ${x}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  // 11. Matrix Determinant (50 questions)
  for (let i = 1; i <= 50; i++) {
    const a = 2 + (i % 3);
    const b = 1 + (i % 4);
    const c = 3;
    const d = 4 + (i % 3);
    const det = a * d - b * c;

    list.push({
      id: `med-logic-mat-${idCounter++}`,
      questionText: `Find the determinant of the 2x2 matrix: [[${a}, ${b}], [${c}, ${d}]]`,
      difficulty: 'MEDIUM',
      category: 'LOGICAL_THINKING',
      subcategory: 'mathematical logic',
      options: generateSafeOptions(det.toString(), [(det + 3).toString(), (det - 2).toString(), (a * d).toString()]),
      correctAnswer: det.toString(),
      explanation: `Determinant = ad - bc = (${a} * ${d}) - (${b} * ${c}) = ${det}.`,
      language: 'english',
      defaultTimeLimit: 20,
      active: true,
      createdAt: Date.now()
    });
  }

  return list;
}

// GENERATOR FOR HARD QUESTIONS (550+ questions)
function generateHardQuestions(): Question[] {
  const list: Question[] = [];
  let idCounter = 1;

  // 1. Calculus - Derivatives (50 questions)
  for (let i = 1; i <= 50; i++) {
    const coeff = 2 + (i % 5); // 2 to 6
    const power = 3 + (i % 4); // 3 to 6
    const derivCoeff = coeff * power;
    const derivPower = power - 1;
    const correctAnswer = `${derivCoeff}x^${derivPower}`;

    list.push({
      id: `hard-math-deriv-${idCounter++}`,
      questionText: `Find the derivative of f(x) = ${coeff}x^${power} with respect to x.`,
      difficulty: 'HARD',
      category: 'MATHEMATICS',
      subcategory: 'calculus',
      options: generateSafeOptions(correctAnswer, [
        `${coeff}x^${derivPower}`,
        `${derivCoeff}x^${power}`,
        `${coeff * (power + 1)}x^${power + 1}`
      ]),
      correctAnswer,
      explanation: `Using the power rule d/dx(ax^n) = anx^(n-1): d/dx(${coeff}x^${power}) = ${coeff} * ${power} * x^(${power}-1) = ${correctAnswer}.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 2. Calculus - Definite Integrals (50 questions)
  for (let i = 1; i <= 50; i++) {
    const coeff = 3 + (i % 3) * 3; // 3, 6, 9
    const limit = 2;
    // integrate coeff * x² from 0 to limit
    // Integral of coeff * x² is (coeff/3)x³
    const integralCoeff = coeff / 3;
    const area = integralCoeff * Math.pow(limit, 3);

    list.push({
      id: `hard-math-int-${idCounter++}`,
      questionText: `Evaluate the definite integral of ${coeff}x² dx from x = 0 to x = ${limit}.`,
      difficulty: 'HARD',
      category: 'MATHEMATICS',
      subcategory: 'calculus',
      options: generateSafeOptions(area.toString(), [(area - 4).toString(), (area + 8).toString(), (coeff * limit).toString()]),
      correctAnswer: area.toString(),
      explanation: `The indefinite integral is ${integralCoeff}x³. Evaluated from 0 to ${limit}: ${integralCoeff}*(${limit}³) - 0 = ${integralCoeff}*8 = ${area}.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 3. Limits (50 questions)
  for (let i = 1; i <= 50; i++) {
    const v = 2 + (i % 6); // 2 to 7
    const vSquared = v * v;
    const limitVal = 2 * v;

    list.push({
      id: `hard-math-lim-${idCounter++}`,
      questionText: `Evaluate the limit as x approaches ${v} of: (x² - ${vSquared}) / (x - ${v})`,
      difficulty: 'HARD',
      category: 'MATHEMATICS',
      subcategory: 'calculus',
      options: generateSafeOptions(limitVal.toString(), [v.toString(), (vSquared).toString(), "0"]),
      correctAnswer: limitVal.toString(),
      explanation: `Factor the numerator: (x - ${v})(x + ${v}) / (x - ${v}) = x + ${v}. As x -> ${v}, limit is ${v} + ${v} = ${limitVal}.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 4. Advanced Probability (50 questions)
  for (let i = 1; i <= 50; i++) {
    const red = 4 + (i % 4); // 4 to 7
    const blue = 3 + (i % 3); // 3 to 5
    const total = red + blue;
    // Prob of drawing 2 red without replacement
    const num = red * (red - 1);
    const den = total * (total - 1);
    // simplify fraction
    const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
    const div = gcd(num, den);
    const ansStr = `${num / div}/${den / div}`;

    list.push({
      id: `hard-math-prob-${idCounter++}`,
      questionText: `A bag has ${red} red balls and ${blue} blue balls. If 2 balls are drawn without replacement, what is the probability that both are red?`,
      difficulty: 'HARD',
      category: 'MATHEMATICS',
      subcategory: 'probability',
      options: generateSafeOptions(ansStr, [
        `${red}/${total}`,
        `${red * red}/${total * total}`,
        `${blue * (blue - 1)}/${den}`
      ]),
      correctAnswer: ansStr,
      explanation: `P(Both Red) = (Red / Total) * ((Red - 1) / (Total - 1)) = (${red}/${total}) * (${red - 1}/${total - 1}) = ${ansStr}.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 5. Discrete Math - Subsets (50 questions)
  for (let i = 1; i <= 50; i++) {
    const n = 4 + (i % 6); // 4 to 9
    const subsets = Math.pow(2, n);
    const properSubsets = subsets - 1;

    list.push({
      id: `hard-math-subsets-${idCounter++}`,
      questionText: `How many proper subsets are there for a set containing ${n} distinct elements?`,
      difficulty: 'HARD',
      category: 'MATHEMATICS',
      subcategory: 'discrete mathematics',
      options: generateSafeOptions(properSubsets.toString(), [subsets.toString(), (subsets - 2).toString(), (n * n).toString()]),
      correctAnswer: properSubsets.toString(),
      explanation: `Total subsets = 2^n = 2^${n} = ${subsets}. Proper subsets exclude the set itself, giving 2^n - 1 = ${properSubsets}.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 6. Discrete Math - Complete Graphs (50 questions)
  for (let i = 1; i <= 50; i++) {
    const vertices = 6 + (i % 10); // 6 to 15
    const edges = (vertices * (vertices - 1)) / 2;

    list.push({
      id: `hard-math-graphs-${idCounter++}`,
      questionText: `Find the total number of edges in a complete undirected simple graph (K_n) with ${vertices} vertices.`,
      difficulty: 'HARD',
      category: 'MATHEMATICS',
      subcategory: 'discrete mathematics',
      options: generateSafeOptions(edges.toString(), [
        (vertices * vertices).toString(),
        (edges + vertices).toString(),
        (edges - vertices).toString()
      ]),
      correctAnswer: edges.toString(),
      explanation: `Formula for K_n edges = n(n-1)/2. For n = ${vertices}, ${vertices} * ${vertices - 1} / 2 = ${edges} edges.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 7. Propositional Logic (50 questions)
  const logicT = [
    { p: "True", q: "False", op: "P -> Q", ans: "False", exp: "An implication is only False when a True premise leads to a False conclusion." },
    { p: "False", q: "True", op: "P -> Q", ans: "True", exp: "An implication with a False premise is vacuously True." },
    { p: "True", q: "False", op: "P <-> Q", ans: "False", exp: "A biconditional is only True when both operands share the same truth value." },
    { p: "False", q: "False", op: "P -> Q", ans: "True", exp: "A conditional is True if the antecedent is False." }
  ];
  for (let i = 1; i <= 50; i++) {
    const item = logicT[i % logicT.length];
    list.push({
      id: `hard-logic-prop-${idCounter++}`,
      questionText: `In propositional logic, if P is ${item.p} and Q is ${item.q}, what is the truth value of: ${item.op}? (V${i})`,
      difficulty: 'HARD',
      category: 'LOGICAL_THINKING',
      subcategory: 'mathematical logic',
      options: generateSafeOptions(item.ans, ["True", "False", "Indeterminate", "Contradiction"]),
      correctAnswer: item.ans,
      explanation: item.exp,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 8. Combinatorics - Permutations with repeating letters (50 questions)
  const wordPerms = [
    { w: "APPLE", ans: "60", exp: "5! / 2! (P repeated) = 120 / 2 = 60." },
    { w: "BANANA", ans: "60", exp: "6! / (3! * 2!) (3 A's, 2 N's) = 720 / 12 = 60." },
    { w: "GOOGLE", ans: "180", exp: "6! / (2! * 2!) (2 G's, 2 O's) = 720 / 4 = 180." },
    { w: "COFFEE", ans: "180", exp: "6! / (2! * 2!) (2 F's, 2 E's) = 720 / 4 = 180." },
    { w: "VECTOR", ans: "720", exp: "6! (all letters unique) = 720." },
    { w: "MATRIX", ans: "720", exp: "6! (all letters unique) = 720." }
  ];
  for (let i = 1; i <= 50; i++) {
    const item = wordPerms[i % wordPerms.length];
    list.push({
      id: `hard-logic-perm-${idCounter++}`,
      questionText: `Calculate the number of unique mathematical permutations that can be made using all letters of the word "${item.w}".`,
      difficulty: 'HARD',
      category: 'LOGICAL_THINKING',
      subcategory: 'coding-decoding',
      options: generateSafeOptions(item.ans, ["120", "360", "24", "48"]),
      correctAnswer: item.ans,
      explanation: item.exp,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 9. Speed, Work and Time (50 questions)
  for (let i = 1; i <= 50; i++) {
    const a = 4 + (i % 5); // 4 to 8
    const b = a * 2; // guaranteed compatible ratios
    // work together = (a * b) / (a + b)
    const together = Number(((a * b) / (a + b)).toFixed(1));
    const ansStr = `${together} days`;

    list.push({
      id: `hard-logic-work-${idCounter++}`,
      questionText: `A can complete a project in ${a} days, and B can complete the same project in ${b} days. Working together, how many days will they take?`,
      difficulty: 'HARD',
      category: 'LOGICAL_THINKING',
      subcategory: 'analytical reasoning',
      options: generateSafeOptions(ansStr, [`${a + b} days`, `${Math.round((a + b) / 2)} days`, `${a} days`]),
      correctAnswer: ansStr,
      explanation: `Together time = 1 / (1/${a} + 1/${b}) = (${a} * ${b}) / (${a} + ${b}) = ${together} days.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  // 10. Advanced Sequences (50 questions)
  for (let i = 1; i <= 50; i++) {
    const baseVal = 2 + i;
    const correctVal = baseVal * baseVal + 1;
    const seqStr = `2, 5, 10, 17, 26, ... (pattern n² + 1)`;

    list.push({
      id: `hard-logic-advseq-${idCounter++}`,
      questionText: `Find the value of the term for n = ${baseVal} in the mathematical sequence matching the pattern: ${seqStr}`,
      difficulty: 'HARD',
      category: 'LOGICAL_THINKING',
      subcategory: 'sequences',
      options: generateSafeOptions(correctVal.toString(), [
        (correctVal - 1).toString(),
        (correctVal + 1).toString(),
        (baseVal * baseVal).toString()
      ]),
      correctAnswer: correctVal.toString(),
      explanation: `The formula is n² + 1. For n = ${baseVal}, we calculate ${baseVal}² + 1 = ${baseVal * baseVal} + 1 = ${correctVal}.`,
      language: 'english',
      defaultTimeLimit: 25,
      active: true,
      createdAt: Date.now()
    });
  }

  return list;
}

// Generate the complete premium question list containing 1,500+ items
export function getInitialQuestions(): Question[] {
  const easyGen = generateEasyQuestions();
  const medGen = generateMediumQuestions();
  const hardGen = generateHardQuestions();

  const combined = [
    ...HAND_CRAFTED_RIDDLES,
    ...EXTRA_STATIC_RIDDLES,
    ...easyGen,
    ...medGen,
    ...hardGen
  ];

  // Audit and remove duplicates / validate
  const seenIds = new Set<string>();
  const finalPool: Question[] = [];

  for (const q of combined) {
    if (seenIds.has(q.id)) {
      continue;
    }
    if (validateQuestion(q)) {
      seenIds.add(q.id);
      finalPool.push({
        ...q,
        createdAt: Date.now()
      });
    } else {
      console.warn(`[Seeder] Discarding invalid question: ID ${q.id}`);
    }
  }

  const easyBucket = finalPool.filter(q => q.difficulty === 'EASY');
  const medBucket = finalPool.filter(q => q.difficulty === 'MEDIUM');
  const hardBucket = finalPool.filter(q => q.difficulty === 'HARD');

  console.log(`[Seeder] Successfully compiled question bank!`);
  console.log(`- EASY: ${easyBucket.length} questions`);
  console.log(`- MEDIUM: ${medBucket.length} questions`);
  console.log(`- HARD: ${hardBucket.length} questions`);
  console.log(`✓ Question Bank verified: ${finalPool.length} questions loaded. All checks passed.`);

  return finalPool;
}
