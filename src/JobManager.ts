// ============================================
// JOB MANAGER FOR YOUR EXISTING SUPABASE TABLE
// ============================================

import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react';

// Your Supabase configuration (get these from your project settings)
const supabaseUrl = 'https://aljnetqtbajiudehmzdv.supabase.co' // Your project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsam5ldHF0YmFqaXVkZWhtemR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTY2MDksImV4cCI6MjA3MzU5MjYwOX0.gDp3q-v5BKcHk_sIuB3AniKilUOoYisqyh8zJqJ2HaA' // Get from Settings > API
const supabase = createClient(supabaseUrl, supabaseKey)

// ============================================
// TYPES MATCHING YOUR TABLE STRUCTURE
// ============================================
interface JobRecord {
  id: number;
  job_url: string;
  extracted_title: string | null;
  suggested_category: string | null;
  confidence_score: number | null;
  company: string | null;
  status: 'pending' | 'approved' | 'rejected';
  issues: JobIssue[];
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

interface JobIssue {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
}

// ============================================
// JOB MANAGER CLASS
// ============================================
class JobManager {
  
  // Add new job to Supabase
  static async addJob(url: string): Promise<JobRecord | null> {
    try {
      // Extract basic info
      const title = this.extractJobTitle(url);
      const company = this.extractCompany(url);
      const category = this.categorizeJob(url, title);
      const issues = this.detectIssues({ url, title, company, category });
      
      // Calculate confidence score (0-1)
      const confidence_score = this.calculateConfidence(url, title, category);
      
      const { data, error } = await supabase
        .from('job_review_queue')
        .insert({
          job_url: url,
          extracted_title: title,
          company: company,
          suggested_category: category,
          confidence_score: confidence_score,
          status: issues.length > 0 ? 'pending' : 'approved',
          issues: issues
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`Job already exists: ${url}`);
          return null;
        }
        console.error('Error adding job:', error);
        return null;
      }

      console.log(`✅ Added job: ${title} (${data.status})`);

      // Send WhatsApp notification if job needs review
      if (issues.length > 0) {
        await this.sendWhatsAppAlert(data);
      }

      return data;
    } catch (error) {
      console.error('Error in addJob:', error);
      return null;
    }
  }

  // Import from Google Sheets with deduplication
  static async importFromGoogleSheets(): Promise<{ added: number, pending: number, skipped: number }> {
    try {
      console.log('🔄 Starting Google Sheets import...');
      
      // Fetch from your Google Sheet
      const sheetId = '1imnNLvoNw_LZfI0pb18a0D9ktW10ixEdA7tOXOjNqRU';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&range=A:A`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      
      const csvText = await response.text();
      console.log('📄 CSV Response length:', csvText.length);
      
      if (!csvText.trim()) {
        console.warn('⚠️ Empty CSV response - check if sheet is public');
        return { added: 0, pending: 0, skipped: 0 };
      }
      
      const lines = csvText.split('\n');
      const urls = lines
        .slice(1) // Skip header
        .map(line => line.replace(/"/g, '').trim())
        .filter(line => line && line.startsWith('http'));

      console.log(`📊 Found ${urls.length} URLs in Google Sheets`);

      if (urls.length === 0) {
        console.warn('⚠️ No valid URLs found in Google Sheets');
        return { added: 0, pending: 0, skipped: 0 };
      }

      // Process URLs in batches to avoid overwhelming Supabase
      let addedCount = 0;
      let pendingCount = 0;
      let skippedCount = 0;

      for (const url of urls) {
        const job = await this.addJob(url);
        if (job) {
          addedCount++;
          if (job.status === 'pending') pendingCount++;
        } else {
          skippedCount++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const result = { added: addedCount, pending: pendingCount, skipped: skippedCount };
      console.log(`✅ Import complete:`, result);

      // Send batch summary
      if (addedCount > 0) {
        await this.sendBatchSummary(result);
      }

      return result;

    } catch (error) {
      console.error('Import error:', error);
      return { added: 0, pending: 0, skipped: 0 };
    }
  }

  // Get approved jobs for public display
  static async getApprovedJobs(): Promise<JobRecord[]> {
    const { data, error } = await supabase
      .from('job_review_queue')
      .select('*')
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved jobs:', error);
      return [];
    }

    return data || [];
  }

  // Get pending jobs for admin review
  static async getPendingJobs(): Promise<JobRecord[]> {
    const { data, error } = await supabase
      .from('job_review_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending jobs:', error);
      return [];
    }

    return data || [];
  }

  // Approve job
  static async approveJob(jobId: number): Promise<boolean> {
    const { error } = await supabase
      .from('job_review_queue')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: 'admin'
      })
      .eq('id', jobId);

    if (!error) {
      console.log(`✅ Approved job ${jobId}`);
    }
    return !error;
  }

  // Reject job
  static async rejectJob(jobId: number, reason?: string): Promise<boolean> {
    const updateData: any = { status: 'rejected' };
    
    if (reason) {
      updateData.issues = [{ 
        type: 'manual_rejection', 
        severity: 'HIGH', 
        description: reason 
      }];
    }

    const { error } = await supabase
      .from('job_review_queue')
      .update(updateData)
      .eq('id', jobId);

    if (!error) {
      console.log(`❌ Rejected job ${jobId}: ${reason || 'No reason given'}`);
    }
    return !error;
  }

  // Subscribe to real-time changes
  static subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('job-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'job_review_queue'
      }, callback)
      .subscribe();
  }

  // Utility functions
  private static extractJobTitle(url: string): string {
    const parts = url.split('/');
    const jobPart = parts[parts.length - 1] || parts[parts.length - 2];
    return jobPart.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  private static extractCompany(url: string): string {
    if (url.includes('remote.co')) return 'Remote.co';
    if (url.includes('weworkremotely')) return 'WeWorkRemotely';
    if (url.includes('flexjobs')) return 'FlexJobs';
    if (url.includes('remoteok')) return 'RemoteOK';
    if (url.includes('angel.co')) return 'AngelList';
    if (url.includes('upwork')) return 'Upwork';
    if (url.includes('indeed')) return 'Indeed';
    if (url.includes('linkedin')) return 'LinkedIn';
    
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return 'Remote Company';
    }
  }

  private static categorizeJob(url: string, title: string): string {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    const combinedText = `${urlLower} ${titleLower}`;
    
    // Your existing categorization logic
    if (combinedText.includes('developer') || combinedText.includes('engineer') || combinedText.includes('programming')) return 'I.T.';
    if (combinedText.includes('sales') || combinedText.includes('business development')) return 'Sales';
    if (combinedText.includes('assistant') || combinedText.includes('admin')) return 'Virtual Assistant';
    if (combinedText.includes('customer') || combinedText.includes('support')) return 'Customer Service';
    if (combinedText.includes('hr') || combinedText.includes('recruiting')) return 'H.R.';
    if (combinedText.includes('design') || combinedText.includes('creative')) return 'Design';
    if (combinedText.includes('marketing') || combinedText.includes('social media')) return 'Marketing';
    
    return 'Operations';
  }

  private static calculateConfidence(url: string, title: string, category: string): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence for known job sites
    if (url.includes('remote.co') || url.includes('weworkremotely')) confidence += 0.3;
    if (url.includes('indeed') || url.includes('linkedin')) confidence += 0.2;
    
    // Boost for clear job titles
    if (title.length > 10) confidence += 0.1;
    if (title.includes('Senior') || title.includes('Lead')) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private static detectIssues(job: { url: string, title: string, company: string, category: string }): JobIssue[] {
    const issues: JobIssue[] = [];

    // Check URL validity
    if (!job.url.startsWith('http')) {
      issues.push({
        type: 'invalid_url',
        severity: 'HIGH',
        description: 'URL format is invalid'
      });
    }

    // Check title quality
    if (!job.title || job.title.length < 5) {
      issues.push({
        type: 'poor_title',
        severity: 'MEDIUM',
        description: 'Job title is too short or missing'
      });
    }

    // Check for generic company
    if (job.company === 'Remote Company') {
      issues.push({
        type: 'generic_company',
        severity: 'LOW',
        description: 'Company name could not be extracted'
      });
    }

    return issues;
  }

  private static async sendWhatsAppAlert(job: JobRecord): Promise<void> {
    const message = `🚨 NEW JOB NEEDS REVIEW

📋 ${job.extracted_title}
🏢 ${job.company}
📂 ${job.suggested_category}
🔗 ${job.job_url}

⚠️ Issues:
${job.issues.map(issue => `• ${issue.description}`).join('\n')}

💻 Review: ${window.location.origin}/admin

Actions: APPROVE ${job.id} | REJECT ${job.id}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/27679245039?text=${encodedMessage}`, '_blank');
  }

  private static async sendBatchSummary(result: { added: number, pending: number, skipped: number }): Promise<void> {
    const message = `📊 BORDERLESS PLUG SYNC COMPLETE

✅ ${result.added} jobs added
⏳ ${result.pending} need review  
⏭️ ${result.skipped} already exist

💻 Review: ${window.location.origin}/admin

Quick: Reply "REVIEW" to start`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/27679245039?text=${encodedMessage}`, '_blank');
  }
}


export default JobManager;

// React Hook for managing jobs with Supabase
export const useJobs = () => {
  const [approvedJobs, setApprovedJobs] = useState<JobRecord[]>([]);
  const [pendingJobs, setPendingJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    loadJobs();

    // Subscribe to real-time changes
    const subscription = JobManager.subscribeToChanges((payload) => {
      console.log('Real-time update:', payload);
      loadJobs(); // Refresh when data changes
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const [approved, pending] = await Promise.all([
        JobManager.getApprovedJobs(),
        JobManager.getPendingJobs()
      ]);
      
      setApprovedJobs(approved);
      setPendingJobs(pending);
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const importFromSheets = async () => {
    const result = await JobManager.importFromGoogleSheets();
    console.log('Import result:', result);
    return result;
  };

  const approveJob = async (jobId: number) => {
    await JobManager.approveJob(jobId);
  };

  const rejectJob = async (jobId: number, reason?: string) => {
    await JobManager.rejectJob(jobId, reason);
  };

  return {
    approvedJobs,
    pendingJobs,
    loading,
    importFromSheets,
    approveJob,
    rejectJob,
    refresh: loadJobs
  };
};