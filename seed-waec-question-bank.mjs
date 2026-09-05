import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const examCode = "WAEC";
const exam = await db.execute({
  sql: "SELECT id FROM exams WHERE code = ? LIMIT 1",
  args: [examCode],
});
if (!exam.rows[0])
  throw new Error("WAEC exam record is missing; run the subject seed first.");
const examId = Number(exam.rows[0].id);

const questions = [
  {
    subject: "Mathematics",
    topic: "Simultaneous equations",
    difficulty: "easy",
    prompt: "Solve 2x + y = 7 and x − y = 2. What is x?",
    options: ["1", "2", "3", "4"],
    answerIndex: 3,
    explanation: "Adding the equations gives 3x = 9, so x = 3.",
  },
  {
    subject: "Mathematics",
    topic: "Probability",
    difficulty: "medium",
    prompt:
      "A fair die is rolled once. What is the probability of obtaining a prime number?",
    options: ["1/6", "1/3", "1/2", "2/3"],
    answerIndex: 2,
    explanation:
      "The prime outcomes are 2, 3, and 5: three of six outcomes, or 1/2.",
  },
  {
    subject: "English Language",
    topic: "Lexis and structure",
    difficulty: "easy",
    prompt: "Choose the word nearest in meaning to ‘reluctant’.",
    options: ["Unwilling", "Excited", "Careless", "Certain"],
    answerIndex: 0,
    explanation: "Reluctant means unwilling or hesitant to do something.",
  },
  {
    subject: "English Language",
    topic: "Comprehension",
    difficulty: "hard",
    prompt: "In a passage, an author’s ‘tone’ refers mainly to the author’s…",
    options: [
      "Length of sentences",
      "Attitude to the subject",
      "Number of paragraphs",
      "Use of quotations",
    ],
    answerIndex: 1,
    explanation:
      "Tone is the writer’s attitude or emotional stance toward the subject.",
  },
  {
    subject: "Biology",
    topic: "Cell structure",
    difficulty: "easy",
    prompt:
      "Which cell organelle is chiefly responsible for aerobic respiration?",
    options: ["Ribosome", "Nucleus", "Mitochondrion", "Vacuole"],
    answerIndex: 2,
    explanation:
      "Mitochondria release usable energy through aerobic respiration.",
  },
  {
    subject: "Biology",
    topic: "Ecology",
    difficulty: "medium",
    prompt:
      "The first trophic level in a typical grazing food chain is occupied by…",
    options: [
      "Primary consumers",
      "Producers",
      "Decomposers",
      "Secondary consumers",
    ],
    answerIndex: 1,
    explanation: "Green plants are producers and form the first trophic level.",
  },
  {
    subject: "Chemistry",
    topic: "Acids and bases",
    difficulty: "easy",
    prompt: "What colour does blue litmus paper turn in an acidic solution?",
    options: ["Blue", "Green", "Red", "Yellow"],
    answerIndex: 2,
    explanation: "Acids turn blue litmus paper red.",
  },
  {
    subject: "Chemistry",
    topic: "Organic chemistry",
    difficulty: "hard",
    prompt: "The functional group characteristic of alcohols is…",
    options: ["−COOH", "−OH", "−CHO", "−CO−"],
    answerIndex: 1,
    explanation: "Alcohols contain the hydroxyl functional group, −OH.",
  },
  {
    subject: "Physics",
    topic: "Motion",
    difficulty: "medium",
    prompt:
      "A car changes velocity from 10 m/s to 30 m/s in 5 s. What is its acceleration?",
    options: ["2 m/s²", "4 m/s²", "6 m/s²", "8 m/s²"],
    answerIndex: 1,
    explanation:
      "Acceleration is change in velocity divided by time: (30 − 10) / 5 = 4 m/s².",
  },
  {
    subject: "Physics",
    topic: "Electricity",
    difficulty: "hard",
    prompt:
      "Two resistors of 4 Ω and 6 Ω are connected in series. What is their total resistance?",
    options: ["2.4 Ω", "5 Ω", "10 Ω", "24 Ω"],
    answerIndex: 2,
    explanation: "Series resistances add directly: 4 Ω + 6 Ω = 10 Ω.",
  },
  {
    subject: "Economics",
    topic: "Demand and supply",
    difficulty: "easy",
    prompt: "A fall in the price of a normal good generally causes…",
    options: [
      "A contraction of demand",
      "An extension of demand",
      "A decrease in supply",
      "No movement on the demand curve",
    ],
    answerIndex: 1,
    explanation:
      "A lower price causes an extension along the existing demand curve.",
  },
  {
    subject: "Economics",
    topic: "National income",
    difficulty: "hard",
    prompt:
      "Gross domestic product measures the value of final goods and services produced…",
    options: [
      "By citizens anywhere",
      "Within a country’s borders",
      "Only by government firms",
      "Only for export",
    ],
    answerIndex: 1,
    explanation:
      "GDP is based on production within the geographic borders of an economy.",
  },
  {
    subject: "Government",
    topic: "Constitutional development",
    difficulty: "medium",
    prompt: "The principle of separation of powers is intended mainly to…",
    options: [
      "Concentrate authority",
      "Prevent abuse of power",
      "Remove the legislature",
      "Abolish judicial review",
    ],
    answerIndex: 1,
    explanation:
      "Dividing powers among branches creates checks that reduce abuse of authority.",
  },
  {
    subject: "Government",
    topic: "Electoral systems",
    difficulty: "hard",
    prompt:
      "In a first-past-the-post election, the winner is the candidate who…",
    options: [
      "Receives every vote",
      "Has the highest number of votes",
      "Is appointed by the court",
      "Wins a second round automatically",
    ],
    answerIndex: 1,
    explanation:
      "The candidate with more votes than any other candidate wins the constituency.",
  },
  {
    subject: "Geography",
    topic: "Map reading",
    difficulty: "easy",
    prompt: "A map scale of 1:50,000 means 1 cm on the map represents…",
    options: ["50 m", "500 m", "5 km", "50 km"],
    answerIndex: 1,
    explanation: "50,000 cm equals 500 m in the real world.",
  },
  {
    subject: "Geography",
    topic: "Weather and climate",
    difficulty: "medium",
    prompt: "The instrument used to measure atmospheric pressure is a…",
    options: ["Thermometer", "Rain gauge", "Barometer", "Hygrometer"],
    answerIndex: 2,
    explanation: "A barometer measures atmospheric pressure.",
  },
  {
    subject: "Agricultural Science",
    topic: "Soil science",
    difficulty: "easy",
    prompt: "Which soil particle is the largest?",
    options: ["Clay", "Silt", "Fine sand", "Coarse sand"],
    answerIndex: 3,
    explanation:
      "Sand particles are larger than silt and clay; coarse sand is largest here.",
  },
  {
    subject: "Agricultural Science",
    topic: "Farm management",
    difficulty: "medium",
    prompt: "A farm budget is prepared primarily to estimate…",
    options: [
      "Rainfall only",
      "Expected costs and returns",
      "The farmer’s age",
      "The colour of soil",
    ],
    answerIndex: 1,
    explanation:
      "A budget compares expected expenditure with revenue to guide farm decisions.",
  },
  {
    subject: "Computer Science",
    topic: "Algorithms",
    difficulty: "easy",
    prompt:
      "A finite, ordered set of instructions for solving a problem is called an…",
    options: ["Algorithm", "Operand", "Operating system", "Array index"],
    answerIndex: 0,
    explanation:
      "An algorithm is a finite sequence of unambiguous steps for a task.",
  },
  {
    subject: "Computer Science",
    topic: "Data representation",
    difficulty: "hard",
    prompt: "What is the decimal value of the binary number 1011?",
    options: ["9", "10", "11", "12"],
    answerIndex: 2,
    explanation: "1011₂ = 8 + 0 + 2 + 1 = 11.",
  },
  {
    subject: "Financial Accounting",
    topic: "Accounting concepts",
    difficulty: "easy",
    prompt: "The accounting equation is…",
    options: [
      "Assets = Capital − Liabilities",
      "Assets = Liabilities + Capital",
      "Capital = Assets + Liabilities",
      "Liabilities = Assets + Capital",
    ],
    answerIndex: 1,
    explanation: "The basic equation is Assets = Liabilities + Capital.",
  },
  {
    subject: "Financial Accounting",
    topic: "Final accounts",
    difficulty: "medium",
    prompt: "Gross profit is calculated as sales minus…",
    options: [
      "Operating expenses",
      "Cost of goods sold",
      "Drawings",
      "Capital",
    ],
    answerIndex: 1,
    explanation: "Gross profit equals net sales less cost of goods sold.",
  },
  {
    subject: "Civic Education",
    topic: "Human rights",
    difficulty: "easy",
    prompt: "The right to a fair hearing is an example of a…",
    options: [
      "Political party",
      "Fundamental human right",
      "Tax obligation",
      "Census result",
    ],
    answerIndex: 1,
    explanation:
      "Fair hearing is a fundamental legal and human-rights protection.",
  },
  {
    subject: "Civic Education",
    topic: "National values",
    difficulty: "medium",
    prompt: "A citizen demonstrates tolerance by…",
    options: [
      "Respecting different views",
      "Preventing all debate",
      "Ignoring the law",
      "Rejecting every compromise",
    ],
    answerIndex: 0,
    explanation:
      "Tolerance involves respecting differences while maintaining civic responsibility.",
  },
  {
    subject: "Applied Electricity",
    topic: "Circuit fundamentals",
    difficulty: "easy",
    prompt:
      "Which instrument is used to measure electric current in a circuit?",
    options: ["Ammeter", "Voltmeter", "Ohmmeter", "Barometer"],
    answerIndex: 0,
    explanation: "An ammeter measures current in amperes.",
  },
  {
    subject: "Auto Mechanics",
    topic: "Engine systems",
    difficulty: "medium",
    prompt: "The main function of engine oil is to…",
    options: [
      "Increase tyre pressure",
      "Lubricate moving parts",
      "Charge the battery",
      "Cool the radiator fan only",
    ],
    answerIndex: 1,
    explanation:
      "Engine oil reduces friction and helps carry heat and contaminants away from moving parts.",
  },
  {
    subject: "Building Construction",
    topic: "Building materials",
    difficulty: "easy",
    prompt: "Which material is commonly used as a binder in concrete?",
    options: ["Cement", "Glass", "Timber", "Aluminium"],
    answerIndex: 0,
    explanation: "Cement binds the aggregate and water in concrete.",
  },
  {
    subject: "Christian Religious Knowledge",
    topic: "The Gospels",
    difficulty: "easy",
    prompt: "According to the Gospels, who baptized Jesus?",
    options: ["Peter", "John the Baptist", "Paul", "Stephen"],
    answerIndex: 1,
    explanation: "John the Baptist baptized Jesus in the Jordan River.",
  },
  {
    subject: "Clothing and Textile",
    topic: "Textile fibres",
    difficulty: "medium",
    prompt: "Which of these is a natural fibre?",
    options: ["Nylon", "Polyester", "Cotton", "Acrylic"],
    answerIndex: 2,
    explanation:
      "Cotton is a natural plant fibre; the others are manufactured fibres.",
  },
  {
    subject: "Commerce",
    topic: "Trade documents",
    difficulty: "easy",
    prompt: "An invoice is issued mainly to show…",
    options: [
      "Goods sold and their prices",
      "A company’s share capital",
      "The weather forecast",
      "A worker’s attendance",
    ],
    answerIndex: 0,
    explanation:
      "An invoice records the goods or services supplied and the amount due.",
  },
  {
    subject: "Electronics",
    topic: "Electronic components",
    difficulty: "medium",
    prompt: "A diode allows current to flow mainly in…",
    options: [
      "One direction",
      "Every direction equally",
      "No direction",
      "A vacuum only",
    ],
    answerIndex: 0,
    explanation:
      "A diode is a semiconductor device designed for one-way current conduction.",
  },
  {
    subject: "Foods and Nutrition",
    topic: "Food groups",
    difficulty: "easy",
    prompt:
      "Which nutrient is chiefly needed for body building and tissue repair?",
    options: ["Protein", "Water", "Fibre", "Mineral salts only"],
    answerIndex: 0,
    explanation: "Protein supports growth and repairs body tissues.",
  },
  {
    subject: "French",
    topic: "Basic grammar",
    difficulty: "easy",
    prompt: "Choose the correct French translation of ‘I am a student.’",
    options: [
      "Je suis étudiant(e).",
      "Je est étudiant.",
      "Nous suis étudiant.",
      "Tu sommes étudiant.",
    ],
    answerIndex: 0,
    explanation:
      "‘Je suis’ means ‘I am’; étudiant or étudiante depends on the speaker’s gender.",
  },
  {
    subject: "Further Mathematics",
    topic: "Calculus",
    difficulty: "hard",
    prompt: "What is the derivative of x³ with respect to x?",
    options: ["x²", "2x²", "3x²", "3x"],
    answerIndex: 2,
    explanation: "By the power rule, d(xⁿ)/dx = nxⁿ⁻¹, so d(x³)/dx = 3x².",
  },
  {
    subject: "Health Science",
    topic: "Personal hygiene",
    difficulty: "easy",
    prompt: "Regular handwashing helps prevent disease mainly by…",
    options: [
      "Increasing body temperature",
      "Removing harmful microorganisms",
      "Replacing sleep",
      "Strengthening bones instantly",
    ],
    answerIndex: 1,
    explanation:
      "Handwashing removes microorganisms that can be transferred to the mouth, nose, eyes, or food.",
  },
  {
    subject: "History",
    topic: "West African history",
    difficulty: "medium",
    prompt: "The trans-Saharan trade linked West Africa most directly with…",
    options: ["North Africa", "South America", "Australia", "Antarctica"],
    answerIndex: 0,
    explanation:
      "Caravan routes across the Sahara connected West African states with North African markets.",
  },
  {
    subject: "Home Management",
    topic: "Household budgeting",
    difficulty: "easy",
    prompt: "A household budget helps a family to…",
    options: [
      "Plan income and expenditure",
      "Avoid all responsibilities",
      "Predict every event",
      "Eliminate food preparation",
    ],
    answerIndex: 0,
    explanation:
      "A budget helps allocate available income among needs, savings, and other spending.",
  },
  {
    subject: "Islamic Studies",
    topic: "Five pillars",
    difficulty: "easy",
    prompt: "Which of the following is one of the Five Pillars of Islam?",
    options: [
      "Zakat",
      "Pilgrimage to every country",
      "Keeping a diary",
      "Owning a business",
    ],
    answerIndex: 0,
    explanation:
      "Zakat, or obligatory almsgiving, is one of the Five Pillars of Islam.",
  },
  {
    subject: "Literature in English",
    topic: "Literary devices",
    difficulty: "medium",
    prompt: "‘The wind whispered through the trees’ is an example of…",
    options: ["Personification", "Irony", "Pun", "Euphemism"],
    answerIndex: 0,
    explanation:
      "Whispering is a human action attributed to the wind, making this personification.",
  },
  {
    subject: "Marketing",
    topic: "Marketing mix",
    difficulty: "easy",
    prompt: "Which element of the marketing mix concerns what a firm sells?",
    options: ["Product", "Place", "Promotion", "Price only"],
    answerIndex: 0,
    explanation: "Product refers to the good or service offered to customers.",
  },
  {
    subject: "Metalwork",
    topic: "Workshop safety",
    difficulty: "easy",
    prompt:
      "Protective goggles are worn in a metalwork workshop mainly to protect the…",
    options: ["Eyes", "Feet", "Ears only", "Clothing"],
    answerIndex: 0,
    explanation:
      "Goggles shield the eyes from sparks, chips, and other flying particles.",
  },
  {
    subject: "Music",
    topic: "Musical notation",
    difficulty: "medium",
    prompt: "The symbol that indicates silence in written music is called a…",
    options: ["Rest", "Clef", "Scale", "Bar line"],
    answerIndex: 0,
    explanation: "A rest represents a measured period of silence.",
  },
  {
    subject: "Physical Education",
    topic: "Physical fitness",
    difficulty: "easy",
    prompt:
      "The ability of the heart and lungs to supply oxygen during prolonged activity is…",
    options: [
      "Cardiorespiratory endurance",
      "Flexibility",
      "Balance",
      "Reaction time",
    ],
    answerIndex: 0,
    explanation:
      "Cardiorespiratory endurance describes sustained heart-and-lung performance.",
  },
  {
    subject: "Shorthand",
    topic: "Transcription",
    difficulty: "medium",
    prompt: "The main purpose of transcribing shorthand is to convert it into…",
    options: [
      "Readable longhand or typed text",
      "A musical score",
      "A map",
      "A photograph",
    ],
    answerIndex: 0,
    explanation:
      "Transcription converts shorthand notes into text that others can read and use.",
  },
  {
    subject: "Technical Drawing",
    topic: "Geometric construction",
    difficulty: "easy",
    prompt:
      "Which instrument is primarily used to draw circles in technical drawing?",
    options: ["Compass", "T-square", "Set square", "Protractor only"],
    answerIndex: 0,
    explanation: "A compass draws circles and arcs of specified radii.",
  },
  {
    subject: "Typewriting",
    topic: "Keyboard technique",
    difficulty: "medium",
    prompt: "The home row in touch typing is used mainly to…",
    options: [
      "Position the fingers for efficient typing",
      "Store printed paper",
      "Measure margins",
      "Sharpen a pencil",
    ],
    answerIndex: 0,
    explanation:
      "The home row gives each finger a reference position for touch typing.",
  },
  {
    subject: "Visual Arts",
    topic: "Elements of art",
    difficulty: "easy",
    prompt:
      "Which element of art describes how light or dark a colour appears?",
    options: ["Value", "Texture", "Line", "Space"],
    answerIndex: 0,
    explanation: "Value is the lightness or darkness of a colour.",
  },
  {
    subject: "Woodwork",
    topic: "Woodworking tools",
    difficulty: "easy",
    prompt: "A handsaw is used mainly to…",
    options: ["Cut wood", "Measure angles", "Polish metal", "Drive screws"],
    answerIndex: 0,
    explanation: "A handsaw cuts timber across or along the grain.",
  },
];

let inserted = 0;
let skipped = 0;
for (const item of questions) {
  const slug = item.subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const topicSlug = item.topic
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const subject = await db.execute({
    sql: "SELECT id FROM subjects WHERE examId = ? AND slug = ? LIMIT 1",
    args: [examId, slug],
  });
  if (!subject.rows[0]) throw new Error(`Subject not found: ${item.subject}`);
  const subjectId = Number(subject.rows[0].id);
  await db.execute({
    sql: "INSERT INTO topics (subjectId, name, slug) VALUES (?, ?, ?) ON CONFLICT(subjectId, slug) DO UPDATE SET name = excluded.name",
    args: [subjectId, item.topic, topicSlug],
  });
  const topic = await db.execute({
    sql: "SELECT id FROM topics WHERE subjectId = ? AND slug = ? LIMIT 1",
    args: [subjectId, topicSlug],
  });
  const topicId = Number(topic.rows[0].id);
  const existing = await db.execute({
    sql: "SELECT questions.id FROM questions WHERE topicId = ? AND lower(trim(prompt)) = lower(trim(?)) LIMIT 1",
    args: [topicId, item.prompt],
  });
  if (existing.rows[0]) {
    skipped++;
    continue;
  }
  const created = await db.execute({
    sql: "INSERT INTO questions (topicId, prompt, optionsJson, answerIndex, explanation, difficulty) VALUES (?, ?, ?, ?, ?, ?)",
    args: [
      topicId,
      item.prompt,
      JSON.stringify(item.options),
      item.answerIndex,
      item.explanation,
      item.difficulty,
    ],
  });
  const questionId = Number(created.lastInsertRowid);
  for (let optionIndex = 0; optionIndex < item.options.length; optionIndex++) {
    await db.execute({
      sql: "INSERT OR IGNORE INTO questionOptions (questionId, optionIndex, text) VALUES (?, ?, ?)",
      args: [questionId, optionIndex, item.options[optionIndex]],
    });
  }
  inserted++;
}
console.log(
  `Expanded WAEC bank: ${inserted} inserted, ${skipped} already present.`
);
