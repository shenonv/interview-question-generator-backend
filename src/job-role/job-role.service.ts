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

  async generateQuestions(dto: CreateQuestionDto): Promise<string> {
    const prompt = `Generate ${dto.numberOfQuestions || 5} ${dto.difficulty || 'medium'} interview questions for the job role of ${dto.role}. Format the response in a numbered list.`;

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

    const content = res.data.choices[0]?.message?.content || 'No response';

    let user = await this.userRepo.findOne({ where: { email: 'demo@example.com' } });
    if (!user) {
      user = await this.userRepo.save({ email: 'demo@example.com' });
    }

    // 💾 Save each question
    const lines = content.split('\n').filter((line) => line.trim());
    for (const line of lines) {
      await this.questionRepo.save({
        role: dto.role,
        difficulty: dto.difficulty || 'medium',
        content: line.trim(),
        user,
      });
    }

    return content;
  }

  async generateSingleQuestion(dto: CreateQuestionDto): Promise<{ question: string | null; questionNumber: number; totalQuestions: number }> {
    const totalQuestions = dto.numberOfQuestions || 5;
    
    // Check how many questions already exist for this user and role
    let user = await this.userRepo.findOne({ where: { email: 'demo@example.com' } });
    if (!user) {
      user = await this.userRepo.save({ email: 'demo@example.com' });
    }

    const existingQuestions = await this.questionRepo.count({
      where: { 
        role: dto.role, 
        user: { id: user.id },
        difficulty: dto.difficulty || 'medium'
      }
    });

    const questionNumber = existingQuestions + 1;

    // If we've already generated all questions, return null
    if (questionNumber > totalQuestions) {
      return { question: null, questionNumber, totalQuestions };
    }

    const prompt = `Generate 1 ${dto.difficulty || 'medium'} interview question for the job role of ${dto.role}. 
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
      role: dto.role,
      difficulty: dto.difficulty || 'medium',
      content: question,
      user,
    });

    return { question, questionNumber, totalQuestions };
  }

  async getNextQuestion(role: string, difficulty?: string, numberOfQuestions?: number): Promise<{ question: string | null; questionNumber: number; totalQuestions: number }> {
    const totalQuestions = numberOfQuestions || 5;
    
    // Check how many questions already exist for this user and role
    let user = await this.userRepo.findOne({ where: { email: 'demo@example.com' } });
    if (!user) {
      user = await this.userRepo.save({ email: 'demo@example.com' });
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
    const prompt = `You are an expert interviewer. Evaluate the following answer for a candidate applying as ${dto.role || 'a software engineer'}.

Question: ${dto.question}

Answer: ${dto.userAnswer}

Provide a constructive evaluation with strengths, weaknesses, and suggestions for improvement in 4 sentences.`;

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

        const user = await this.userRepo.findOne({ where: { email: 'demo@example.com' } });

    if (!user) {
      throw new Error('User not found');
    }

    const question = await this.questionRepo.findOne({
      where: { content: dto.question, user: { id: user.id } },
    });

    if (question) {
      await this.answerRepo.save({
        userAnswer: dto.userAnswer,
        aiEvaluation: evaluation,
        question,
      });
    }

    return evaluation;
  }
}
