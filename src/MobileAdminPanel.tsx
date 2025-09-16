import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Edit3, RefreshCw, Plus, Search, Filter, AlertCircle, Clock, ExternalLink, Save, X } from 'lucide-react';

// ============================================
// TYPESCRIPT INTERFACES
// ============================================
interface JobToReview {
  id: number;
  job_url: string;
  extracted_title: string;
  suggested_category: string;
  confidence_score: number;
  needs_review: boolean;
  review_reason: string;
  created_at: string;
}

interface LearnedTitle {
  base_title: string;
  modifier: string;
  full_display_title: string;
}

interface EditForm {
  baseTitle: string;
  modifier: string;
  category: string;
  customModifier: string;
}

// Mock Supabase data - replace with actual Supabase connection
const mockSupabaseData = {
  jobsNeedingReview: [
    {
      id: 1,
      job_url: 'https://recruitcrm.io/jobs/executive-assistant-tech-startup',
      extracted_title: 'Executive Assistant Tech Startup',
      suggested_category: 'Virtual Assistant',
      confidence_score: 75,
      needs_review: true,
      review_reason: 'Similar titles categorized differently before',
      created_at: '2025-09-16T10:30:00Z'
    },
    {
      id: 2,
      job_url: 'https://weworkremotely.com/remote-jobs/sales-development-representative-saas',
      extracted_title: 'Sales Development Representative Saas',
      suggested_category: 'Sales',
      confidence_score: 90,
      needs_review: true,
      review_reason: 'New job pattern detected',
      created_at: '2025-09-16T09:15:00Z'
    },
    {
      id: 3,
      job_url: 'https://remoteok.io/remote-dev-jobs/python-developer-fintech',
      extracted_title: 'Python Developer Fintech',
      suggested_category: 'I.T.',
      confidence_score: 45,
      needs_review: true,
      review_reason: 'Low confidence categorization',
      created_at: '2025-09-16T08:45:00Z'
    }
  ] as JobToReview[],
  
  learnedTitles: [
    { base_title: 'Executive Assistant', modifier: 'Tech', full_display_title: 'Executive Assistant (Tech)' },
    { base_title: 'Executive Assistant', modifier: 'Healthcare', full_display_title: 'Executive Assistant (Healthcare)' },
    { base_title: 'Sales Development Rep', modifier: 'SaaS', full_display_title: 'Sales Development Rep (SaaS)' },
    { base_title: 'Virtual Assistant', modifier: 'E-commerce', full_display_title: 'Virtual Assistant (E-commerce)' },
    { base_title: 'Customer Success Manager', modifier: 'Startup', full_display_title: 'Customer Success Manager (Startup)' }
  ] as LearnedTitle[],
  
  quickModifiers: [
    'Tech', 'SaaS', 'Healthcare', 'Finance', 'E-commerce', 'Startup', 'Enterprise', 
    'Remote', '5+ Years', 'Entry Level', 'Senior', 'Lead', 'Manager'
  ] as string[]
};

const CATEGORIES = [
  'I.T.', 'Sales', 'Virtual Assistant', 'Customer Service', 
  'H.R.', 'Design', 'Marketing', 'Operations'
];

const THEME = {
  emerald: '#012920',
  gold: '#d7bc69',
  emeraldLight: '#047857',
  goldLight: '#f6e8a3'
};

const MobileAdminPanel: React.FC = () => {
  const [jobsToReview, setJobsToReview] = useState<JobToReview[]>([]);
  const [learnedTitles, setLearnedTitles] = useState<LearnedTitle[]>([]);
  const [quickModifiers, setQuickModifiers] = useState<string[]>([]);
  const [editingJob, setEditingJob] = useState<JobToReview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form states for editing
  const [editForm, setEditForm] = useState<EditForm>({
    baseTitle: '',
    modifier: '',
    category: '',
    customModifier: ''
  });

  useEffect(() => {
    // Simulate loading data from Supabase
    setTimeout(() => {
      setJobsToReview(mockSupabaseData.jobsNeedingReview);
      setLearnedTitles(mockSupabaseData.learnedTitles);
      setQuickModifiers(mockSupabaseData.quickModifiers);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredJobs = jobsToReview.filter(job => {
    const matchesSearch = job.extracted_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.suggested_category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'low-confidence') return matchesSearch && job.confidence_score < 70;
    if (filter === 'high-confidence') return matchesSearch && job.confidence_score >= 70;
    return matchesSearch;
  });

  const handleApprove = async (jobId: number): Promise<void> => {
    console.log('✅ Approving job:', jobId);
    // Here you would call Supabase to approve the job
    setJobsToReview(jobs => jobs.filter(job => job.id !== jobId));
  };

  const handleReject = async (jobId: number): Promise<void> => {
    console.log('❌ Rejecting job:', jobId);
    // Here you would call Supabase to reject the job
    setJobsToReview(jobs => jobs.filter(job => job.id !== jobId));
  };

  const handleEdit = (job: JobToReview): void => {
    setEditingJob(job);
    setEditForm({
      baseTitle: job.extracted_title.replace(/\s+(Tech|SaaS|Healthcare|Finance|E-commerce|Startup|Enterprise|Remote|Senior|Lead|Manager|\d+\+?\s*Years?|Entry\s*Level)$/i, ''),
      modifier: '',
      category: job.suggested_category,
      customModifier: ''
    });
  };

  const handleSaveEdit = async (): Promise<void> => {
    if (!editingJob) return;
    
    const finalTitle = editForm.modifier || editForm.customModifier 
      ? `${editForm.baseTitle} (${editForm.modifier || editForm.customModifier})`
      : editForm.baseTitle;

    console.log('💾 Saving job edit:', {
      jobId: editingJob.id,
      title: finalTitle,
      category: editForm.category
    });

    // Here you would save to Supabase and add to learned titles
    setJobsToReview(jobs => jobs.filter(job => job.id !== editingJob.id));
    setEditingJob(null);
  };

  const getUniqueBaseTitles = (): string[] => {
    return Array.from(new Set(learnedTitles.map(t => t.base_title)));
  };

  const getModifiersForTitle = (baseTitle: string): string[] => {
    return learnedTitles
      .filter(t => t.base_title === baseTitle)
      .map(t => t.modifier)
      .filter((m): m is string => Boolean(m));
  };

  const getConfidenceColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const formatTimeAgo = (timestamp: string): string => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: `linear-gradient(135deg, ${THEME.emerald}, ${THEME.emeraldLight})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: THEME.gold
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Loading Admin Panel...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${THEME.emerald}, ${THEME.emeraldLight})`,
      padding: '16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 'bold', 
          color: THEME.gold, 
          marginBottom: '8px',
          textAlign: 'center'
        }}>
          🚀 Borderless Plug Admin
        </h1>
        <p style={{ 
          color: THEME.goldLight, 
          textAlign: 'center',
          fontSize: '16px'
        }}>
          {filteredJobs.length} jobs need your attention
        </p>
      </div>

      {/* Search and Filter */}
      <div style={{ 
        background: 'rgba(1, 41, 32, 0.8)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px',
        backdropFilter: 'blur(4px)'
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <Search size={20} color={THEME.gold} style={{ 
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)'
          }} />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              borderRadius: '8px',
              border: `1px solid ${THEME.gold}30`,
              background: 'transparent',
              color: THEME.goldLight,
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: 'All Jobs', count: jobsToReview.length },
            { key: 'low-confidence', label: 'Low Confidence', count: jobsToReview.filter(j => j.confidence_score < 70).length },
            { key: 'high-confidence', label: 'High Confidence', count: jobsToReview.filter(j => j.confidence_score >= 70).length }
          ].map(filterOption => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              style={{
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                background: filter === filterOption.key 
                  ? `linear-gradient(135deg, ${THEME.gold}, ${THEME.goldLight})`
                  : 'transparent',
                color: filter === filterOption.key ? THEME.emerald : THEME.gold,
                border: `1px solid ${THEME.gold}50`,
                transition: 'all 0.2s'
              }}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredJobs.map(job => (
          <div key={job.id} style={{
            background: 'rgba(1, 41, 32, 0.9)',
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(4px)',
            border: `1px solid ${THEME.gold}30`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Job Header */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: THEME.gold,
                  margin: 0,
                  flex: 1,
                  marginRight: '12px'
                }}>
                  {job.extracted_title}
                </h3>
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: getConfidenceColor(job.confidence_score) + '20',
                  color: getConfidenceColor(job.confidence_score),
                  border: `1px solid ${getConfidenceColor(job.confidence_score)}40`
                }}>
                  {job.confidence_score}% confident
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <span style={{ 
                  color: THEME.goldLight,
                  background: `${THEME.gold}20`,
                  padding: '4px 8px',
                  borderRadius: '8px'
                }}>
                  {job.suggested_category}
                </span>
                <span style={{ color: `${THEME.gold}80`, display: 'flex', alignItems: 'center' }}>
                  <Clock size={14} style={{ marginRight: '4px' }} />
                  {formatTimeAgo(job.created_at)}
                </span>
              </div>

              {job.review_reason && (
                <div style={{ 
                  marginTop: '8px',
                  padding: '8px',
                  background: `${THEME.goldLight}10`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: THEME.goldLight,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <AlertCircle size={16} style={{ marginRight: '8px', flexShrink: 0 }} />
                  {job.review_reason}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleApprove(job.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '100px'
                }}
              >
                <CheckCircle size={16} style={{ marginRight: '6px' }} />
                Approve
              </button>

              <button
                onClick={() => handleEdit(job)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${THEME.gold}`,
                  background: 'transparent',
                  color: THEME.gold,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '100px'
                }}
              >
                <Edit3 size={16} style={{ marginRight: '6px' }} />
                Edit
              </button>

              <button
                onClick={() => handleReject(job.id)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '100px'
                }}
              >
                <XCircle size={16} style={{ marginRight: '6px' }} />
                Reject
              </button>

              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${THEME.goldLight}50`,
                  background: 'transparent',
                  color: THEME.goldLight,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingJob && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            background: THEME.emerald,
            borderRadius: '16px',
            padding: '24px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ color: THEME.gold, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                Edit Job
              </h3>
              <button
                onClick={() => setEditingJob(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: THEME.gold,
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Base Title Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: THEME.goldLight, fontSize: '14px', marginBottom: '6px' }}>
                Job Title
              </label>
              <input
                type="text"
                value={editForm.baseTitle}
                onChange={(e) => setEditForm({...editForm, baseTitle: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${THEME.gold}50`,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: THEME.goldLight,
                  fontSize: '16px'
                }}
                list="learned-titles"
              />
              <datalist id="learned-titles">
                {getUniqueBaseTitles().map(title => (
                  <option key={title} value={title} />
                ))}
              </datalist>
            </div>

            {/* Quick Modifier Dropdown */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: THEME.goldLight, fontSize: '14px', marginBottom: '6px' }}>
                Quick Modifier
              </label>
              <select
                value={editForm.modifier}
                onChange={(e) => setEditForm({...editForm, modifier: e.target.value, customModifier: ''})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${THEME.gold}50`,
                  background: THEME.emerald,
                  color: THEME.goldLight,
                  fontSize: '16px'
                }}
              >
                <option value="">Select modifier...</option>
                {quickModifiers.map(modifier => (
                  <option key={modifier} value={modifier}>{modifier}</option>
                ))}
              </select>
            </div>

            {/* Custom Modifier Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: THEME.goldLight, fontSize: '14px', marginBottom: '6px' }}>
                Or Custom Modifier
              </label>
              <input
                type="text"
                placeholder="e.g., Fintech, B2B, Series A..."
                value={editForm.customModifier}
                onChange={(e) => setEditForm({...editForm, customModifier: e.target.value, modifier: ''})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${THEME.gold}50`,
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: THEME.goldLight,
                  fontSize: '16px'
                }}
              />
            </div>

            {/* Category Dropdown */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', color: THEME.goldLight, fontSize: '14px', marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: `1px solid ${THEME.gold}50`,
                  background: THEME.emerald,
                  color: THEME.goldLight,
                  fontSize: '16px'
                }}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Preview */}
            <div style={{ 
              background: `${THEME.gold}20`,
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ color: THEME.goldLight, fontSize: '14px', marginBottom: '4px' }}>Preview:</div>
              <div style={{ color: THEME.gold, fontSize: '16px', fontWeight: 'bold' }}>
                {editForm.baseTitle}
                {(editForm.modifier || editForm.customModifier) && ` (${editForm.modifier || editForm.customModifier})`}
              </div>
              <div style={{ color: THEME.goldLight, fontSize: '14px' }}>
                Category: {editForm.category}
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveEdit}
                disabled={!editForm.baseTitle || !editForm.category}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: editForm.baseTitle && editForm.category 
                    ? `linear-gradient(135deg, ${THEME.gold}, ${THEME.goldLight})`
                    : '#666',
                  color: THEME.emerald,
                  fontWeight: 'bold',
                  cursor: editForm.baseTitle && editForm.category ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Save size={16} style={{ marginRight: '8px' }} />
                Save & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredJobs.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: THEME.goldLight
        }}>
          <CheckCircle size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            All caught up! 🎉
          </h3>
          <p>No jobs need review right now.</p>
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: ${THEME.gold} !important;
          box-shadow: 0 0 0 2px ${THEME.gold}30;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          transition: transform 0.2s;
        }
        
        button:active:not(:disabled) {
          transform: translateY(0px);
        }
        
        @media (max-width: 640px) {
          .job-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default MobileAdminPanel;