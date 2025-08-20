'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, Mail } from 'lucide-react';
import { EmailValidationResult } from '@/lib/api';

interface EmailValidationDisplayProps {
  result: EmailValidationResult;
  showDetails?: boolean;
  compact?: boolean;
}

export function EmailValidationDisplay({ 
  result, 
  showDetails = true, 
  compact = false 
}: EmailValidationDisplayProps) {
  const getStatusIcon = () => {
    switch (result.confidence) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'unconfirmed':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'risky':
        return <HelpCircle className="h-4 w-4 text-yellow-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium";
    
    switch (result.confidence) {
      case 'confirmed':
        return (
          <Badge variant="default">
            <CheckCircle className="h-3 w-3" />
            Confirmed
          </Badge>
        );
      case 'unconfirmed':
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3" />
            Unconfirmed
          </Badge>
        );
      case 'risky':
        return (
          <Badge variant="outline">
            <HelpCircle className="h-3 w-3" />
            Risky
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3" />
            Invalid
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <HelpCircle className="h-3 w-3" />
            Unknown
          </Badge>
        );
    }
  };

  const getEmailDisplayClasses = () => {
    const baseClasses = "font-mono font-medium";
    
    switch (result.confidence) {
      case 'confirmed':
        return `${baseClasses} text-primary`;
      case 'unconfirmed':
        return `${baseClasses} text-foreground bg-accent px-2 py-1 rounded`;
      case 'risky':
        return `${baseClasses} text-muted-foreground`;
      case 'invalid':
        return `${baseClasses} text-destructive line-through`;
      default:
        return `${baseClasses} text-muted-foreground`;
    }
  };

  const getStatusMessage = () => {
    if (result.status === 'unconfirmed_major_provider') {
      return 'This email uses a major provider like Gmail or Outlook. Pattern is likely correct but cannot be verified.';
    }
    
    switch (result.confidence) {
      case 'confirmed':
        return 'Email is deliverable and confirmed to exist.';
      case 'unconfirmed':
        return 'Email format appears correct but delivery cannot be confirmed.';
      case 'risky':
        return 'Email may exist but has risk factors that could affect delivery.';
      case 'invalid':
        return 'Email is invalid or does not exist.';
      default:
        return 'Unable to determine email validity.';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={getEmailDisplayClasses()}>
          {result.email}
        </div>
        {getStatusBadge()}
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5" />
          Email Validation Result
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={getEmailDisplayClasses()}>
            {result.email}
          </div>
          {getStatusBadge()}
        </div>

        <div className="text-sm text-muted-foreground">
          {getStatusMessage()}
        </div>

        {showDetails && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-foreground mb-2">Technical Details</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Syntax Valid:</span>
                  <span className={result.syntax_valid ? 'text-primary' : 'text-destructive'}>
                    {result.syntax_valid ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MX Record:</span>
                  <span className={result.mx_accepts_mail ? 'text-primary' : 'text-destructive'}>
                    {result.mx_accepts_mail ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                {result.is_deliverable !== null && (
                  <div className="flex justify-between">
                    <span>Deliverable:</span>
                    <span className={result.is_deliverable ? 'text-primary' : 'text-destructive'}>
                      {result.is_deliverable ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="font-medium text-foreground mb-2">Risk Factors</div>
              <div className="space-y-1">
                {result.is_disposable !== null && (
                  <div className="flex justify-between">
                    <span>Disposable:</span>
                    <span className={result.is_disposable ? 'text-destructive' : 'text-primary'}>
                      {result.is_disposable ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {result.is_role_account !== null && (
                  <div className="flex justify-between">
                    <span>Role Account:</span>
                    <span className={result.is_role_account ? 'text-muted-foreground' : 'text-primary'}>
                      {result.is_role_account ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
                {result.is_disabled !== null && (
                  <div className="flex justify-between">
                    <span>Disabled:</span>
                    <span className={result.is_disabled ? 'text-destructive' : 'text-primary'}>
                      {result.is_disabled ? 'Yes' : 'No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {result.suggestion && (
          <div className="p-3 bg-accent rounded-lg">
            <div className="text-sm font-medium text-foreground mb-1">
              Suggested Correction:
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              {result.suggestion}
            </div>
          </div>
        )}

        {result.error && (
          <div className="p-3 bg-destructive/10 rounded-lg">
            <div className="text-sm font-medium text-destructive mb-1">
              Error:
            </div>
            <div className="text-sm text-destructive">
              {result.error}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}