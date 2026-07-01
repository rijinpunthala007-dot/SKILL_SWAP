import { faker } from '@faker-js/faker';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { UserModel } from '../models/User.model';
import { ExchangeRequestModel } from '../models/ExchangeRequest.model';
import { ConversationModel } from '../models/Conversation.model';
import { MessageModel } from '../models/Message.model';
import { SkillQuizModel } from '../models/SkillQuiz.model';

const SKILLS_LIST = [
  'React',
  'Frontend Development',
  'Node.js',
  'Backend Development',
  'Python',
  'Data Science',
  'Figma',
  'UI/UX Design',
  'Docker',
  'DevOps',
  'SQL Databases',
  'NoSQL Databases',
  'Git & Version Control',
  'Machine Learning',
  'Mobile Development',
];

const PROFICIENCIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
const PRIORITIES = ['Low', 'Medium', 'High'] as const;

async function seed() {
  console.log('Connecting to database...');
  await connectDatabase();

  console.log('Clearing existing data...');
  await Promise.all([
    UserModel.deleteMany({}),
    ExchangeRequestModel.deleteMany({}),
    ConversationModel.deleteMany({}),
    MessageModel.deleteMany({}),
    SkillQuizModel.deleteMany({}),
  ]);

  console.log('Generating skill quizzes...');
  const quizzes = [
    {
      skillName: 'React',
      passThreshold: 3,
      questions: [
        {
          questionText: 'What is the virtual DOM in React?',
          choices: [
            'A direct copy of the HTML DOM that cannot be updated.',
            'An in-memory representation of the real DOM used to optimize updates.',
            'A database caching layer for React state.',
            'A browser plugin required to run React code.'
          ],
          correctIndex: 1
        },
        {
          questionText: 'Which React Hook is used to perform side effects in functional components?',
          choices: ['useState', 'useContext', 'useEffect', 'useReducer'],
          correctIndex: 2
        },
        {
          questionText: 'What is the purpose of "keys" in React lists?',
          choices: [
            'To encrypt list items for security.',
            'To help React identify which items have changed, been added, or been removed.',
            'To bind keyboard event listeners to list items.',
            'To set styling weights on list rows.'
          ],
          correctIndex: 1
        },
        {
          questionText: 'What is a controlled component in React?',
          choices: [
            'A component whose value is controlled by the browser.',
            'A component that renders children components.',
            'A component whose form state is controlled by React state.',
            'A component that has a custom CSS styling wrapper.'
          ],
          correctIndex: 2
        }
      ]
    },
    {
      skillName: 'Python',
      passThreshold: 3,
      questions: [
        {
          questionText: 'Which keyword is used to define a function in Python?',
          choices: ['func', 'define', 'function', 'def'],
          correctIndex: 3
        },
        {
          questionText: 'What is the correct way to initialize an empty list in Python?',
          choices: ['list = []', 'list = {}', 'list = ()', 'list = set()'],
          correctIndex: 0
        },
        {
          questionText: 'Which data structure in Python stores unique key-value pairs?',
          choices: ['List', 'Tuple', 'Dictionary', 'Set'],
          correctIndex: 2
        },
        {
          questionText: 'How do you handle exceptions in Python?',
          choices: [
            'try / catch',
            'try / except',
            'catch / throw',
            'begin / end'
          ],
          correctIndex: 1
        }
      ]
    }
  ];
  await SkillQuizModel.insertMany(quizzes);

  console.log('Generating mock users...');
  const users: any[] = [];

  // Generate 18 mock users
  for (let i = 0; i < 18; i++) {
    // Distribute skills Offered (1-3)
    const skillsOfferedCount = faker.number.int({ min: 1, max: 3 });
    const skillsOffered = Array.from({ length: skillsOfferedCount }, () => {
      const skillName = faker.helpers.arrayElement(SKILLS_LIST);
      const proficiency = faker.helpers.arrayElement(PROFICIENCIES);
      return { skillName, proficiency };
    });

    // Distribute skills Wanted (1-3)
    const skillsWantedCount = faker.number.int({ min: 1, max: 3 });
    const skillsWanted = Array.from({ length: skillsWantedCount }, () => {
      const skillName = faker.helpers.arrayElement(SKILLS_LIST);
      const priority = faker.helpers.arrayElement(PRIORITIES);
      return { skillName, priority };
    });

    // Random verified skills (some users have them)
    const verifiedSkills: any[] = [];
    if (faker.datatype.boolean(0.4)) {
      const verifiedSkillCount = faker.number.int({ min: 1, max: 2 });
      for (let j = 0; j < verifiedSkillCount; j++) {
        const skill = faker.helpers.arrayElement(skillsOffered);
        verifiedSkills.push({
          skillName: skill.skillName,
          verifiedBy: faker.helpers.arrayElement(['quiz', 'peer-endorsement']),
          verifiedAt: faker.date.past(),
        });
      }
    }

    const points = faker.number.int({ min: 50, max: 800 });
    const streakCount = faker.number.int({ min: 0, max: 12 });

    const name = faker.person.fullName();
    const email = faker.internet.email({ firstName: name.split(' ')[0] }).toLowerCase();
    const avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;
    const bio = faker.lorem.paragraph().slice(0, 480);

    const user = new UserModel({
      name,
      email,
      password: 'Password123!', // plaintext password, hashed automatically in pre-save hook
      avatar,
      bio,
      skillsOffered,
      skillsWanted,
      verifiedSkills,
      points,
      streakCount,
    });

    users.push(user);
  }

  // Also create a test user to login with easily
  const testUser = new UserModel({
    name: 'Alice Cooper',
    email: 'alice@test.com',
    password: 'Password123!',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Alice',
    bio: 'Computer Science sophomore at State Tech. Passionate about web development and looking to learn Python for AI/ML projects.',
    skillsOffered: [
      { skillName: 'React', proficiency: 'Advanced' },
      { skillName: 'Frontend Development', proficiency: 'Advanced' },
    ],
    skillsWanted: [
      { skillName: 'Python', priority: 'High' },
      { skillName: 'Machine Learning', priority: 'Medium' },
    ],
    verifiedSkills: [
      { skillName: 'React', verifiedBy: 'quiz', verifiedAt: new Date() },
    ],
    points: 150,
    streakCount: 3,
  });

  users.push(testUser);

  // Save all users
  const savedUsers = await Promise.all(users.map((u) => u.save()));
  console.log(`Successfully seeded ${savedUsers.length} users!`);

  console.log('Generating exchange requests...');
  // Seed pending, rejected, and accepted requests
  const requests: any[] = [];
  const alice = savedUsers.find((u) => u.email === 'alice@test.com')!;
  
  // Pending request to Alice
  const requester = savedUsers[0];
  const pendingRequestToAlice = new ExchangeRequestModel({
    fromUser: requester._id,
    toUser: alice._id,
    status: 'pending',
    matchedSkill: 'React',
    message: 'Hey Alice! I saw you are looking for Python and offer React. Let us swap skills!',
  });
  requests.push(pendingRequestToAlice);

  // Pending request from Alice
  const receiver = savedUsers[1];
  const pendingRequestFromAlice = new ExchangeRequestModel({
    fromUser: alice._id,
    toUser: receiver._id,
    status: 'pending',
    matchedSkill: receiver.skillsOffered[0]?.skillName ?? 'Figma',
    message: 'Hi! I would love to learn more about your offered skill. Let me know if you are open to an exchange.',
  });
  requests.push(pendingRequestFromAlice);

  // Seed 5 accepted requests to build conversations
  for (let idx = 2; idx < 7; idx++) {
    const partner = savedUsers[idx];
    const acceptedRequest = new ExchangeRequestModel({
      fromUser: partner._id,
      toUser: alice._id,
      status: 'accepted',
      matchedSkill: alice.skillsOffered[0]?.skillName,
      message: 'Let us connect and swap skills!',
    });
    requests.push(acceptedRequest);
  }

  // Seed 3 rejected requests
  for (let idx = 7; idx < 10; idx++) {
    const partner = savedUsers[idx];
    const rejectedRequest = new ExchangeRequestModel({
      fromUser: partner._id,
      toUser: alice._id,
      status: 'rejected',
      matchedSkill: 'Node.js',
      message: 'Hey, swap skills?',
    });
    requests.push(rejectedRequest);
  }

  const savedRequests = await Promise.all(requests.map((r) => r.save()));
  console.log(`Seeded ${savedRequests.length} exchange requests.`);

  console.log('Creating active conversations and message logs...');
  const acceptedRequests = savedRequests.filter((r) => r.status === 'accepted');

  for (const req of acceptedRequests) {
    const conversation = new ConversationModel({
      participants: [req.fromUser, req.toUser],
      lastMessage: 'Awesome, see you then!',
      lastMessageAt: faker.date.recent(),
    });

    const savedConv = await conversation.save();

    // Create 6-8 messages for each conversation
    const messageCount = faker.number.int({ min: 5, max: 8 });
    const messages: any[] = [];
    const participants = [req.fromUser, req.toUser];

    const chatScripts = [
      ['Hey! Thanks for accepting the exchange request!', 'Of course! Happy to help you learn.'],
      ['So, are you free to meet up this week?', 'Yes, Wednesday or Thursday works best for me.'],
      ['Awesome. Shall we meet at the campus library?', 'Sounds good, let us do Wednesday at 3 PM.'],
      ['Perfect. What topic do you want to start with?', 'I want to build a simple React application.'],
      ['No problem, I can guide you through the basics.', 'Awesome, see you then!'],
    ];

    for (let mIdx = 0; mIdx < messageCount; mIdx++) {
      const sender = participants[mIdx % 2];
      const scriptIndex = Math.min(mIdx, chatScripts.length - 1);
      const content = chatScripts[scriptIndex][mIdx % 2];
      
      const message = new MessageModel({
        conversationId: savedConv._id,
        sender,
        content,
        readBy: [sender],
        createdAt: faker.date.between({
          from: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          to: new Date(),
        }),
      });

      messages.push(message);
    }

    await Promise.all(messages.map((m) => m.save()));
  }

  console.log('Seeding process completed successfully!');
  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('Error during seeding database:', err);
  process.exit(1);
});
