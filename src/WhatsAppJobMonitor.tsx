// ============================================
// WHATSAPP JOB MONITORING SYSTEM
// Easy to upgrade from manual alerts to full automation
// ============================================

import React from 'react';

interface JobIssue {
  type: 'WEIRD_TITLE' | 'LOW_CONFIDENCE' | 'NEW_PATTERN' | 'UNKNOWN_DOMAIN';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

interface JobAlert {
  job: {
    id: number;
    url: string;
    title: string;
    company: string;
    category: string;
  };
  issues: JobIssue[];
  needsReview: boolean;
  detectedAt: Date;
}

// ============================================
// NOTIFICATION CONFIG (Easy to modify)
// ============================================
const NOTIFICATION_CONFIG = {
  // Your phone number for notifications
  ADMIN_PHONE: '+27679245039', // Updated to your number
  
  // Notification triggers (easy to enable/disable)
  TRIGGERS: {
    EVERY_NEW_JOB: true,        // Notify for every job (current setting)
    WEIRD_TITLES_ONLY: false,   // Only weird titles like "17430981659190072899xTq"
    LOW_CONFIDENCE_ONLY: false, // Only jobs with low categorization confidence
    DAILY_SUMMARY_ONLY: false   // Only send daily summaries
  },
  
  // Issue detection settings
  DETECTION: {
    WEIRD_TITLE_PATTERNS: [
      /^\d{10,}/,                        // Starts with 10+ digits like "4297605256"
      /^\d{8,}\s*$/,                     // Just 8+ digits and nothing else
      /\?Source=/i,                      // Contains "?Source=" like "Remote Part Time Personal Assistant?Source=CareerSite"
      /&New=Yes/i,                       // Contains "&New=Yes"
      /^[a-f0-9]{8,}/i,                 // Looks like hex ID
      /^[A-Z0-9]{15,}/,                 // All caps alphanumeric 15+ chars
      /[xXyYzZ]{2,}[0-9]{5,}/,          // Random letters + numbers
      /\?Source=CareerSite/i,           // Specific pattern you mentioned
      /^\d{4,}\s*\*{0,}$/               // Numbers followed by optional asterisks
    ],
    MIN_TITLE_LENGTH: 5,
    MAX_TITLE_LENGTH: 100,
    SUSPICIOUS_DOMAINS: ['recruitcrm.io'] // Domains that often have weird titles
  }
};

// ============================================
// JOB ISSUE DETECTOR
// ============================================
class JobIssueDetector {
  
  static detectIssues(job: {url: string, title: string, category: string, company: string}): JobIssue[] {
    const issues: JobIssue[] = [];
    
    // Check for weird titles (like your example)
    if (this.hasWeirdTitle(job.title)) {
      issues.push({
        type: 'WEIRD_TITLE',
        severity: 'HIGH',
        reason: `Title looks like a system ID: "${job.title}"`
      });
    }
    
    // Check title length
    if (job.title.length < NOTIFICATION_CONFIG.DETECTION.MIN_TITLE_LENGTH) {
      issues.push({
        type: 'WEIRD_TITLE',
        severity: 'MEDIUM',
        reason: `Title too short: "${job.title}"`
      });
    }
    
    if (job.title.length > NOTIFICATION_CONFIG.DETECTION.MAX_TITLE_LENGTH) {
      issues.push({
        type: 'WEIRD_TITLE',
        severity: 'MEDIUM',
        reason: `Title too long: "${job.title.substring(0, 50)}..."`
      });
    }
    
    // Check for suspicious domains
    const domain = this.extractDomain(job.url);
    if (NOTIFICATION_CONFIG.DETECTION.SUSPICIOUS_DOMAINS.includes(domain)) {
      issues.push({
        type: 'UNKNOWN_DOMAIN',
        severity: 'MEDIUM',
        reason: `Job from ${domain} - often has weird titles`
      });
    }
    
    // Check if title and category seem mismatched
    if (this.titleCategoryMismatch(job.title, job.category)) {
      issues.push({
        type: 'LOW_CONFIDENCE',
        severity: 'HIGH',
        reason: `"${job.title}" categorized as ${job.category} - seems wrong`
      });
    }
    
    return issues;
  }
  
  private static hasWeirdTitle(title: string): boolean {
    return NOTIFICATION_CONFIG.DETECTION.WEIRD_TITLE_PATTERNS.some(pattern => 
      pattern.test(title)
    );
  }
  
  private static extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }
  
  private static titleCategoryMismatch(title: string, category: string): boolean {
    const titleLower = title.toLowerCase();
    
    // If categorized as I.T. but no tech words
    if (category === 'I.T.' && !titleLower.match(/developer|engineer|tech|programming|coding|software/)) {
      return true;
    }
    
    // If categorized as Sales but no sales words
    if (category === 'Sales' && !titleLower.match(/sales|business|account|bdr|sdr/)) {
      return true;
    }
    
    return false;
  }
}

// ============================================
// WHATSAPP NOTIFICATION GENERATOR
// ============================================
class WhatsAppNotifier {
  
  static createJobAlertMessage(alert: JobAlert): string {
    const { job, issues } = alert;
    const highPriorityIssues = issues.filter(i => i.severity === 'HIGH');
    const isUrgent = highPriorityIssues.length > 0;
    
    let message = `🚨 BORDERLESS PLUG ALERT\n\n`;
    
    if (isUrgent) {
      message += `⚠️ HIGH PRIORITY - NEEDS REVIEW\n\n`;
    }
    
    message += `📋 JOB: ${job.title}\n`;
    message += `🏢 COMPANY: ${job.company}\n`;
    message += `🏷️ CATEGORY: ${job.category}\n`;
    message += `🔗 URL: ${job.url}\n\n`;
    
    if (issues.length > 0) {
      message += `🔍 ISSUES DETECTED:\n`;
      issues.forEach(issue => {
        const emoji = issue.severity === 'HIGH' ? '🔥' : issue.severity === 'MEDIUM' ? '⚠️' : 'ℹ️';
        message += `${emoji} ${issue.reason}\n`;
      });
      message += `\n`;
    }
    
    message += `⏰ DETECTED: ${alert.detectedAt.toLocaleTimeString()}\n\n`;
    message += `💻 REVIEW: ${window.location.origin}/admin\n\n`;
    message += `Quick Actions:\n`;
    message += `✅ Reply "OK" if looks good\n`;
    message += `❌ Reply "REJECT" to remove\n`;
    message += `📝 Reply "EDIT" to fix title`;
    
    return message;
  }
  
  static createDailySummary(alerts: JobAlert[]): string {
    const totalJobs = alerts.length;
    const highPriority = alerts.filter(a => a.issues.some(i => i.severity === 'HIGH')).length;
    const weirdTitles = alerts.filter(a => a.issues.some(i => i.type === 'WEIRD_TITLE')).length;
    
    return `📊 BORDERLESS PLUG DAILY SUMMARY\n\n` +
           `📈 TODAY'S ACTIVITY:\n` +
           `• ${totalJobs} new jobs processed\n` +
           `• ${highPriority} need urgent review\n` +
           `• ${weirdTitles} have weird titles\n\n` +
           `🔗 REVIEW PANEL: ${window.location.origin}/admin\n\n` +
           `Have a productive day! 🚀`;
  }
  
  static openWhatsAppAlert(message: string): void {
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = NOTIFICATION_CONFIG.ADMIN_PHONE.replace('+', '');
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
  }
}

// ============================================
// JOB MONITORING HOOK (For React Integration)
// ============================================
export const useJobMonitoring = () => {
  const [pendingAlerts, setPendingAlerts] = React.useState<JobAlert[]>([]);
  const [lastCheck, setLastCheck] = React.useState<Date | null>(null);
  
  const processNewJobs = React.useCallback((newJobs: any[]) => {
    const alerts: JobAlert[] = [];
    
    newJobs.forEach(job => {
      const issues = JobIssueDetector.detectIssues(job);
      const needsReview = shouldNotifyForJob(job, issues);
      
      if (needsReview) {
        alerts.push({
          job,
          issues,
          needsReview: true,
          detectedAt: new Date()
        });
      }
    });
    
    setPendingAlerts(prev => [...prev, ...alerts]);
    setLastCheck(new Date());
    
    return alerts;
  }, []);

  // Function to send WhatsApp notification for a specific job
  const sendNotificationForJob = React.useCallback((job: any) => {
    const issues = JobIssueDetector.detectIssues(job);
    const alert: JobAlert = {
      job,
      issues,
      needsReview: true,
      detectedAt: new Date()
    };
    
    const message = WhatsAppNotifier.createJobAlertMessage(alert);
    WhatsAppNotifier.openWhatsAppAlert(message);
    
    console.log('📱 WhatsApp notification sent for job:', job.title);
  }, []);
  
  const sendPendingNotifications = React.useCallback(() => {
    if (pendingAlerts.length === 0) return;
    
    // Send individual alerts for high-priority jobs
    const urgentAlerts = pendingAlerts.filter(alert => 
      alert.issues.some(issue => issue.severity === 'HIGH')
    );
    
    urgentAlerts.forEach(alert => {
      const message = WhatsAppNotifier.createJobAlertMessage(alert);
      console.log('📱 Would send WhatsApp alert:', message);
      
      // In development - log to console
      // In production - actually send:
      // WhatsAppNotifier.openWhatsAppAlert(message);
    });
    
    // Clear processed alerts
    setPendingAlerts([]);
  }, [pendingAlerts]);
  
  // Manual trigger for testing
  const testNotification = React.useCallback((job: any) => {
    const testAlert: JobAlert = {
      job,
      issues: JobIssueDetector.detectIssues(job),
      needsReview: true,
      detectedAt: new Date()
    };
    
    const message = WhatsAppNotifier.createJobAlertMessage(testAlert);
    WhatsAppNotifier.openWhatsAppAlert(message);
  }, []);
  
  return {
    pendingAlerts,
    processNewJobs,
    sendPendingNotifications,
    sendNotificationForJob, // Added this function
    testNotification,
    lastCheck
  };
};

// ============================================
// NOTIFICATION DECISION LOGIC
// ============================================
function shouldNotifyForJob(job: any, issues: JobIssue[]): boolean {
  const config = NOTIFICATION_CONFIG.TRIGGERS;
  
  // If notify for every job is enabled
  if (config.EVERY_NEW_JOB) {
    return true;
  }
  
  // If only weird titles
  if (config.WEIRD_TITLES_ONLY) {
    return issues.some(issue => issue.type === 'WEIRD_TITLE');
  }
  
  // If only low confidence
  if (config.LOW_CONFIDENCE_ONLY) {
    return issues.some(issue => issue.type === 'LOW_CONFIDENCE');
  }
  
  // If only high priority issues
  return issues.some(issue => issue.severity === 'HIGH');
}

// ============================================
// EASY UPGRADE PATH FOR FUTURE AUTOMATION
// ============================================

// Phase 4: Full Automation Hooks (Ready for implementation)
export const upgradeToFullAutomation = {
  
  // Replace manual WhatsApp links with real API calls
  setupWhatsAppAPI: (apiKey: string, businessNumber: string) => {
    // Implementation for WhatsApp Business API
  },
  
  // Add Google Sheets webhooks for real-time detection
  setupSheetsWebhook: (sheetId: string, webhookUrl: string) => {
    // Implementation for Google Sheets change detection
  },
  
  // Add scheduled monitoring every X minutes
  setupPeriodicMonitoring: (intervalMinutes: number) => {
    // Implementation for periodic job checking
  },
  
  // Add Supabase integration for tracking notifications sent
  setupNotificationTracking: (supabaseClient: any) => {
    // Implementation for logging all notifications
  }
};

console.log('🚀 WhatsApp Job Monitoring System Ready!');
console.log('📱 Notifications will be sent to:', NOTIFICATION_CONFIG.ADMIN_PHONE);
console.log('⚙️ Current trigger: Every new job');

export { JobIssueDetector, WhatsAppNotifier, NOTIFICATION_CONFIG };