import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, Users, MessageCircle, Star, ArrowRight, Phone, RefreshCw, Globe, Award, TrendingUp, MapPin, Clock, ExternalLink, CheckCircle, Edit, Trash2, Eye } from 'lucide-react';
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
  modifier: string;
}

interface PendingJob {
  id: number;
  job_url: string;
  extracted_title: string;
  modifier: string;
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
// JOB MODIFIER OPTIONS
// ============================================
const JOB_MODIFIERS = [
  'Healthcare',
  'Tech/IT', 
  'Finance',
  'Remote-First',
  'B2B Focus',
  'B2C Focus',
  'Startup',
  'Enterprise',
  'Bachelors Required',
  'No Degree Required',
  'Entry Level',
  'Senior Level',
  'Part-time',
  'Contract',
  'Freelance',
  'Commission Based',
  'High Volume',
  'Consultative',
  'Inside Sales',
  'Field Sales',
  'International',
  'US Based',
  'Night Shift',
  'Day Shift',
  'Weekend Availability',
  'Bilingual Required'
];

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
  const [loading, setLoading] = useState<boolean>(false);
  const [editingJob, setEditingJob] = useState<PendingJob | null>(null);
  const [showCategories, setShowCategories] = useState<boolean>(false);

  // Check if mobile view
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadJobs = async (): Promise<void> => {
    setLoading(true);
    console.log('Loading from Supabase...');
    
    try {
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
          modifier: job.modifier || job.company || 'General',
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
        const formattedPendingJobs = pendingData.map((job: any) => ({
          ...job,
          modifier: job.modifier || job.company || 'General'
        }));
        setPendingJobs(formattedPendingJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractJobTitle = (url: string): string => {
    const parts = url.split('/');
    const jobPart = parts[parts.length - 1] || parts[parts.length - 2];
    return jobPart.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  const extractModifier = (url: string, title: string): string => {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const combinedText = `${urlLower} ${titleLower}`;
    
    if (combinedText.includes('healthcare') || combinedText.includes('medical')) return 'Healthcare';
    if (combinedText.includes('fintech') || combinedText.includes('finance') || combinedText.includes('banking')) return 'Finance';
    if (combinedText.includes('startup') || combinedText.includes('early stage')) return 'Startup';
    if (combinedText.includes('enterprise') || combinedText.includes('fortune')) return 'Enterprise';
    if (combinedText.includes('senior') || combinedText.includes('lead') || combinedText.includes('principal')) return 'Senior Level';
    if (combinedText.includes('junior') || combinedText.includes('entry') || combinedText.includes('graduate')) return 'Entry Level';
    if (combinedText.includes('degree required') || combinedText.includes('bachelors')) return 'Bachelors Required';
    if (combinedText.includes('remote first') || combinedText.includes('fully remote')) return 'Remote-First';
    if (combinedText.includes('part time') || combinedText.includes('part-time')) return 'Part-time';
    if (combinedText.includes('contract') || combinedText.includes('contractor')) return 'Contract';
    if (combinedText.includes('freelance')) return 'Freelance';
    if (combinedText.includes('b2b') || combinedText.includes('business to business')) return 'B2B Focus';
    if (combinedText.includes('b2c') || combinedText.includes('consumer')) return 'B2C Focus';
    if (combinedText.includes('inside sales')) return 'Inside Sales';
    if (combinedText.includes('field sales')) return 'Field Sales';
    if (combinedText.includes('high volume')) return 'High Volume';
    if (combinedText.includes('consultative')) return 'Consultative';
    
    return 'General';
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
        const modifier = extractModifier(url, title);
        const category = categorizeJob(url, title);
        const confidence = calculateConfidence(url, title, category);

        // Check if job already exists
        const { data: existingJob } = await supabase
          .from('job_review_queue')
          .select('id')
          .eq('job_url', url)
          .single();

        if (!existingJob) {
          const { error } = await supabase
            .from('job_review_queue')
            .insert({
              job_url: url,
              extracted_title: title,
              modifier: modifier,
              suggested_category: category,
              confidence_score: confidence,
              status: 'pending'
            });
          
          if (!error) importCount++;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Import completed: ${importCount} new jobs added for review`);
      
      if (importCount > 0) {
        sendWhatsAppNotification(importCount);
      }
      
      loadJobs();
      
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
✏️ Edit titles/modifiers before approval

Time to review and get these jobs live!`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/27679245039?text=${encodedMessage}`, '_blank');
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
                         job.modifier.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: string): number => {
    if (category === 'All') return cleanJobs.length;
    return cleanJobs.filter(job => job.category === category).length;
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
      loadJobs();
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

  const updateJob = async (updatedJob: PendingJob) => {
    const { error } = await supabase
      .from('job_review_queue')
      .update({
        extracted_title: updatedJob.extracted_title,
        modifier: updatedJob.modifier,
        suggested_category: updatedJob.suggested_category
      })
      .eq('id', updatedJob.id);

    if (!error) {
      setEditingJob(null);
      loadJobs();
    }
  };

  if (showAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #012920, #065f46)', padding: isMobile ? '16px' : '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            background: 'rgba(215, 188, 105, 0.1)', 
            borderRadius: '12px',
            padding: isMobile ? '16px' : '24px',
            marginBottom: '24px',
            border: '1px solid rgba(215, 188, 105, 0.3)'
          }}>
            <h2 style={{ color: '#d7bc69', marginBottom: '20px', fontSize: isMobile ? '20px' : '24px' }}>Admin Dashboard</h2>
            
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '16px', marginBottom: '24px' }}>
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
                  fontSize: '14px',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Import from Google Sheets
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
            padding: isMobile ? '16px' : '24px',
            border: '1px solid rgba(215, 188, 105, 0.3)'
          }}>
            <h3 style={{ color: '#d7bc69', marginBottom: '20px', fontSize: isMobile ? '18px' : '20px' }}>
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
                    padding: isMobile ? '16px' : '20px'
                  }}>
                    {editingJob?.id === job.id ? (
                      // Edit Mode
                      <div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ color: '#d7bc69', display: 'block', marginBottom: '4px', fontSize: isMobile ? '14px' : '16px' }}>Title:</label>
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
                              color: '#d7bc69',
                              fontSize: isMobile ? '14px' : '16px'
                            }}
                          />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <label style={{ color: '#d7bc69', display: 'block', marginBottom: '4px', fontSize: isMobile ? '14px' : '16px' }}>Modifier:</label>
                          <input
                            type="text"
                            list="modifier-options"
                            value={editingJob.modifier}
                            onChange={(e) => setEditingJob({...editingJob, modifier: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: 'rgba(215, 188, 105, 0.1)',
                              border: '1px solid rgba(215, 188, 105, 0.3)',
                              borderRadius: '4px',
                              color: '#d7bc69',
                              fontSize: isMobile ? '14px' : '16px'
                            }}
                          />
                          <datalist id="modifier-options">
                            {JOB_MODIFIERS.map(modifier => (
                              <option key={modifier} value={modifier}>{modifier}</option>
                            ))}
                          </datalist>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ color: '#d7bc69', display: 'block', marginBottom: '4px', fontSize: isMobile ? '14px' : '16px' }}>Category:</label>
                          <select
                            value={editingJob.suggested_category}
                            onChange={(e) => setEditingJob({...editingJob, suggested_category: e.target.value})}
                            style={{
                              width: '100%',
                              padding: '8px',
                              background: 'rgba(215, 188, 105, 0.1)',
                              border: '1px solid rgba(215, 188, 105, 0.3)',
                              borderRadius: '4px',
                              color: '#d7bc69',
                              fontSize: isMobile ? '14px' : '16px'
                            }}
                          >
                            {Object.keys(JOB_CATEGORIES).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
                          <button
                            onClick={() => updateJob(editingJob)}
                            style={{
                              padding: '8px 16px',
                              background: '#22c55e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: isMobile ? '14px' : '16px',
                              flex: isMobile ? 'none' : '1'
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
                              cursor: 'pointer',
                              fontSize: isMobile ? '14px' : '16px',
                              flex: isMobile ? 'none' : '1'
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
                          <h4 style={{ color: '#d7bc69', fontSize: isMobile ? '16px' : '18px', marginBottom: '4px' }}>
                            {job.extracted_title} ({job.modifier})
                          </h4>
                          <p style={{ color: '#6b7280', fontSize: isMobile ? '12px' : '14px' }}>Category: {job.suggested_category}</p>
                          <p style={{ color: '#6b7280', fontSize: isMobile ? '11px' : '12px' }}>
                            Confidence: {Math.round((job.confidence_score || 0) * 100)}%
                          </p>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', alignItems: isMobile ? 'stretch' : 'center' }}>
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
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: isMobile ? '14px' : '16px'
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
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: isMobile ? '14px' : '16px'
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
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: isMobile ? '14px' : '16px'
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
                              justifyContent: 'center',
                              gap: '4px',
                              fontSize: isMobile ? '14px' : '16px'
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

  // Mobile-first responsive layout
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
    padding: isMobile ? '16px' : '24px'
  };

  const buttonStyle: React.CSSProperties = {
    background: `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`,
    color: THEME_CONFIG.colors.emeraldDark,
    padding: isMobile ? '10px 16px' : '12px 24px',
    borderRadius: '12px',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    textDecoration: 'none',
    fontSize: isMobile ? '14px' : '16px'
  };

  const categoryButtonStyle = (isSelected: boolean): React.CSSProperties => ({
    width: '100%',
    textAlign: 'left' as const,
    padding: isMobile ? '12px' : '16px',
    marginBottom: '8px',
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
    boxShadow: isSelected ? '0 10px 25px -5px rgba(0, 0, 0, 0.2)' : 'none',
    fontSize: isMobile ? '14px' : '16px'
  });

  return (
    <div style={containerStyle}>
      <header style={{
        background: 'rgba(1, 41, 32, 0.95)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        borderBottom: `2px solid ${THEME_CONFIG.colors.goldLight}`,
        padding: isMobile ? '1.5rem 0' : '2rem 0'
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: isMobile ? '24px' : '48px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isMobile ? '16px' : '24px' }}>
              <img 
                src="/logo192.png" 
                alt="Borderless Plug Logo"
                style={{
                  width: isMobile ? '80px' : '120px',
                  height: isMobile ? '80px' : '120px',
                  objectFit: 'contain'
                }}
              />
            </div>
            
            <h1 style={{
              fontSize: isMobile ? '32px' : '48px',
              fontWeight: '900',
              color: THEME_CONFIG.colors.goldLight,
              marginBottom: '12px'
            }}>Borderless Plug</h1>
            <p style={{
              fontSize: isMobile ? '16px' : '20px',
              color: THEME_CONFIG.colors.goldLight,
              marginBottom: '12px',
              fontWeight: '600'
            }}>Breaking Borders Building Careers</p>
            <p style={{
              fontSize: isMobile ? '14px' : '18px',
              color: THEME_CONFIG.colors.emeraldLight,
              fontStyle: 'italic',
              fontWeight: '500'
            }}>"Find jobs freely, stand out professionally"</p>
          </div>
        </div>
      </header>

      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: isMobile ? '16px' : '32px 16px'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '400px 1fr', 
          gap: isMobile ? '16px' : '32px',
          alignItems: 'start'
        }}>
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? '16px' : '24px',
            order: isMobile ? 2 : 1
          }}>
            
            <div style={cardStyle}>
              <div 
                onClick={() => setShowCategories(!showCategories)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: isMobile ? 'pointer' : 'default',
                  marginBottom: isMobile && !showCategories ? '0' : '24px'
                }}
              >
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: THEME_CONFIG.colors.goldLight,
                  display: 'flex', 
                  alignItems: 'center',
                  margin: 0
                }}>
                  <Filter size={20} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                  Job Categories
                </h3>
                {isMobile && (
                  <ArrowRight 
                    size={20} 
                    color={THEME_CONFIG.colors.goldLight}
                    style={{ 
                      transform: showCategories ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s'
                    }}
                  />
                )}
              </div>
              
              {(!isMobile || showCategories) && (
                <div>
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
              )}
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

          <div style={{ minHeight: '600px', order: isMobile ? 1 : 2 }}>
            
            {selectedCategory === 'All' ? (
              <div>
                <div style={{ ...cardStyle, marginBottom: isMobile ? '16px' : '24px', textAlign: 'center' }}>
                  <h2 style={{ 
                    fontSize: isMobile ? '20px' : '24px',
                    fontWeight: 'bold', 
                    color: THEME_CONFIG.colors.goldLight, 
                    marginBottom: '8px' 
                  }}>Choose Your Career Path</h2>
                  <p style={{ 
                    color: THEME_CONFIG.colors.emeraldLight,
                    fontSize: isMobile ? '14px' : '16px'
                  }}>Select a category to explore available opportunities</p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: isMobile ? '16px' : '20px'
                }}>
                  {Object.entries(JOB_CATEGORIES).map(([category, data]) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      style={{
                        ...cardStyle,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        border: '2px solid rgba(215, 188, 105, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 32px 64px -12px rgba(0, 0, 0, 0.4)';
                        e.currentTarget.style.borderColor = THEME_CONFIG.colors.goldLight;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
                        e.currentTarget.style.borderColor = 'rgba(215, 188, 105, 0.3)';
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          width: isMobile ? '64px' : '80px',
                          height: isMobile ? '64px' : '80px',
                          background: 'rgba(215, 188, 105, 0.2)',
                          border: '2px solid rgba(215, 188, 105, 0.4)',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          transition: 'all 0.3s ease'
                        }}>
                          <IconComponent 
                            name={data.icon} 
                            size={isMobile ? 28 : 36}
                            color={THEME_CONFIG.colors.goldLight}
                          />
                        </div>
                        
                        <h3 style={{
                          fontSize: isMobile ? '18px' : '22px',
                          fontWeight: 'bold',
                          color: THEME_CONFIG.colors.goldLight,
                          marginBottom: '12px'
                        }}>
                          {category}
                        </h3>
                        
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`,
                          color: THEME_CONFIG.colors.emeraldDark,
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: isMobile ? '14px' : '16px',
                          fontWeight: 'bold',
                          marginBottom: '16px'
                        }}>
                          <span>{getCategoryCount(category)} Jobs Available</span>
                          <ArrowRight size={16} style={{ marginLeft: '8px' }} />
                        </div>
                        
                        <p style={{
                          color: THEME_CONFIG.colors.emeraldLight,
                          fontSize: isMobile ? '13px' : '14px',
                          lineHeight: '1.4',
                          opacity: 0.8
                        }}>
                          {category === 'I.T.' && 'Software development, programming, and tech roles'}
                          {category === 'Sales' && 'Business development and sales opportunities'}
                          {category === 'Virtual Assistant' && 'Administrative and support positions'}
                          {category === 'Customer Service' && 'Client support and help desk roles'}
                          {category === 'H.R.' && 'Human resources and recruiting positions'}
                          {category === 'Design' && 'Creative and visual design opportunities'}
                          {category === 'Marketing' && 'Digital marketing and growth roles'}
                          {category === 'Operations' && 'Business operations and management'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ ...cardStyle, marginBottom: isMobile ? '16px' : '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <IconComponent 
                        name={JOB_CATEGORIES[selectedCategory]?.icon || 'Briefcase'}
                        size={24}
                        color={THEME_CONFIG.colors.goldLight}
                      />
                      <h2 style={{ 
                        fontSize: isMobile ? '20px' : '24px',
                        fontWeight: 'bold', 
                        color: THEME_CONFIG.colors.goldLight, 
                        marginLeft: '12px',
                        marginBottom: 0
                      }}>{selectedCategory} Jobs</h2>
                    </div>
                    <button
                      onClick={() => setSelectedCategory('All')}
                      style={{
                        background: 'transparent',
                        border: `2px solid ${THEME_CONFIG.colors.goldLight}`,
                        color: THEME_CONFIG.colors.goldLight,
                        padding: '8px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: isMobile ? '12px' : '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ← Back to Categories
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredJobs.map(job => {
                    const categoryData = JOB_CATEGORIES[job.category];
                    
                    return (
                      <div key={job.id} style={cardStyle}>
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: isMobile ? 'column' : 'row',
                          justifyContent: 'space-between', 
                          alignItems: isMobile ? 'flex-start' : 'flex-start',
                          gap: isMobile ? '16px' : '0'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1 }}>
                            <div style={{ 
                              width: isMobile ? '40px' : '48px', 
                              height: isMobile ? '40px' : '48px',
                              borderRadius: '12px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: 'rgba(215, 188, 105, 0.2)',
                              border: '1px solid rgba(215, 188, 105, 0.3)',
                              flexShrink: 0
                            }}>
                              <IconComponent 
                                name={categoryData?.icon || 'Briefcase'} 
                                size={isMobile ? 20 : 24}
                                color={THEME_CONFIG.colors.goldLight}
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <h3 style={{ 
                                fontSize: isMobile ? '16px' : '18px',
                                fontWeight: 'bold', 
                                color: THEME_CONFIG.colors.goldLight, 
                                marginBottom: '8px'
                              }}>
                                {job.title} ({job.modifier})
                              </h3>
                              <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: isMobile ? '12px' : '16px',
                                fontSize: isMobile ? '12px' : '14px',
                                color: 'rgba(215, 188, 105, 0.7)',
                                flexWrap: 'wrap'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <Globe size={14} style={{ marginRight: '4px' }} />
                                  <span>Remote</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <Clock size={14} style={{ marginRight: '4px' }} />
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
                              minWidth: isMobile ? '100%' : '120px',
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

                  {filteredJobs.length === 0 && (
                    <div style={{ padding: isMobile ? '32px' : '64px', textAlign: 'center' }}>
                      <Briefcase size={isMobile ? 48 : 64} color="rgba(215, 188, 105, 0.5)" style={{ 
                        margin: '0 auto 24px', 
                        display: 'block' 
                      }} />
                      <h3 style={{ 
                        fontSize: isMobile ? '18px' : '20px',
                        fontWeight: 'bold', 
                        color: THEME_CONFIG.colors.goldLight, 
                        marginBottom: '12px' 
                      }}>No {selectedCategory} jobs available</h3>
                      <p style={{ 
                        color: THEME_CONFIG.colors.emeraldLight,
                        fontSize: isMobile ? '14px' : '16px'
                      }}>
                        Check back soon or explore other categories
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .mobile-category-toggle {
            cursor: pointer;
          }
        }
      `}</style>
    </div>
  );
};

export default RemoteJobBoard;