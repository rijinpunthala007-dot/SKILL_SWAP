import { quizRepository } from '../repositories/quiz.repository';
import { userRepository } from '../repositories/user.repository';
import { gamificationService } from './gamification.service';

const FALLBACK_QUIZZES: Record<string, any> = {
  figma: {
    skillName: 'Figma',
    passThreshold: 3,
    questions: [
      {
        questionText: 'What is a component in Figma?',
        choices: [
          'A layer that cannot be duplicated.',
          'A reusable design element that can be instanced across projects.',
          'A file export format.',
          'A vector drawing tool.',
        ],
        correctIndex: 1,
      },
      {
        questionText: 'Which feature in Figma allows layouts to adapt dynamically to screen size changes?',
        choices: ['Smart Animate', 'Auto Layout', 'Constraints', 'Components'],
        correctIndex: 1,
      },
      {
        questionText: 'How do you create a connection for prototyping in Figma?',
        choices: [
          'Drag the blue circle from one frame to another.',
          'Right-click and select "Link".',
          'Use the Pen tool to draw a connection line.',
          'It is created automatically.',
        ],
        correctIndex: 0,
      },
      {
        questionText: 'What are Figma styles used for?',
        choices: [
          'To generate layout grids.',
          'To save and reuse colors, typography, effects, and grids.',
          'To animate transitions between screens.',
          'To share files with clients.',
        ],
        correctIndex: 1,
      },
    ],
  },
  git: {
    skillName: 'Git & Version Control',
    passThreshold: 3,
    questions: [
      {
        questionText: 'Which command initializes a new Git repository?',
        choices: ['git create', 'git start', 'git init', 'git setup'],
        correctIndex: 2,
      },
      {
        questionText: 'How do you stage all modified files for commit?',
        choices: ['git add .', 'git commit -a', 'git stage', 'git push'],
        correctIndex: 0,
      },
      {
        questionText: 'What is the purpose of "git clone"?',
        choices: [
          'To create a copy of a branch.',
          'To copy an existing remote Git repository locally.',
          'To overwrite local modifications.',
          'To merge branches.',
        ],
        correctIndex: 1,
      },
      {
        questionText: 'Which command downloads remote changes and merges them into your current branch?',
        choices: ['git push', 'git fetch', 'git pull', 'git status'],
        correctIndex: 2,
      },
    ],
  },
};

// Default generic quiz for other skills to ensure dev/demo flow never fails
function generateGenericQuiz(skillName: string): any {
  return {
    skillName,
    passThreshold: 3,
    questions: [
      {
        questionText: `What is the primary purpose of ${skillName}?`,
        choices: [
          'To manage browser cookies and sessions.',
          'To solve a specific domain problem as part of the system stack.',
          'To host media files and optimize image compression.',
          'To replace traditional server hardware.',
        ],
        correctIndex: 1,
      },
      {
        questionText: `Which of the following is a common best practice when working with ${skillName}?`,
        choices: [
          'Commit credentials and secrets directly to public source code.',
          'Follow standard style guides, write modular tests, and document public modules.',
          'Avoid reading logs or checking server exit statuses.',
          'Run all development scripts on production servers without sandbox checks.',
        ],
        correctIndex: 1,
      },
      {
        questionText: `What is the best way to gain proficiency in ${skillName}?`,
        choices: [
          'Watch video tutorials without writing any code.',
          'Build hands-on peer-to-peer projects like SkillSwap, read source files, and solve compiler warnings.',
          'Memorize interview questions without understanding the core concepts.',
          'Ask other students to write your files for you.',
        ],
        correctIndex: 1,
      },
      {
        questionText: `Which layer is responsible for data serialization when integrating ${skillName}?`,
        choices: [
          'The router layer.',
          'The repository and model serialization layer.',
          'The local storage auth state.',
          'The CSS class compilation.',
        ],
        correctIndex: 1,
      },
    ],
  };
}

export class QuizService {
  async getQuiz(skillName: string): Promise<any> {
    const dbQuiz = await quizRepository.findBySkillName(skillName);
    if (dbQuiz) return dbQuiz;

    // Check fallbacks
    const normalized = skillName.toLowerCase();
    if (normalized.includes('figma')) return FALLBACK_QUIZZES.figma;
    if (normalized.includes('git')) return FALLBACK_QUIZZES.git;

    // Generate generic quiz
    return generateGenericQuiz(skillName);
  }

  async submitQuiz(
    userId: string,
    skillName: string,
    answers: number[]
  ): Promise<{ passed: boolean; score: number; totalQuestions: number; pointsAwarded: number }> {
    const quiz = await this.getQuiz(skillName);
    
    let score = 0;
    quiz.questions.forEach((q: any, i: number) => {
      if (answers[i] === q.correctIndex) {
        score++;
      }
    });

    const passed = score >= quiz.passThreshold;
    let pointsAwarded = 0;

    if (passed) {
      // Add verified skill to user profile
      await userRepository.addVerifiedSkill(userId, quiz.skillName, 'quiz');
      
      // Award gamification points
      const result = await gamificationService.awardPoints(userId, 'quiz_passed');
      pointsAwarded = result.pointsAwarded;
    }

    return {
      passed,
      score,
      totalQuestions: quiz.questions.length,
      pointsAwarded,
    };
  }
}

export const quizService = new QuizService();
