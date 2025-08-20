'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Shield, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api, EmailValidationResult, FindEmailResponse } from '@/lib/api';
import { EmailValidationDisplay } from './EmailValidationDisplay';

export function EmailValidationTool() {
  const [singleEmail, setSingleEmail] = useState('');
  const [batchEmails, setBatchEmails] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  
  const [validatingSingle, setValidatingSingle] = useState(false);
  const [validatingBatch, setValidatingBatch] = useState(false);
  const [findingEmail, setFindingEmail] = useState(false);
  
  const [singleResult, setSingleResult] = useState<EmailValidationResult | null>(null);
  const [batchResults, setBatchResults] = useState<EmailValidationResult[]>([]);
  const [findResult, setFindResult] = useState<FindEmailResponse | null>(null);

  const validateSingleEmail = async () => {
    if (!singleEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setValidatingSingle(true);
    try {
      const response = await api.validateEmail({ email: singleEmail.trim() });
      setSingleResult(response.result);
    } catch (error) {
      console.error('Error validating email:', error);
      toast.error('Failed to validate email');
    } finally {
      setValidatingSingle(false);
    }
  };

  const validateBatchEmails = async () => {
    const emails = batchEmails
      .split('\n')
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (emails.length === 0) {
      toast.error('Please enter at least one valid email address');
      return;
    }

    setValidatingBatch(true);
    try {
      const response = await api.validateEmailsBatch({ emails });
      setBatchResults(response.results);
      toast.success(`Validated ${response.results.length} emails`);
    } catch (error) {
      console.error('Error validating batch emails:', error);
      toast.error('Failed to validate emails');
    } finally {
      setValidatingBatch(false);
    }
  };

  const findAndValidateEmail = async () => {
    if (!firstName.trim() || !companyWebsite.trim()) {
      toast.error('Please enter first name and company website');
      return;
    }

    setFindingEmail(true);
    try {
      const response = await api.findEmail({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_website: companyWebsite.trim(),
        validate: true
      });
      setFindResult(response);
      
      if (response.success) {
        toast.success(`Found email: ${response.generated_email}`);
      } else {
        toast.error(response.error || 'Failed to find email');
      }
    } catch (error) {
      console.error('Error finding email:', error);
      toast.error('Failed to find email');
    } finally {
      setFindingEmail(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Email Validation Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Single Email
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Batch Validation
              </TabsTrigger>
              <TabsTrigger value="find" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Find Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="single-email">Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="single-email"
                    placeholder="Enter email address to validate"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && validateSingleEmail()}
                  />
                  <Button 
                    onClick={validateSingleEmail} 
                    disabled={validatingSingle}
                    className="flex items-center gap-2"
                  >
                    {validatingSingle ? (
                      <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                    Validate
                  </Button>
                </div>
              </div>

              {singleResult && (
                <EmailValidationDisplay result={singleResult} showDetails={true} />
              )}
            </TabsContent>

            <TabsContent value="batch" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-emails">Email Addresses (one per line)</Label>
                <Textarea
                  id="batch-emails"
                  placeholder="Enter multiple email addresses, one per line..."
                  value={batchEmails}
                  onChange={(e) => setBatchEmails(e.target.value)}
                  rows={6}
                />
                <Button 
                  onClick={validateBatchEmails} 
                  disabled={validatingBatch}
                  className="flex items-center gap-2"
                >
                  {validatingBatch ? (
                    <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
                  ) : (
                    <Users className="h-4 w-4" />
                  )}
                  Validate All
                </Button>
              </div>

              {batchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex gap-4 text-sm">
                    <Badge className="bg-green-100 text-green-800">
                      Confirmed: {batchResults.filter(r => r.confidence === 'confirmed').length}
                    </Badge>
                    <Badge className="bg-orange-100 text-orange-800">
                      Unconfirmed: {batchResults.filter(r => r.confidence === 'unconfirmed').length}
                    </Badge>
                    <Badge className="bg-red-100 text-red-800">
                      Invalid: {batchResults.filter(r => r.confidence === 'invalid').length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {batchResults.map((result, index) => (
                      <EmailValidationDisplay 
                        key={index} 
                        result={result} 
                        compact={true} 
                        showDetails={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="find" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name *</Label>
                  <Input
                    id="first-name"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input
                    id="last-name"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="company-website">Company Website *</Label>
                <div className="flex gap-2">
                  <Input
                    id="company-website"
                    placeholder="example.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && findAndValidateEmail()}
                  />
                  <Button 
                    onClick={findAndValidateEmail} 
                    disabled={findingEmail}
                    className="flex items-center gap-2"
                  >
                    {findingEmail ? (
                      <div className="animate-spin h-4 w-4 border border-white border-t-transparent rounded-full" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Find Email
                  </Button>
                </div>
              </div>

              {findResult && (
                <div className="space-y-4">
                  {findResult.success ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Generated Email</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="font-mono text-lg font-semibold text-blue-600">
                          {findResult.generated_email}
                        </div>
                        
                        {findResult.validation && (
                          <EmailValidationDisplay 
                            result={findResult.validation} 
                            showDetails={true}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-red-600">
                          <strong>Error:</strong> {findResult.error}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}