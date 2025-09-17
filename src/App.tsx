import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, Users, MessageCircle, Star, ArrowRight, Phone, RefreshCw, Globe, Award, TrendingUp, MapPin, Clock, ExternalLink, CheckCircle, Edit, Trash2, Eye } from 'lucide-react';
import MobileAdminPanel from './MobileAdminPanel';
import { useJobMonitoring, JobIssueDetector } from './WhatsAppJobMonitor';
import JobManager, { useJobs } from './JobManager';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://aljnetqtbajiudehmzdv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsam5ldHF0YmFqaXVkZWhtemR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTY2MDksImV4cCI6MjA3MzU5MjYwOX0.gDp3q-v5BKcHk_sIuB3AniKilUOoYisqyh8zJqJ2HaA');

// ============================================
// TYPE DEFINITIONS
// ============================================
interface Job {
  id: number;
  url: string;
  category: string;
  title: string;
  company: string;
}

interface PendingJob {
  id: number;
  job_url: string;
  extracted_title: string;
  company: string;
  suggested_category: string;
  status: string;
  confidence_score: number;
  created_at: string;
}

interface CategoryData {
  keywords: string[];
  icon: string;
  color: string;
}

interface ThemeColors {
  emeraldDark: string;
  emeraldMedium: string;
  emeraldLight: string;
  goldLight: string;
  goldMedium: string;
  goldDark: string;
  white: string;
  gray: string;
  grayLight: string;
}

interface IconComponentProps {
  name: string;
  size?: number;
  color?: string;
}

// ============================================
// THEME CONFIGURATION
// ============================================
const THEME_CONFIG = {
  colors: {
    emeraldDark: '#012920',
    emeraldMedium: '#065f46', 
    emeraldLight: '#047857',
    goldLight: '#d7bc69',
    goldMedium: '#eab308',
    goldDark: '#a16207',
    white: '#ffffff',
    gray: '#6b7280',
    grayLight: '#f3f4f6'
  } as ThemeColors
};

// ============================================
// JOB CATEGORIZATION SYSTEM
// ============================================
const JOB_CATEGORIES: Record<string, CategoryData> = {
  'I.T.': {
    keywords: ['dev', 'developer', 'engineer', 'programming', 'coding', 'software', 'frontend', 'backend', 'fullstack', 'javascript', 'python', 'react', 'node', 'database', 'devops', 'system', 'technical', 'tech', 'web', 'mobile', 'app'],
    icon: 'Briefcase',
    color: '#3b82f6'
  },
  'Sales': {
    keywords: ['sales', 'business development', 'bdr', 'sdr', 'account executive', 'account manager', 'business development rep', 'sales development rep', 'sales development representative', 'revenue', 'partnerships', 'lead generation'],
    icon: 'TrendingUp',
    color: '#10b981'
  },
  'Virtual Assistant': {
    keywords: ['admin', 'assistant', 'personal', 'executive', 'data analyst', 'virtual assistant', 'va', 'support', 'coordinator', 'scheduler', 'research', 'entry'],
    icon: 'Users',
    color: '#8b5cf6'
  },
  'Customer Service': {
    keywords: ['customer service', 'customer support', 'help desk', 'client support', 'customer success', 'support specialist', 'call center'],
    icon: 'MessageCircle',
    color: '#f59e0b'
  },
  'H.R.': {
    keywords: ['hr', 'human resources', 'recruiting', 'recruiter', 'talent', 'hiring', 'people operations', 'people', 'talent acquisition', 'hr-manager', 'hrmanager', 'hr manager', 'human-resources'],
    icon: 'Award',
    color: '#ec4899'
  },
  'Design': {
    keywords: ['design', 'designer', 'graphic', 'video', 'editing', 'ui', 'ux', 'creative', 'visual', 'multimedia', 'animation', 'branding'],
    icon: 'Star',
    color: '#6366f1'
  },
  'Marketing': {
    keywords: ['marketing', 'social media', 'content', 'seo', 'digital marketing', 'growth', 'campaign', 'brand', 'advertising', 'copywriting'],
    icon: 'Globe',
    color: '#ef4444'
  },
  'Operations': {
    keywords: ['accounting', 'operations', 'manager', 'finance', 'business', 'project', 'logistics', 'procurement', 'project manager', 'project management'],
    icon: 'CheckCircle',
    color: '#6b7280'
  }
};

// ============================================
// ICON COMPONENT MAPPER
// ============================================
const IconComponent: React.FC<IconComponentProps> = ({ name, size = 20, color = '#000' }) => {
  const icons: Record<string, React.ComponentType<any>> = {
    Briefcase,
    TrendingUp,
    Users,
    MessageCircle,
    Award,
    Star,
    Globe,
    CheckCircle
  };
  
  const Icon = icons[name] || Briefcase;
  return <Icon size={size} color={color} />;
};

// ============================================
// MAIN COMPONENT
// ============================================
const RemoteJobBoard: React.FC = () => {
  const [cleanJobs, setCleanJobs] = useState<Job[]>([]);
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingJob, setEditingJob] = useState<PendingJob | null>(null);

  const loadJobs = async (): Promise<void> => {
    setLoading(true);
    console.log('Loading from Supabase...');
    
    // Load approved jobs for public display
    const { data: approvedData } = await supabase
      .from('job_review_queue')
      .select('*')
      .eq('status', 'approved');

    if (approvedData) {
      const jobs = approvedData.map((job: any) => ({
        id: job.id,
        url: job.job_url,
        title: job.extracted_title || 'Job',
        company: job.company || 'Company',
        category: job.suggested_category || 'Operations'
      }));
      setCleanJobs(jobs);
      setLastUpdated(new Date());
    }

    // Load pending jobs for admin review
    const { data: pendingData } = await supabase
      .from('job_review_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingData) {
      setPendingJobs(pendingData);
    }
    
    setLoading(false);
  };

  const importFromGoogleSheets = async () => {
    console.log('Starting Google Sheets import...');
    
    try {
      const sheetId = '1imnNLvoNw_LZfI0pb18a0D9ktW10ixEdA7tOXOjNqRU';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&range=A:A`;
      
      const response = await fetch(csvUrl);
      const csvText = await response.text();
      
      const lines = csvText.split('\n');
      const urls = lines
        .slice(1)
        .map(line => line.replace(/"/g, '').trim())
        .filter(line => line && line.startsWith('http'));

      console.log(`Found ${urls.length} URLs to import`);

      let importCount = 0;
      for (const url of urls) {
        const title = extractJobTitle(url);
        const company = extractCompany(url);
        const category = categorizeJob(url, title);
        const confidence = calculateConfidence(url, title, category);

        // Import as PENDING - not approved
        const { error } = await supabase
          .from('job_review_queue')
          .insert({
            job_url: url,
            extracted_title: title,
            company: company,
            suggested_category: category,
            confidence_score: confidence,
            status: 'pending'  // KEY CHANGE: Import as pending
          });
        
        if (!error) importCount++;
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Import completed: ${importCount} new jobs added for review`);
      
      // Send WhatsApp notification about pending jobs
      if (importCount > 0) {
        sendWhatsAppNotification(importCount);
      }
      
      loadJobs(); // Refresh lists
      
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const sendWhatsAppNotification = (count: number) => {
    const message = `🚨 BORDERLESS PLUG - NEW JOBS FOR REVIEW

📊 ${count} jobs imported and need your approval

💻 Review at: ${window.location.origin}/admin

Quick actions:
✅ Review and approve quality jobs
❌ Reject poor quality jobs
✏️ Edit titles/companies before approval

Time to review and get these jobs live!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/27679245039?text=${encodedMessage}`, '_blank');
  };

  const approveJob = async (jobId: number) => {
    const { error } = await supabase
      .from('job_review_queue')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin'
      })
      .eq('id', jobId);

    if (!error) {
      loadJobs(); // Refresh both lists
    }
  };

  const rejectJob = async (jobId: number) => {
    const { error } = await supabase
      .from('job_review_queue')
      .update({ status: 'rejected' })
      .eq('id', jobId);

    if (!error) {
      loadJobs();
    }
  };

  const updateJob = async (job: PendingJob) => {
    const { error } = await supabase
      .from('job_review_queue')
      .update({
        extracted_title: job.extracted_title,
        company: job.company,
        suggested_category: job.suggested_category
      })
      .eq('id', job.id);

    if (!error) {
      setEditingJob(null);
      loadJobs();
    }
  };

  const extractJobTitle = (url: string): string => {
    const parts = url.split('/');
    const jobPart = parts[parts.length - 1] || parts[parts.length - 2];
    return jobPart.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const extractCompany = (url: string): string => {
    if (url.includes('remote.co')) return 'Remote.co';
    if (url.includes('weworkremotely')) return 'WeWorkRemotely';
    if (url.includes('flexjobs')) return 'FlexJobs';
    if (url.includes('remoteok')) return 'RemoteOK';
    if (url.includes('indeed')) return 'Indeed';
    if (url.includes('linkedin')) return 'LinkedIn';
    
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Remote Company';
    }
  };

  const categorizeJob = (url: string, title: string): string => {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const combinedText = `${urlLower} ${titleLower}`;
    
    if (combinedText.includes('developer') || combinedText.includes('engineer') || combinedText.includes('programming')) return 'I.T.';
    if (combinedText.includes('sales') || combinedText.includes('business development')) return 'Sales';
    if (combinedText.includes('assistant') || combinedText.includes('admin')) return 'Virtual Assistant';
    if (combinedText.includes('customer') || combinedText.includes('support')) return 'Customer Service';
    if (combinedText.includes('hr') || combinedText.includes('recruiting')) return 'H.R.';
    if (combinedText.includes('design') || combinedText.includes('creative')) return 'Design';
    if (combinedText.includes('marketing') || combinedText.includes('social media')) return 'Marketing';
    
    return 'Operations';
  };

  const calculateConfidence = (url: string, title: string, category: string): number => {
    let confidence = 0.5;
    if (url.includes('remote.co') || url.includes('weworkremotely')) confidence += 0.3;
    if (url.includes('indeed') || url.includes('linkedin')) confidence += 0.2;
    if (title.length > 10) confidence += 0.1;
    if (title.includes('Senior') || title.includes('Lead')) confidence += 0.1;
    return Math.min(confidence, 1.0);
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    const isAdmin = window.location.pathname === '/admin';
    if (isAdmin) {
      const password = prompt('Enter admin password:');
      if (password !== 'Border@Plug92') {
        alert('Access denied');
        window.location.href = '/';
        return;
      }
      setShowAdmin(true);
    }
  }, []);

  const filteredJobs = cleanJobs.filter(job => {
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: string): number => {
    if (category === 'All') return cleanJobs.length;
    return cleanJobs.filter(job => job.category === category).length;
  };

  if (showAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #012920, #065f46)', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            background: 'rgba(215, 188, 105, 0.1)', 
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(215, 188, 105, 0.3)'
          }}>
            <h2 style={{ color: '#d7bc69', marginBottom: '20px', fontSize: '24px' }}>Admin Dashboard</h2>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <button 
                onClick={importFromGoogleSheets}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #d7bc69, #eab308)',
                  color: '#012920',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}
              >
                Import from Google Sheets
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '12px 16px', 
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}>
                <strong style={{ color: '#ef4444' }}>Pending Review:</strong> <span style={{ color: '#d7bc69' }}>{pendingJobs.length}</span>
              </div>
              <div style={{ 
                background: 'rgba(34, 197, 94, 0.1)', 
                padding: '12px 16px', 
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <strong style={{ color: '#22c55e' }}>Live Jobs:</strong> <span style={{ color: '#d7bc69' }}>{cleanJobs.length}</span>
              </div>
            </div>
          </div>

          {/* Pending Jobs Section */}
          <div style={{ 
            background: 'rgba(215, 188, 105, 0.1)', 
            borderRadius: '12px',
            padding: '24px',
            border: '1px solid rgba(215, 188, 105, 0.3)'
          }}>
            <h3 style={{ color: '#d7bc69', marginBottom: '20px', fontSize: '20px' }}>
              Jobs Pending Review ({pendingJobs.length})
            </h3>
            
            {pendingJobs.length === 0 ? (
              <p style={{ color: '#047857', textAlign: 'center', padding: '40px' }}>
                All caught up! No jobs need review right now.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {pendingJobs.map(job => (
                  <div key={job.id} style={{
                    background: 'rgba(1, 41, 32, 0.8)',
                    border: '1px solid rgba(215, 188, 105, 0.3)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    {editingJob?.id === job.id ? (
                      // Edit Mode
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ color: '#d7bc69', display: 'block', marginBottom: '4px' }}>Title:</label>
                          <input
                            type="text"
                            value={editingJob.extracted_title}
                            onChange={(e) => setEditingJob({...editingJob, extracted_title: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: 'rgba(215, 188, 105, 0.1)',
                              border: '1px solid rgba(215, 188, 105, 0.3)',
                              borderRadius: '4px',
                              color: '#d7bc69'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ color: '#d7bc69', display: 'block', marginBottom: '4px' }}>Company:</label>
                          <input
                            type="text"
                            value={editingJob.company}
                            onChange={(e) => setEditingJob({...editingJob, company: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: 'rgba(215, 188, 105, 0.1)',
                              border: '1px solid rgba(215, 188, 105, 0.3)',
                              borderRadius: '4px',
                              color: '#d7bc69'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ color: '#d7bc69', display: 'block', marginBottom: '4px' }}>Category:</label>
                          <select
                            value={editingJob.suggested_category}
                            onChange={(e) => setEditingJob({...editingJob, suggested_category: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: 'rgba(215, 188, 105, 0.1)',
                              border: '1px solid rgba(215, 188, 105, 0.3)',
                              borderRadius: '4px',
                              color: '#d7bc69'
                            }}
                          >
                            {Object.keys(JOB_CATEGORIES).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => updateJob(editingJob)}
                            style={{
                              padding: '8px 16px',
                              background: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingJob(null)}
                            style={{
                              padding: '8px 16px',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <div style={{ marginBottom: '16px' }}>
                          <h4 style={{ color: '#d7bc69', fontSize: '18px', marginBottom: '4px' }}>
                            {job.extracted_title}
                          </h4>
                          <p style={{ color: '#047857', marginBottom: '4px' }}>{job.company}</p>
                          <p style={{ color: '#6b7280', fontSize: '14px' }}>Category: {job.suggested_category}</p>
                          <p style={{ color: '#6b7280', fontSize: '12px' }}>
                            Confidence: {Math.round((job.confidence_score || 0) * 100)}%
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <button
                            onClick={() => approveJob(job.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          
                          <button
                            onClick={() => setEditingJob(job)}
                            style={{
                              padding: '8px 16px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Edit size={16} />
                            Edit
                          </button>
                          
                          <button
                            onClick={() => rejectJob(job.id)}
                            style={{
                              padding: '8px 16px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Trash2 size={16} />
                            Reject
                          </button>
                          
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '8px 16px',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Eye size={16} />
                            View Job
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main public site remains the same
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${THEME_CONFIG.colors.emeraldDark} 0%, ${THEME_CONFIG.colors.emeraldMedium} 50%, ${THEME_CONFIG.colors.emeraldDark} 100%)`
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(1, 41, 32, 0.9)',
    backdropFilter: 'blur(4px)',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: `1px solid rgba(215, 188, 105, 0.3)`,
    padding: '24px'
  };

  const buttonStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`,
    color: THEME_CONFIG.colors.emeraldDark,
    padding: '12px 24px',
    borderRadius: '12px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    textDecoration: 'none'
  };

  const categoryButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    width: '100%',
    textAlign: 'left' as const,
    padding: '16px',
    marginBottom: '12px',
    borderRadius: '12px',
    fontWeight: '500',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    background: isSelected 
      ? `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`
      : 'transparent',
    color: isSelected ? THEME_CONFIG.colors.emeraldDark : THEME_CONFIG.colors.goldLight,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: isSelected ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : 'none'
  });

  return (
    <div style={containerStyle}>
      <header style={{
        background: 'rgba(1, 41, 32, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderBottom: `2px solid ${THEME_CONFIG.colors.goldLight}`,
        padding: '2rem 0'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: `linear-gradient(135deg, ${THEME_CONFIG.colors.emeraldDark}, ${THEME_CONFIG.colors.emeraldMedium})`,
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: `2px solid ${THEME_CONFIG.colors.goldLight}`
              }}>
                <span style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  background: `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>BP</span>
              </div>
            </div>
            
            <h1 style={{
              fontSize: '48px',
              fontWeight: '900',
              color: THEME_CONFIG.colors.goldLight,
              marginBottom: '12px'
            }}>Borderless Plug</h1>
            <p style={{
              fontSize: '20px',
              color: THEME_CONFIG.colors.goldLight,
              marginBottom: '12px',
              fontWeight: '600'
            }}>Breaking Borders Building Careers</p>
            <p style={{
              fontSize: '18px',
              color: THEME_CONFIG.colors.emeraldLight,
              fontStyle: 'italic',
              fontWeight: '500'
            }}>"Find jobs freely, stand out professionally"</p>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={cardStyle}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: THEME_CONFIG.colors.goldLight, 
                marginBottom: '24px', 
                display: 'flex', 
                alignItems: 'center' 
              }}>
                <Filter size={20} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                Job Categories
              </h3>
              
              <button
                onClick={() => setSelectedCategory('All')}
                style={categoryButtonStyle(selectedCategory === 'All')}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Star size={20} style={{ marginRight: '12px' }} />
                  <span>All Jobs</span>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{getCategoryCount('All')}</span>
              </button>
              
              {Object.entries(JOB_CATEGORIES).map(([category, data]) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={categoryButtonStyle(selectedCategory === category)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IconComponent name={data.icon} size={20} color={selectedCategory === category ? THEME_CONFIG.colors.emeraldDark : THEME_CONFIG.colors.goldLight} />
                    <span style={{ marginLeft: '12px' }}>{category}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{getCategoryCount(category)}</span>
                </button>
              ))}
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Award size={24} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: THEME_CONFIG.colors.goldLight }}>Resume & LinkedIn Pro</h3>
              </div>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '24px', 
                color: THEME_CONFIG.colors.goldLight 
              }}>Professional resume writing and LinkedIn optimization that gets results.</p>
              <a
                href="https://wa.me/27844936238"
                target="_blank"
                rel="noopener noreferrer"
                style={buttonStyle}
              >
                <MessageCircle size={16} style={{ marginRight: '8px' }} />
                Get Started
              </a>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <TrendingUp size={24} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: THEME_CONFIG.colors.goldLight }}>Career Mastery</h3>
              </div>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '24px', 
                color: THEME_CONFIG.colors.goldLight 
              }}>Expert guidance for career growth and transitions.</p>
              <a
                href="https://wa.me/27679245039"
                target="_blank"
                rel="noopener noreferrer"
                style={buttonStyle}
              >
                <MessageCircle size={16} style={{ marginRight: '8px' }} />
                Level Up
              </a>
            </div>
          </div>

          <div style={{ minHeight: '600px' }}>
            <div style={{ ...cardStyle, marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={20} color={THEME_CONFIG.colors.goldLight} style={{ 
                  position: 'absolute', 
                  left: '16px', 
                  top: '50%', 
                  transform: 'translateY(-50%)'
                }} />
                <input
                  type="text"
                  placeholder="Search jobs, companies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '48px',
                    paddingRight: '16px',
                    paddingTop: '16px',
                    paddingBottom: '16px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: THEME_CONFIG.colors.goldLight,
                    outline: 'none'
                  }}
                />
                {loading && (
                  <RefreshCw size={20} color={THEME_CONFIG.colors.goldLight} style={{ 
                    position: 'absolute', 
                    right: '16px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {loading && (
                <div style={{ padding: '64px', textAlign: 'center' }}>
                  <RefreshCw size={48} color={THEME_CONFIG.colors.goldLight} style={{ 
                    margin: '0 auto 24px', 
                    display: 'block',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: THEME_CONFIG.colors.goldLight, 
                    marginBottom: '12px' 
                  }}>Loading Jobs...</h3>
                  <p style={{ color: THEME_CONFIG.colors.emeraldLight }}>
                    Fetching the latest approved opportunities
                  </p>
                </div>
              )}

              {!loading && filteredJobs.map(job => {
                const categoryData = JOB_CATEGORIES[job.category];
                
                return (
                  <div key={job.id} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '12px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          background: 'rgba(215, 188, 105, 0.2)',
                          border: '1px solid rgba(215, 188, 105, 0.3)',
                          transition: 'all 0.2s',
                          flexShrink: 0
                        }}>
                          <IconComponent 
                            name={categoryData?.icon || 'Briefcase'} 
                            size={24} 
                            color={THEME_CONFIG.colors.goldLight}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: THEME_CONFIG.colors.goldLight, 
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {job.title}
                          </h3>
                          <p style={{ 
                            color: THEME_CONFIG.colors.emeraldLight, 
                            fontWeight: '500',
                            marginBottom: '8px'
                          }}>{job.company}</p>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '16px', 
                            fontSize: '14px', 
                            color: 'rgba(215, 188, 105, 0.7)',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ 
                              padding: '4px 12px', 
                              borderRadius: '20px', 
                              fontSize: '12px', 
                              fontWeight: 'bold', 
                              color: THEME_CONFIG.colors.emeraldDark,
                              background: `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`
                            }}>
                              {job.category}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Globe size={16} style={{ marginRight: '4px' }} />
                              <span>Remote</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Clock size={16} style={{ marginRight: '4px' }} />
                              <span>Full-time</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...buttonStyle,
                          minWidth: '120px',
                          textAlign: 'center' as const
                        }}
                      >
                        Apply Now
                        <ExternalLink size={16} style={{ marginLeft: '8px' }} />
                      </a>
                    </div>
                  </div>
                );
              })}

              {!loading && filteredJobs.length === 0 && (
                <div style={{ padding: '64px', textAlign: 'center' }}>
                  <Briefcase size={64} color="rgba(215, 188, 105, 0.5)" style={{ 
                    margin: '0 auto 24px', 
                    display: 'block' 
                  }} />
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: THEME_CONFIG.colors.goldLight, 
                    marginBottom: '12px' 
                  }}>No jobs found</h3>
                  <p style={{ color: THEME_CONFIG.colors.emeraldLight }}>
                    {searchTerm 
                      ? `No jobs match "${searchTerm}"` 
                      : 'No approved jobs available yet'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RemoteJobBoard;