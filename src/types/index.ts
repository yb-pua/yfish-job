// ─── Resume Field Semantic Layer ───

export enum ResumeFieldType {
  NAME = 'NAME',
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  LOCATION = 'LOCATION',
  GENDER = 'GENDER',
  BIRTH_DATE = 'BIRTH_DATE',
  ID_NUMBER = 'ID_NUMBER',
  SCHOOL = 'SCHOOL',
  COLLEGE = 'COLLEGE',
  MAJOR = 'MAJOR',
  DEGREE = 'DEGREE',
  GPA = 'GPA',
  COURSES = 'COURSES',
  GRADUATION_DATE = 'GRADUATION_DATE',
  EDUCATION_START_DATE = 'EDUCATION_START_DATE',
  WORK_EXPERIENCE = 'WORK_EXPERIENCE',
  INTERNSHIP_EXPERIENCE = 'INTERNSHIP_EXPERIENCE',
  PROJECT_EXPERIENCE = 'PROJECT_EXPERIENCE',
  AWARD = 'AWARD',
  SKILLS = 'SKILLS',
  SELF_INTRODUCTION = 'SELF_INTRODUCTION',
  CAREER_GOAL = 'CAREER_GOAL',
  SALARY_EXPECTATION = 'SALARY_EXPECTATION',
  LINKEDIN = 'LINKEDIN',
  GITHUB = 'GITHUB',
  PERSONAL_WEBSITE = 'PERSONAL_WEBSITE',
  PORTFOLIO = 'PORTFOLIO',
  NATIONALITY = 'NATIONALITY',
  ETHNICITY = 'ETHNICITY',
  POLITICAL_STATUS = 'POLITICAL_STATUS',
  MARITAL_STATUS = 'MARITAL_STATUS',
  EMERGENCY_CONTACT = 'EMERGENCY_CONTACT',
  EMERGENCY_PHONE = 'EMERGENCY_PHONE',
  RESEARCH = 'RESEARCH',
  PUBLICATION = 'PUBLICATION',
  CERTIFICATE = 'CERTIFICATE',
  LANGUAGE = 'LANGUAGE',
  FAMILY = 'FAMILY',
  CAMPUS_POSITION = 'CAMPUS_POSITION',
  OTHER = 'OTHER',
}

// ─── User Profile ───

export interface BasicInfo {
  name: string;
  phone: string;
  email: string;
  gender: string;
  birthDate: string;
  ethnicity: string;
  politicalStatus: string;
  nativePlace: string;
  idNumber: string;
}

export interface Links {
  github: string;
  linkedin: string;
  website: string;
}

export interface Education {
  school: string;
  college: string;
  major: string;
  degree: string;
  gpa: string;
  courses: string;
  startDate: string;
  endDate: string;
}

export interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Internship {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Project {
  name: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Award {
  name: string;
  date: string;
  level: string;
  description: string;
}

export interface Research {
  title: string;
  mentor: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Publication {
  title: string;
  type: string;
  number: string;
  status: string;
  date: string;
}

export interface Certificate {
  name: string;
  number: string;
  date: string;
}

export interface Language {
  name: string;
  level: string;
  score: string;
  date: string;
}

export interface FamilyMember {
  name: string;
  relation: string;
  company: string;
  position: string;
}

export interface CampusPosition {
  organization: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface UserProfile {
  basic: BasicInfo;
  links: Links;
  education: Education[];
  experience: Experience[];
  internships: Internship[];
  projects: Project[];
  awards: Award[];
  research: Research[];
  publications: Publication[];
  certificates: Certificate[];
  languages: Language[];
  family: FamilyMember[];
  campusPositions: CampusPosition[];
  skills: string[];
  selfIntroduction: string;
}

export const EMPTY_PROFILE: UserProfile = {
  basic: { name: '', phone: '', email: '', gender: '', birthDate: '', ethnicity: '', politicalStatus: '', nativePlace: '', idNumber: '' },
  links: { github: '', linkedin: '', website: '' },
  education: [],
  experience: [],
  internships: [],
  projects: [],
  awards: [],
  research: [],
  publications: [],
  certificates: [],
  languages: [],
  family: [],
  campusPositions: [],
  skills: [],
  selfIntroduction: '',
};

// ─── DOM Analysis ───

export interface DOMField {
  id: string;
  tag: string;
  type: string;
  label: string;
  placeholder: string;
  name: string;
  ariaLabel: string;
  nearbyText: string;
  options?: string[];
}

// ─── Fill Proposal ───

export type FillAction = 'auto_fill' | 'confirm' | 'skip';

export interface FillProposal {
  fieldId: string;
  originalLabel: string;
  fieldType: ResumeFieldType;
  value: string | null;
  confidence: number;
  reason: string;
  action: FillAction;
}

/** Derive action from confidence threshold */
export function classifyAction(confidence: number): FillAction {
  if (confidence >= 0.7) return 'auto_fill';
  if (confidence >= 0.5) return 'confirm';
  return 'skip';
}

// ─── Page Info (公司/岗位/平台识别结果) ───

export interface PageInfo {
  company: string;
  position: string;
  platform: string;
}

// ─── Application Record (求职投递记录) ───

export type ApplicationStatus = 'filled' | 'submitted' | 'success' | 'unknown';

export interface ApplicationRecord {
  id: string;
  company: string;
  position: string;
  platform: string;
  url: string;
  status: ApplicationStatus;
  filledCount: number;
  skippedCount: number;
  createdAt: number;
  submittedAt?: number;
}

// ─── Resume Import ───

export interface ResumeImportRecord {
  filename: string;
  timestamp: number;
  success: boolean;
}

// ─── API Config ───

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: string;
}

// ─── LLM Client Interface ───

export interface LLMClient {
  matchFields(
    fields: DOMField[],
    profile: UserProfile,
    onRetry?: (attempt: number, max: number, reason: string) => void,
  ): Promise<FillProposal[]>;
}

// ─── Content Script Messages ───

export type ContentMessage =
  | { type: 'ANALYZE' }
  | { type: 'FILL'; proposals: FillProposal[] };

export type ContentResponse =
  | { type: 'ANALYZE_RESULT'; fields: DOMField[]; pageInfo: PageInfo }
  | { type: 'FILL_RESULT'; success: boolean; filled: number }
  | { type: 'ERROR'; message: string };

// ─── Content → Background 运行时消息 ───

export type BackgroundMessage =
  | { type: 'APPLICATION_SUCCESS'; url: string };
