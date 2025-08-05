import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateQuestionDto } from './dto/create-question.dto';
import { EvaluateAnswerDto } from './dto/evaluate-answer.dto';

import { User } from '../entities/user';
import { Question } from '../entities/question';
import { Answer } from '../entities/answer';
import { JobRole } from '../entities/job-role';

@Injectable()
export class JobRoleService {
  private apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  private lastApiCall = 0;
  private readonly minInterval = 200; 



  // Default job roles - will be seeded into database
  private defaultJobRoles = [
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "DevOps Engineer",
    "Data Scientist",
    "Product Manager",
    "UI/UX Designer",
    "Mobile Developer",
    "Software Architect",
    "QA Engineer",
    "Machine Learning Engineer",
    "Cloud Engineer",
    "Cybersecurity Specialist",
    "Database Administrator",
    "Technical Lead",
    "System Administrator",
    "Network Engineer",
    "Business Analyst",
    "Scrum Master",
    "Project Manager",
    "Solution Architect",
    "Site Reliability Engineer",
    "Data Engineer",
    "AI Engineer",
    "Blockchain Developer",
    "Game Developer",
    "Embedded Systems Engineer",
    "IT Support Specialist",
    "Information Security Analyst",
    "Software Development Engineer in Test (SDET)",
    "Release Manager",
    "Platform Engineer",
    "API Developer",
    "React Developer",
    "Angular Developer",
    "Vue.js Developer",
    "Node.js Developer",
    "Python Developer",
    "Java Developer",
    "C# Developer",
    "Go Developer",
    "Rust Developer",
    "Kotlin Developer",
    "Swift Developer",
    "Flutter Developer",
    "React Native Developer",
  ];

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
    @InjectRepository(JobRole)
    private readonly jobRoleRepo: Repository<JobRole>,
  ) {}

  async getJobRoles(): Promise<string[]> {
    try {
      // Get all active job roles from database
      const jobRoles = await this.jobRoleRepo.find({
        where: { isActive: true },
        order: { name: 'ASC' }
      });
      
      console.log(`Found ${jobRoles.length} job roles in database`);
      return jobRoles.map(role => role.name);
    } catch (error) {
      console.error('Error fetching job roles:', error);
      return [];
    }
  }

  async createJobRole(name: string, description?: string): Promise<JobRole> {
    // Check if role already exists
    const existingRole = await this.jobRoleRepo.findOne({
      where: { name: name.trim() }
    });

    if (existingRole) {
      throw new Error(`Job role "${name}" already exists`);
    }

    // Create new custom role
    const newRole = this.jobRoleRepo.create({
      name: name.trim(),
      description: description?.trim(),
      isActive: true,
      isCustom: true
    });

    return await this.jobRoleRepo.save(newRole);
  }

  async generateQuestions(dto: CreateQuestionDto): Promise<{ question: string; correctAnswer: string; hints: string[] }[]> {
    try {
      console.log('Received DTO:', dto);
      console.log('Role from DTO:', dto.role);
      
      const apiKey = this.configService.get('OPENROUTER_API_KEY');
      if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured. Please set the environment variable.');
      }

      const prompt = `Generate ${dto.numberOfQuestions || 5} ${dto.difficulty || 'medium'} interview questions for the job role of ${dto.role}. 
      
      Requirements:
      - Return only the questions, one per line
      - Do not include numbering or bullet points
      - Make questions specific to the role
      - Include a mix of technical and behavioral questions
      - Each question should be clear and concise
      - Focus on real-world scenarios and practical knowledge
      
      Format: Return each question on a separate line without any numbering.`;

      console.log('Calling DeepSeek API with prompt:', prompt);

      const res = await axios.post(
        this.apiUrl,
        {
          model: 'deepseek/deepseek-r1:free',
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'AI Interview Question Generator',
          },
        },
      );

      const content = res.data.choices[0]?.message?.content || 'No response';
      console.log('DeepSeek API response:', content);

      // Parse questions from response
      const questions = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+\./)) 
        .slice(0, dto.numberOfQuestions || 5);

      console.log('Parsed questions:', questions);
      console.log(' About to start database operations...');

      // Get or create user
      console.log(' Getting or creating user...');
      let user = await this.userRepo.findOne({ where: { email: 'demo@example.com' } });
      if (!user) {
        console.log(' Creating new user...');
        user = await this.userRepo.save({ 
          email: 'demo@example.com',
          password: 'demo-password-123',
          fullName: 'Demo User'
        });
        console.log(' User created with ID:', user.id);
      } else {
        console.log(' Found existing user with ID:', user.id);
      }

      // Save questions to database
      console.log(' Starting to save questions to database...');
      for (const questionContent of questions) {
        console.log(' Saving question:', questionContent.substring(0, 50) + '...');
        try {
          const savedQuestion = await this.questionRepo.save({
            role: dto.role,
            difficulty: dto.difficulty || 'medium',
            content: questionContent,
            user,
          });
          console.log(' Question saved with ID:', savedQuestion.id);
        } catch (error) {
          console.error(' Error saving question:', error);
          throw error;
        }
      }

      console.log(`Successfully saved ${questions.length} questions to database`);

      // Return questions with placeholder answers and hints
      const questionsWithAnswers = questions.map((question) => ({
        question,
        correctAnswer: 'A comprehensive answer would cover the key aspects of this question. Consider the role requirements, best practices, and provide specific examples.',
        hints: ['Consider the context', 'Think about best practices', 'Provide specific examples']
      }));

      console.log('Generated questions with answers:', questionsWithAnswers.length);

      return questionsWithAnswers;
    } catch (error) {
      console.error('Error generating questions with DeepSeek:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }



  async getNextQuestion(role: string, difficulty?: string, numberOfQuestions?: number): Promise<{ question: string | null; questionNumber: number; totalQuestions: number }> {
    const totalQuestions = numberOfQuestions || 5;
    
    // Check how many questions already exist for this user and role
    let user = await this.userRepo.findOne({ where: { email: 'demo@example.com' } });
    if (!user) {
      user = await this.userRepo.save({ 
        email: 'demo@example.com',
        password: 'demo-password-123',
        fullName: 'Demo User'
      });
    }

    const existingQuestions = await this.questionRepo.count({
      where: { 
        role: role, 
        user: { id: user.id },
        difficulty: difficulty || 'medium'
      }
    });

    const questionNumber = existingQuestions + 1;

    // If we've already generated all questions, return null
    if (questionNumber > totalQuestions) {
      return { question: null, questionNumber, totalQuestions };
    }

    const prompt = `Generate 1 ${difficulty || 'medium'} interview question for the job role of ${role}. 
    This should be question number ${questionNumber} out of ${totalQuestions} total questions.
    Make sure it's different from typical interview questions and focuses on specific aspects of the role.
    Return only the question text without numbering.`;

    const res = await axios.post(
      this.apiUrl,
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('OPENROUTER_API_KEY')}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'AI Interview Question Generator',
        },
      },
    );

    const question = res.data.choices[0]?.message?.content?.trim() || 'No question generated';

    // 💾 Save the question
    await this.questionRepo.save({
      role: role,
      difficulty: difficulty || 'medium',
      content: question,
      user,
    });

    return { question, questionNumber, totalQuestions };
  }

  async evaluateAnswer(dto: EvaluateAnswerDto): Promise<string> {
    // Handle both field name variations (frontend sends 'answer', DTO expects 'userAnswer')
    const question = dto.question;
    const userAnswer = dto.userAnswer || dto['answer']; // Handle both field names
    const role = dto.role;
    
    if (!question) {
      throw new Error('Question is required');
    }
    
    if (!userAnswer) {
      throw new Error('User answer is required');
    }
    
    console.log('Evaluating answer for question:', question.substring(0, 50) + '...');
    console.log('User answer:', userAnswer.substring(0, 50) + '...');
    
    const prompt = `You are an expert interviewer. Evaluate the following answer for a candidate applying as ${role || 'a software engineer'}.

Question: ${question}

Answer: ${userAnswer}

Provide a constructive evaluation with strengths, weaknesses, and suggestions for improvement in 4 sentences.`;

    // Rate limiting to prevent overwhelming the AI API
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCall;
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall));
    }
    this.lastApiCall = Date.now();

    const res = await axios.post(
      this.apiUrl,
      {
        model: 'deepseek/deepseek-r1:free',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${this.configService.get('OPENROUTER_API_KEY')}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'AI Interview Question Generator',
        },
      },
    );

    const evaluation = res.data.choices[0]?.message?.content || 'No evaluation';
    console.log('AI evaluation generated');

    let user = await this.userRepo.findOne({ where: { email: 'demo@example.com' } });

    if (!user) {
      console.log('User not found, creating demo user...');
      user = await this.userRepo.save({ 
        email: 'demo@example.com',
        password: 'demo-password-123',
        fullName: 'Demo User'
      });
    }

    console.log('Looking for question in database...');
    const questionEntity = await this.questionRepo.findOne({
      where: { content: question, user: { id: user.id } },
    });

    if (questionEntity) {
      console.log('Question found with ID:', questionEntity.id);
      console.log('Saving answer to database...');
      try {
        const savedAnswer = await this.answerRepo.save({
          userAnswer: userAnswer,
          aiEvaluation: evaluation,
          question: questionEntity,
        });
        console.log('Answer saved with ID:', savedAnswer.id);
      } catch (error) {
        console.error('Error saving answer:', error);
        throw error;
      }
    } else {
      console.log('Question not found in database. Available questions:');
      const allQuestions = await this.questionRepo.find({
        where: { user: { id: user.id } },
        select: ['id', 'content']
      });
      allQuestions.forEach(q => {
        console.log(`  - ID: ${q.id}, Content: ${q.content.substring(0, 50)}...`);
      });
    }

    return evaluation;
  }
}
