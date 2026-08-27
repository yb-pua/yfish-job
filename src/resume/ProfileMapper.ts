import type { UserProfile } from '../types';
import type { ParsedResume } from './types';

/** Map LLM-parsed resume to UserProfile for storage + form-filling */
export function mapToProfile(parsed: ParsedResume): UserProfile {
  return {
    basic: {
      name: parsed.basic?.name || '',
      phone: parsed.basic?.phone || '',
      email: parsed.basic?.email || '',
      gender: parsed.basic?.gender || '',
      birthDate: parsed.basic?.birthDate || '',
      ethnicity: parsed.basic?.ethnicity || '',
      politicalStatus: parsed.basic?.politicalStatus || '',
      nativePlace: parsed.basic?.nativePlace || '',
    },
    links: {
      github: parsed.links?.github || '',
      linkedin: parsed.links?.linkedin || '',
      website: parsed.links?.website || '',
    },
    education: (parsed.education || []).map(e => ({
      school: e.school || '',
      college: e.college || '',
      major: e.major || '',
      degree: e.degree || '',
      gpa: e.gpa || '',
      courses: e.courses || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
    })),
    experience: (parsed.experience || []).map(e => ({
      company: e.company || '',
      role: e.role || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      description: e.description || '',
    })),
    internships: (parsed.internships || []).map(e => ({
      company: e.company || '',
      role: e.role || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      description: e.description || '',
    })),
    projects: (parsed.projects || []).map(p => ({
      name: p.name || '',
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      description: p.description || '',
    })),
    awards: (parsed.awards || []).map(a => ({
      name: a.name || '',
      date: a.date || '',
      level: a.level || '',
      description: a.description || '',
    })),
    research: (parsed.research || []).map(r => ({
      title: r.title || '',
      mentor: r.mentor || '',
      startDate: r.startDate || '',
      endDate: r.endDate || '',
      description: r.description || '',
    })),
    publications: (parsed.publications || []).map(p => ({
      title: p.title || '',
      type: p.type || '',
      number: p.number || '',
      status: p.status || '',
      date: p.date || '',
    })),
    certificates: (parsed.certificates || []).map(c => ({
      name: c.name || '',
      number: c.number || '',
      date: c.date || '',
    })),
    languages: (parsed.languages || []).map(l => ({
      name: l.name || '',
      level: l.level || '',
      score: l.score || '',
      date: l.date || '',
    })),
    family: (parsed.family || []).map(f => ({
      name: f.name || '',
      relation: f.relation || '',
      company: f.company || '',
      position: f.position || '',
    })),
    campusPositions: (parsed.campusPositions || []).map(c => ({
      organization: c.organization || '',
      role: c.role || '',
      startDate: c.startDate || '',
      endDate: c.endDate || '',
      description: c.description || '',
    })),
    skills: parsed.skills || [],
    selfIntroduction: parsed.selfIntroduction || '',
  };
}
