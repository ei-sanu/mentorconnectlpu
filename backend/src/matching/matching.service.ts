import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StudentProfile, StudentProfileDocument } from '../database/schemas/student-profile.schema';
import { MentorProfile, MentorProfileDocument, VerificationStatus, MentorStatus } from '../database/schemas/mentor-profile.schema';
import { Availability, AvailabilityDocument } from '../database/schemas/availability.schema';
import { SystemConfig, SystemConfigDocument } from '../database/schemas/system-config.schema';
import { GoogleGenAI } from '@google/genai';

export interface MatchingWeights {
  semanticSimilarity: number;
  careerGoal: number;
  expertise: number;
  industry: number;
  targetRole: number;
  availability: number;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0.5;
  let dot = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    mA += a[i] * a[i];
    mB += b[i] * b[i];
  }
  if (mA === 0 || mB === 0) return 0.5;
  return dot / (Math.sqrt(mA) * Math.sqrt(mB));
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);
  private ai: GoogleGenAI | null = null;

  constructor(
    @InjectModel(StudentProfile.name)
    private readonly studentProfileModel: Model<StudentProfileDocument>,
    @InjectModel(MentorProfile.name)
    private readonly mentorProfileModel: Model<MentorProfileDocument>,
    @InjectModel(Availability.name)
    private readonly availabilityModel: Model<AvailabilityDocument>,
    @InjectModel(SystemConfig.name)
    private readonly configModel: Model<SystemConfigDocument>,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'mock_gemini_key') {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async getMatchingWeights(): Promise<MatchingWeights> {
    const config = await this.configModel.findOne({ key: 'MATCHING_WEIGHTS' }).lean();
    if (config) {
      return config.value as unknown as MatchingWeights;
    }
    return {
      semanticSimilarity: 35,
      careerGoal: 20,
      expertise: 15,
      industry: 10,
      targetRole: 10,
      availability: 10,
    };
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (this.ai) {
        const response = await this.ai.models.embedContent({
          model: 'text-embedding-004',
          contents: text,
        });

        const values = response.embeddings?.[0]?.values;
        if (values) {
          if (values.length === 768) {
            return [...values, ...values];
          }
          if (values.length === 1536) {
            return values;
          }
          const target = new Array(1536).fill(0);
          for (let i = 0; i < Math.min(values.length, 1536); i++) {
            target[i] = values[i];
          }
          return target;
        }
      }
    } catch (error) {
      this.logger.error(`AI Embedding generation failed: ${error.message}. Using fallback dummy vector.`);
    }

    const dummy = new Array(1536).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    for (let i = 0; i < 1536; i++) {
      dummy[i] = Math.sin(hash + i) * 0.1;
    }
    return dummy;
  }

  async generateAndSaveStudentEmbedding(studentProfileId: string) {
    const student = await this.studentProfileModel.findById(studentProfileId).lean();
    if (!student) return;

    const representation = `
      Programme: ${student.programme}
      School: ${student.school}
      Target Role: ${student.targetRole}
      Target Industry: ${student.targetIndustry}
      Skills: ${student.currentSkills.join(', ')}
      Goals: ${student.careerGoals.join(', ')}
      Needs: ${student.mentoringNeeds}
    `;

    const embedding = await this.generateEmbedding(representation);

    await this.studentProfileModel.findByIdAndUpdate(studentProfileId, {
      $set: { studentEmbedding: embedding },
    });

    this.logger.log(`Generated and stored embedding for StudentProfile: ${studentProfileId}`);
  }

  async generateAndSaveMentorEmbedding(mentorProfileId: string) {
    const mentor = await this.mentorProfileModel.findById(mentorProfileId).lean();
    if (!mentor) return;

    const representation = `
      Programme: ${mentor.programme}
      Designation: ${mentor.currentDesignation}
      Company: ${mentor.currentCompany}
      Industry: ${mentor.industry}
      Expertise: ${mentor.expertise.join(', ')}
      Areas: ${mentor.mentoringAreas.join(', ')}
      Bio: ${mentor.bio}
      Summary: ${mentor.careerSummary}
    `;

    const embedding = await this.generateEmbedding(representation);

    await this.mentorProfileModel.findByIdAndUpdate(mentorProfileId, {
      $set: { mentorEmbedding: embedding },
    });

    this.logger.log(`Generated and stored embedding for MentorProfile: ${mentorProfileId}`);
  }

  async calculateRecommendation(studentProfileId: string, mentorProfileId?: string) {
    const student = await this.studentProfileModel.findById(studentProfileId).lean();
    if (!student) {
      throw new Error(`Student profile ${studentProfileId} not found`);
    }

    const weights = await this.getMatchingWeights();

    let mentors = [];
    if (mentorProfileId) {
      const single = await this.mentorProfileModel.findById(mentorProfileId).populate('userId').lean();
      if (single) mentors = [single];
    } else {
      mentors = await this.mentorProfileModel.find({
        verificationStatus: VerificationStatus.VERIFIED,
        status: MentorStatus.ACTIVE,
        acceptingMentees: true,
        profileVisibility: true,
        $expr: { $lt: ['$currentMenteesCount', '$maxCapacity'] },
      }).populate('userId').lean();
    }

    let semanticScores: Record<string, number> = {};
    let isFallback = false;

    const studentEmb = student.studentEmbedding;

    if (studentEmb && studentEmb.length > 0) {
      try {
        for (const m of mentors) {
          if (m.mentorEmbedding && m.mentorEmbedding.length > 0) {
            const similarity = cosineSimilarity(studentEmb, m.mentorEmbedding);
            const normalized = (similarity + 1) / 2;
            semanticScores[m._id.toString()] = isNaN(normalized) ? 0.5 : normalized;
          } else {
            semanticScores[m._id.toString()] = 0.5;
          }
        }
      } catch (err) {
        this.logger.error(`Vector search logic failed: ${err.message}. Using fallback.`);
        isFallback = true;
      }
    } else {
      isFallback = true;
    }

    const recommendations = [];
    for (const m of mentors) {
      const mIdStr = m._id.toString();

      // Fetch availabilities
      const mAvailabilities = await this.availabilityModel.find({ mentorProfileId: m._id }).lean();

      // A. Career Goal Match
      let careerGoalScore = 0;
      if (student.careerGoals.length > 0 && m.mentoringAreas.length > 0) {
        const intersection = student.careerGoals.filter((g) =>
          m.mentoringAreas.some((a) => a.toLowerCase().includes(g.toLowerCase()) || g.toLowerCase().includes(a.toLowerCase())),
        );
        careerGoalScore = intersection.length / student.careerGoals.length;
      }

      // B. Expertise Match
      let expertiseScore = 0;
      if (student.currentSkills.length > 0 && m.expertise.length > 0) {
        const intersection = student.currentSkills.filter((s) =>
          m.expertise.some((e) => e.toLowerCase() === s.toLowerCase()),
        );
        expertiseScore = intersection.length / student.currentSkills.length;
      }

      // C. Industry Match
      const industryScore = student.targetIndustry.toLowerCase() === m.industry.toLowerCase() ? 1.0 : 0.0;

      // D. Role Match
      const roleScore =
        m.currentDesignation.toLowerCase().includes(student.targetRole.toLowerCase()) ||
        student.targetRole.toLowerCase().includes(m.currentDesignation.toLowerCase())
          ? 1.0
          : 0.0;

      // E. Availability Match
      const availabilityScore = mAvailabilities.length > 0 ? 1.0 : 0.5;

      // F. Semantic Score
      const semanticScore = semanticScores[mIdStr] !== undefined ? semanticScores[mIdStr] : 0.5;

      const totalWeight =
        weights.semanticSimilarity +
        weights.careerGoal +
        weights.expertise +
        weights.industry +
        weights.targetRole +
        weights.availability;

      const finalScore =
        (semanticScore * weights.semanticSimilarity +
          careerGoalScore * weights.careerGoal +
          expertiseScore * weights.expertise +
          industryScore * weights.industry +
          roleScore * weights.targetRole +
          availabilityScore * weights.availability) /
        totalWeight;

      const matchReasons: string[] = [];
      if (roleScore > 0) matchReasons.push('Matches your target role');
      if (industryScore > 0) matchReasons.push(`Relevant experience in ${m.industry}`);
      if (expertiseScore > 0) matchReasons.push('Aligns with your skill-development needs');
      if (careerGoalScore > 0) matchReasons.push('Matches your primary career goals');
      if (m.yearsOfExperience >= 5) matchReasons.push(`Senior mentorship perspective (${m.yearsOfExperience} years of experience)`);
      if (m.currentCompany) matchReasons.push(`Currently working at ${m.currentCompany}`);

      if (matchReasons.length < 2) {
        matchReasons.push('Currently accepting mentees');
        matchReasons.push('Alumni of LPU');
      }

      const user = m.userId || {};
      recommendations.push({
        id: mIdStr,
        userId: user._id?.toString() || m.userId?.toString(),
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        imageUrl: user.avatar || `https://picsum.photos/seed/${mIdStr}/200/200`,
        title: m.currentDesignation,
        company: m.currentCompany,
        experienceYears: m.yearsOfExperience,
        expertise: m.expertise,
        industry: m.industry,
        graduationYear: m.graduationYear.toString(),
        programme: m.programme,
        capacity: {
          max: m.maxCapacity,
          current: m.currentMenteesCount,
        },
        acceptingMentees: m.acceptingMentees && m.currentMenteesCount < m.maxCapacity,
        matchScore: Math.round(finalScore * 100),
        matchReasons,
        matchType: isFallback ? 'FALLBACK' : 'HYBRID',
      });
    }

    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }
}
