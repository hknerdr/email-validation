// utils/bounceRatePredictor.ts

import type { SESValidationResult, BounceRateMetrics } from './types';

class BounceRatePredictor {
  private calculateDomainScore(results: SESValidationResult[]): number {
    const domains = new Map<string, { total: number; valid: number }>();

    // Group by domain and calculate validity ratio
    results.forEach(result => {
      const domain = result.email.split('@')[1];
      const current = domains.get(domain) || { total: 0, valid: 0 };
      domains.set(domain, {
        total: current.total + 1,
        valid: current.valid + (result.is_valid ? 1 : 0)
      });
    });

    // Calculate average domain score
    let totalScore = 0;
    domains.forEach(({ total, valid }) => {
      totalScore += (valid / total) * 100;
    });

    return domains.size > 0 ? totalScore / domains.size : 100;
  }

  private calculateAuthenticationScore(results: SESValidationResult[]): number {
    const domains = new Map<string, boolean>();
    
    results.forEach(result => {
      const domain = result.email.split('@')[1];
      if (!domains.has(domain)) {
        const hasDKIM = result.details.domain_status.has_dkim;
        const hasSPF = result.details.domain_status.has_spf;
        const dmarcPassed = result.details.domain_status.dmarc_status === 'pass';
        
        // Score based on authentication methods present
        let score = 0;
        if (hasDKIM) score += 33.33;
        if (hasSPF) score += 33.33;
        if (dmarcPassed) score += 33.34;
        
        domains.set(domain, score > 0);
      }
    });

    // Calculate percentage of domains with authentication
    const authenticatedDomains = Array.from(domains.values()).filter(v => v).length;
    return domains.size > 0 ? (authenticatedDomains / domains.size) * 100 : 100;
  }

  private getRecommendations(metrics: {
    domainScore: number;
    authScore: number;
    listQuality: number;
  }): string[] {
    const recommendations: string[] = [];

    if (metrics.domainScore < 90) {
      recommendations.push('Verify sender domain reputation');
      recommendations.push('Implement domain warming practices');
    }

    if (metrics.authScore < 100) {
      recommendations.push('Configure DKIM for all sending domains');
      recommendations.push('Set up SPF records');
      recommendations.push('Implement DMARC policy');
    }

    if (metrics.listQuality < 90) {
      recommendations.push('Clean email list regularly');
      recommendations.push('Implement double opt-in');
      recommendations.push('Remove inactive subscribers');
      recommendations.push('Validate emails before sending');
    }

    return recommendations;
  }

  public predictBounceRate(results: SESValidationResult[]): BounceRateMetrics {
    // Calculate component scores
    const domainScore = this.calculateDomainScore(results);
    const authScore = this.calculateAuthenticationScore(results);
    const listQuality = (results.filter(r => r.is_valid).length / results.length) * 100;

    // Calculate predicted bounce rate using weighted factors
    const factors = {
      domainReputation: domainScore * 0.3,
      listQuality: listQuality * 0.4,
      authenticationStatus: authScore * 0.3,
      historicalPerformance: 95 // Default assumption, can be adjusted with real data
    };

    // Calculate overall score (inverse of bounce rate)
    const overallScore = 
      factors.domainReputation * 0.3 +
      factors.listQuality * 0.4 +
      factors.authenticationStatus * 0.2 +
      factors.historicalPerformance * 0.1;

    // Convert to predicted bounce rate (inverse relationship)
    const predictedRate = Math.max(0, Math.min(100 - overallScore, 100));
    
    // Calculate confidence based on sample size
    const confidence = Math.min((results.length / 1000) * 100, 100);

    return {
      predictedRate: Number(predictedRate.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      factors,
      recommendations: this.getRecommendations({
        domainScore,
        authScore,
        listQuality
      })
    };
  }
}

export const bouncePredictor = new BounceRatePredictor();
