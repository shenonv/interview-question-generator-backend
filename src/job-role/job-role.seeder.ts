import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobRole } from '../entities/job-role';

@Injectable()
export class JobRoleSeeder {
  private readonly defaultJobRoles = [
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
    @InjectRepository(JobRole)
    private readonly jobRoleRepo: Repository<JobRole>,
  ) {}

  async seed(): Promise<void> {
    try {
      console.log('Starting job roles seeding...');
      
      // Check if roles already exist in the database
      const existingRoles = await this.jobRoleRepo.find();
      
      if (existingRoles.length > 0) {
        console.log(`Found ${existingRoles.length} existing job roles. Skipping seeding.`);
        return;
      }

      // Create job role entities
      const jobRoleEntities = this.defaultJobRoles.map(name => {
        const role = new JobRole();
        role.name = name;
        role.isActive = true;
        role.isCustom = false;
        role.description = `Default job role: ${name}`;
        return role;
      });  

      // Save to database
      await this.jobRoleRepo.save(jobRoleEntities);
      

    } catch (error) {
      console.error('Error seeding job roles:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.jobRoleRepo.clear();
      console.log('Cleared all job roles from database');
    } catch (error) {
      console.error('Error clearing job roles:', error);
      throw error;
    }
  }
} 