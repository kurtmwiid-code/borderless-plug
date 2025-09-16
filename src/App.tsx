import React, { useState, useEffect } from 'react';
import { Search, Filter, Briefcase, Users, MessageCircle, Star, ArrowRight, Phone, RefreshCw, Globe, Award, TrendingUp, MapPin, Clock, ExternalLink, CheckCircle } from 'lucide-react';
import MobileAdminPanel from './MobileAdminPanel';
import { useJobMonitoring, JobIssueDetector } from './WhatsAppJobMonitor';

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
    emeraldDark: '#012920',    // Your exact emerald
    emeraldMedium: '#065f46', 
    emeraldLight: '#047857',
    goldLight: '#d7bc69',     // Your exact gold
    goldMedium: '#eab308',
    goldDark: '#a16207',
    white: '#ffffff',
    gray: '#6b7280',
    grayLight: '#f3f4f6'
  } as ThemeColors
};

// ============================================
// GOOGLE SHEETS CONFIGURATION
// ============================================
const GOOGLE_SHEETS_CONFIG = {
  SHEET_ID: '1imnNLvoNw_LZfI0pb18a0D9ktW10ixEdA7tOXOjNqRU',
  RANGE: 'A:A',
  API_KEY: null
};

// ============================================
// FIXED GOOGLE SHEETS DATA FETCHER - NO DUMMY DATA
// ============================================
const fetchJobsFromGoogleSheets = async (): Promise<string[]> => {
  try {
    const sheetId = GOOGLE_SHEETS_CONFIG.SHEET_ID;
    
    // ✅ REMOVED THE DUMMY DATA CHECK - Your real sheet will now work
    // The problematic check that returned dummy data has been eliminated
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&range=A:A`;
    
    console.log('🔄 Fetching jobs from Google Sheets...');
    console.log(`📊 Using Sheet ID: ${sheetId}`);
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log('📄 Raw CSV received:', csvText.substring(0, 200) + '...');
    
    const lines = csvText.split('\n');
    const jobUrls = lines
      .slice(1)
      .map(line => line.replace(/"/g, '').trim())
      .filter(line => line && line.startsWith('http'));
    
    console.log(`✅ Successfully loaded ${jobUrls.length} jobs from Google Sheets!`);
    return jobUrls;
    
  } catch (error) {
    console.error('❌ Error fetching from Google Sheets:', error);
    console.log('🚨 No fallback data - check your Google Sheets configuration');
    
    // Return empty array instead of dummy data
    return [];
  }
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
// AUTO-CATEGORIZATION FUNCTION
// ============================================
const categorizeJob = (jobUrl: string, jobTitle: string = ''): string => {
  const urlLower = jobUrl.toLowerCase();
  const titleLower = jobTitle.toLowerCase();
  const combinedText = `${urlLower} ${titleLower}`;
  
  // Check H.R. first
  const hrKeywords = ['hr', 'human resources', 'recruiting', 'recruiter', 'talent', 'hiring', 'people operations', 'people', 'talent acquisition', 'hr manager', 'hr-manager', 'hrmanager'];
  for (const keyword of hrKeywords) {
    if (combinedText.includes(keyword)) {
      return 'H.R.';
    }
  }
  
  // Check Sales
  const salesKeywords = ['sales', 'business development', 'bdr', 'sdr', 'account executive', 'account manager', 'business development rep', 'sales development rep', 'revenue', 'partnerships', 'lead generation', 'sales development representative'];
  for (const keyword of salesKeywords) {
    if (combinedText.includes(keyword)) {
      return 'Sales';
    }
  }
  
  // Check other categories
  for (const [category, data] of Object.entries(JOB_CATEGORIES)) {
    if (category === 'H.R.' || category === 'Sales') continue;
    
    for (const keyword of data.keywords) {
      if (combinedText.includes(keyword)) {
        return category;
      }
    }
  }
  
  return 'Operations';
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cleanJobs, setCleanJobs] = useState<Job[]>([]); // Only approved jobs for public
  const [problematicJobs, setProblematicJobs] = useState<Job[]>([]); // Jobs needing review
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);

  // WhatsApp monitoring hook
  const { processNewJobs, sendNotificationForJob } = useJobMonitoring();

  useEffect(() => {
    loadJobs();
  }, []);

  // Admin password protection
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

  const loadJobs = async (): Promise<void> => {
    setLoading(true);
    console.log('🚀 Loading jobs from Google Sheets...');
    
    const jobUrls = await fetchJobsFromGoogleSheets();
    
    const categorizedJobs: Job[] = jobUrls.map((url, index) => {
      const title = extractJobTitle(url);
      return {
        id: index + 1,
        url: url,
        category: categorizeJob(url, title),
        title: title,
        company: extractCompany(url)
      };
    });
    
    // Separate clean jobs from problematic ones
    const { cleanJobs: approvedJobs, problematicJobs: flaggedJobs } = filterJobs(categorizedJobs);
    
    setJobs(categorizedJobs); // All jobs (for admin)
    setCleanJobs(approvedJobs); // Only clean jobs (for public)
    setProblematicJobs(flaggedJobs); // Store problematic jobs for admin
    setLastUpdated(new Date());
    setLoading(false);
    
    console.log(`✅ Loaded ${categorizedJobs.length} total jobs`);
    console.log(`👀 ${approvedJobs.length} clean jobs shown to public`);
    console.log(`🚨 ${flaggedJobs.length} problematic jobs sent to admin`);

    // ONLY send batch WhatsApp notification if we're in admin mode
    // NEVER send notifications to regular users visiting the site
    if (flaggedJobs.length > 0 && window.location.pathname === '/admin') {
      // Create a single batch summary message
      const batchMessage = `🚨 BORDERLESS PLUG BATCH ALERT

📊 SUMMARY:
• ${flaggedJobs.length} jobs need review
• ${flaggedJobs.filter(job => JobIssueDetector.detectIssues(job).some(issue => issue.severity === 'HIGH')).length} high priority issues

🔍 TOP ISSUES:
${flaggedJobs.slice(0, 5).map((job, index) => {
  const issues = JobIssueDetector.detectIssues(job);
  const mainIssue = issues[0]?.reason || 'Needs review';
  return `${index + 1}. "${job.title}" - ${mainIssue}`;
}).join('\n')}
${flaggedJobs.length > 5 ? `... and ${flaggedJobs.length - 5} more` : ''}

💻 REVIEW ALL: ${window.location.origin}/admin

Quick Actions:
✅ Reply "REVIEWING" when you start
📝 Reply "DONE" when finished
🔄 Reply "REFRESH" for new batch`;

      // Open ONE WhatsApp tab with batch summary ONLY for admin
      const encodedMessage = encodeURIComponent(batchMessage);
      const whatsappUrl = `https://wa.me/27679245039?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      console.log(`📱 Sent batch notification for ${flaggedJobs.length} problematic jobs`);
    }
  };

  // Filter out problematic jobs from public view
  const filterJobs = (allJobs: Job[]) => {
    const cleanJobs: Job[] = [];
    const problematicJobs: Job[] = [];

    allJobs.forEach(job => {
      const issues = JobIssueDetector.detectIssues(job);
      if (issues.length > 0) {
        problematicJobs.push(job);
      } else {
        cleanJobs.push(job);
      }
    });

    return { cleanJobs, problematicJobs };
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
    if (url.includes('angel.co')) return 'AngelList';
    if (url.includes('upwork')) return 'Upwork';
    if (url.includes('indeed')) return 'Indeed';
    if (url.includes('linkedin')) return 'LinkedIn';
    if (url.includes('glassdoor')) return 'Glassdoor';
    if (url.includes('ziprecruiter')) return 'ZipRecruiter';
    if (url.includes('monster')) return 'Monster';
    if (url.includes('careerbuilder')) return 'CareerBuilder';
    if (url.includes('dice')) return 'Dice';
    if (url.includes('stackoverflow')) return 'Stack Overflow';
    if (url.includes('github')) return 'GitHub Jobs';
    if (url.includes('freelancer')) return 'Freelancer';
    if (url.includes('fiverr')) return 'Fiverr';
    
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Remote Company';
    }
  };

  // Use CLEAN jobs for public filtering (not all jobs)
  const filteredJobs = cleanJobs.filter(job => {
    const matchesCategory = selectedCategory === 'All' || job.category === selectedCategory;
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryCount = (category: string): number => {
    if (category === 'All') return cleanJobs.length; // Count only clean jobs
    return cleanJobs.filter(job => job.category === category).length;
  };

  // Admin panel check - pass real problematic jobs
  if (showAdmin) {
    return <MobileAdminPanel problematicJobs={problematicJobs} />;
  }

  // ============================================
  // STYLES
  // ============================================
  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: `linear-gradient(135deg, ${THEME_CONFIG.colors.emeraldDark} 0%, ${THEME_CONFIG.colors.emeraldMedium} 50%, ${THEME_CONFIG.colors.emeraldDark} 100%)`
  };

  const headerStyle: React.CSSProperties = {
    background: `rgba(1, 41, 32, 0.95)`,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    borderBottom: `2px solid ${THEME_CONFIG.colors.goldLight}`,
    padding: '2rem 0'
  };

  const logoStyle: React.CSSProperties = {
    width: '80px',
    height: '80px',
    background: `linear-gradient(135deg, ${THEME_CONFIG.colors.emeraldDark}, ${THEME_CONFIG.colors.emeraldMedium})`,
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: `2px solid ${THEME_CONFIG.colors.goldLight}`,
    position: 'relative' as const
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
      {/* Header Section */}
      <header style={headerStyle}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            {/* Logo Section */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <div style={logoStyle}>
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
            </div>
            
            <h1 style={{
              fontSize: '48px',
              fontWeight: '900',
              color: THEME_CONFIG.colors.goldLight,
              marginBottom: '12px',
              textAlign: 'center' as const
            }}>Borderless Plug</h1>
            <p style={{
              fontSize: '20px',
              color: THEME_CONFIG.colors.goldLight,
              marginBottom: '12px',
              fontWeight: '600',
              textAlign: 'center' as const
            }}>Breaking Borders Building Careers</p>
            <p style={{
              fontSize: '18px',
              color: THEME_CONFIG.colors.emeraldLight,
              fontStyle: 'italic',
              fontWeight: '500',
              textAlign: 'center' as const
            }}>"Find jobs freely, stand out professionally"</p>
            
            {/* Stats Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '32px', 
              marginTop: '32px', 
              fontSize: '14px', 
              color: THEME_CONFIG.colors.goldLight 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={20} color={THEME_CONFIG.colors.goldLight} />
                <span style={{ fontWeight: '500' }}>8 Categories</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '32px', alignItems: 'start' }}>
          
          {/* Sidebar - Categories & Services */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Category Filter */}
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
                onMouseEnter={(e) => {
                  if (selectedCategory !== 'All') {
                    e.currentTarget.style.background = `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`;
                    e.currentTarget.style.color = THEME_CONFIG.colors.emeraldDark;
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategory !== 'All') {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = THEME_CONFIG.colors.goldLight;
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
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
                  onMouseEnter={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.background = `linear-gradient(135deg, ${THEME_CONFIG.colors.goldLight}, ${THEME_CONFIG.colors.goldMedium})`;
                      e.currentTarget.style.color = THEME_CONFIG.colors.emeraldDark;
                      e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== category) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = THEME_CONFIG.colors.goldLight;
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <IconComponent name={data.icon} size={20} color={selectedCategory === category ? THEME_CONFIG.colors.emeraldDark : THEME_CONFIG.colors.goldLight} />
                    <span style={{ marginLeft: '12px' }}>{category}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{getCategoryCount(category)}</span>
                </button>
              ))}
            </div>

            {/* Resume & LinkedIn Services */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Award size={24} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: THEME_CONFIG.colors.goldLight }}>Resume & LinkedIn Pro</h3>
              </div>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '12px', 
                color: THEME_CONFIG.colors.goldLight, 
                fontStyle: 'italic', 
                fontWeight: '500' 
              }}>
                "Let your resume and profile do the talking"
              </p>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '24px', 
                color: THEME_CONFIG.colors.goldLight 
              }}>
                Professional resume writing and LinkedIn optimization that gets results.
              </p>
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

            {/* Career Coaching Services */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <TrendingUp size={24} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: THEME_CONFIG.colors.goldLight }}>Career Mastery</h3>
              </div>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '12px', 
                color: THEME_CONFIG.colors.goldLight, 
                fontStyle: 'italic', 
                fontWeight: '500' 
              }}>
                "Transform your career trajectory"
              </p>
              <div style={{ fontSize: '14px', marginBottom: '24px', color: THEME_CONFIG.colors.goldLight }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <CheckCircle size={16} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '8px' }} />
                  <span>Graduate career guidance</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <CheckCircle size={16} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '8px' }} />
                  <span>Sales performance coaching</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <CheckCircle size={16} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '8px' }} />
                  <span>Remote career transitions</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle size={16} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '8px' }} />
                  <span>Strategic skill development</span>
                </div>
              </div>
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

          {/* Main Content - CLEAN Job Listings Only */}
          <div style={{ minHeight: '600px' }}>
            
            {/* Search Bar */}
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

            {/* Job Listings - CLEAN JOBS ONLY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Loading State */}
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
                    Fetching the latest remote opportunities from your Google Sheets
                  </p>
                </div>
              )}

              {/* Clean Job Cards - NO ALERT BANNERS */}
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
                          background: `rgba(215, 188, 105, 0.2)`,
                          border: `1px solid rgba(215, 188, 105, 0.3)`,
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
                            color: `rgba(215, 188, 105, 0.7)`,
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(0, 0, 0, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)';
                          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        Apply Now
                        <ExternalLink size={16} style={{ marginLeft: '8px' }} />
                      </a>
                    </div>
                  </div>
                );
              })}

              {/* Empty State */}
              {!loading && filteredJobs.length === 0 && (
                <div style={{ padding: '64px', textAlign: 'center' }}>
                  <Briefcase size={64} color={`rgba(215, 188, 105, 0.5)`} style={{ 
                    margin: '0 auto 24px', 
                    display: 'block' 
                  }} />
                  <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: THEME_CONFIG.colors.goldLight, 
                    marginBottom: '12px' 
                  }}>No jobs found</h3>
                  <p style={{ color: THEME_CONFIG.colors.emeraldLight, marginBottom: '24px' }}>
                    {searchTerm 
                      ? `No jobs match "${searchTerm}" in ${selectedCategory === 'All' ? 'any category' : selectedCategory}`
                      : `No jobs available in ${selectedCategory === 'All' ? 'any category' : selectedCategory}`
                    }
                  </p>
                  {(searchTerm || selectedCategory !== 'All') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('All');
                      }}
                      style={{
                        ...buttonStyle,
                        background: 'transparent',
                        color: THEME_CONFIG.colors.goldLight,
                        border: `1px solid ${THEME_CONFIG.colors.goldLight}`
                      }}
                    >
                      <RefreshCw size={16} style={{ marginRight: '8px' }} />
                      Clear Filters
                    </button>
                  )}
                </div>
              )}

              {/* Results Summary */}
              {!loading && filteredJobs.length > 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '24px', 
                  color: THEME_CONFIG.colors.emeraldLight,
                  fontSize: '14px'
                }}>
                  Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} 
                  {selectedCategory !== 'All' && ` in ${selectedCategory}`}
                  {searchTerm && ` matching "${searchTerm}"`}
                  {lastUpdated && (
                    <div style={{ marginTop: '8px', fontSize: '12px', opacity: 0.7 }}>
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Footer with Services Highlight */}
      <footer style={{ 
        background: `linear-gradient(135deg, ${THEME_CONFIG.colors.emeraldDark}, ${THEME_CONFIG.colors.emeraldMedium})`, 
        color: THEME_CONFIG.colors.white, 
        padding: '64px 0' 
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            marginBottom: '24px', 
            color: THEME_CONFIG.colors.goldLight 
          }}>Ready to Get Plugged In to Borderless Success?</h2>
          <p style={{ 
            color: THEME_CONFIG.colors.emeraldLight, 
            marginBottom: '48px', 
            maxWidth: '768px', 
            margin: '0 auto 48px', 
            fontSize: '18px' 
          }}>
            Don't just apply to jobs - get the complete Borderless Plug experience! Professional resume and LinkedIn optimization, plus expert career coaching to accelerate your remote success!
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '32px', 
            maxWidth: '1024px', 
            margin: '0 auto' 
          }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <Award size={32} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: THEME_CONFIG.colors.goldLight }}>Resume & LinkedIn Services</h3>
              </div>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '24px', 
                color: THEME_CONFIG.colors.emeraldLight 
              }}>Professional resume writing and LinkedIn optimization</p>
              <a
                href="https://wa.me/27844936238"
                target="_blank"
                rel="noopener noreferrer"
                style={buttonStyle}
              >
                <Phone size={16} style={{ marginRight: '8px' }} />
                +27 84 493 6238
              </a>
            </div>
            
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                <TrendingUp size={32} color={THEME_CONFIG.colors.goldLight} style={{ marginRight: '12px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: THEME_CONFIG.colors.goldLight }}>Career Coaching</h3>
              </div>
              <p style={{ 
                fontSize: '14px', 
                marginBottom: '24px', 
                color: THEME_CONFIG.colors.emeraldLight 
              }}>Expert guidance for career growth and transitions</p>
              <a
                href="https://wa.me/27679245039"
                target="_blank"
                rel="noopener noreferrer"
                style={buttonStyle}
              >
                <Phone size={16} style={{ marginRight: '8px' }} />
                +27 67 924 5039
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        button:hover {
          transform: translateY(-2px);
        }
        
        a:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default RemoteJobBoard;