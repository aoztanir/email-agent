'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlayCircle, PauseCircle, Square, RefreshCw, RotateCcw, Trash2, UserSearch, Tags, Users, Building2, Mail } from 'lucide-react'
import { supabase, type Company, type ScrapeJob, type ContactGroup, type Contact } from '@/lib/supabase'

export default function ContactMiningPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [jobProgress, setJobProgress] = useState<Record<string, any>>({})
  
  // Form state for creating new job
  const [jobName, setJobName] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [contactsPerCompany, setContactsPerCompany] = useState(20)
  const [loading, setLoading] = useState(false)

  // Restart job state
  const [restartingJobId, setRestartingJobId] = useState<string | null>(null)

  // Delete job state
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)

  // Fetch data on component mount
  useEffect(() => {
    fetchCompanies()
    fetchJobs()
    fetchGroups()
    fetchContacts()
  }, [])

  // Poll for job progress updates
  useEffect(() => {
    const interval = setInterval(() => {
      jobs.forEach(job => {
        if (job.status === 'running') {
          fetchJobProgress(job.id)
        }
      })
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [jobs])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .order('name')

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchJobs = async () => {
    try {
      // Fetch jobs using Supabase directly
      const { data, error } = await supabase
        .from('scraping_job')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Parse company_ids JSON field
      const jobsWithParsedIds = (data || []).map(job => ({
        ...job,
        company_ids: typeof job.company_ids === 'string' ? JSON.parse(job.company_ids) : job.company_ids
      }))

      setJobs(jobsWithParsedIds)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_group')
        .select('*')
        .order('name')

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contact')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const fetchJobProgress = async (jobId: string) => {
    try {
      // Use Python API for progress since it has business logic
      const response = await fetch(`http://localhost:8000/scraping-jobs/${jobId}/progress`)
      if (response.ok) {
        const progress = await response.json()
        setJobProgress(prev => ({
          ...prev,
          [jobId]: progress
        }))
      }
    } catch (error) {
      console.error('Error fetching job progress:', error)
    }
  }

  const createJob = async () => {
    if (!jobName || selectedCompanies.length === 0) {
      alert('Please fill in job name and select at least one company')
      return
    }

    setLoading(true)
    try {
      // Create job using Python backend API
      const response = await fetch('http://localhost:8000/scraping-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: jobName,
          company_ids: selectedCompanies,
          contacts_per_company: contactsPerCompany,
          group_id: selectedGroupId && selectedGroupId !== 'no-group' ? selectedGroupId : null,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create job')
      }

      // Reset form
      setJobName('')
      setSelectedCompanies([])
      setContactsPerCompany(20)
      setSelectedGroupId('')

      // Refresh jobs list and contacts
      await fetchJobs()
      await fetchContacts()
      alert('Mining job created successfully!')
    } catch (error) {
      console.error('Error creating job:', error)
      alert('Failed to create scraping job: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const controlJob = async (jobId: string, action: 'start' | 'pause' | 'resume' | 'stop' | 'restart' | 'delete') => {
    if (action === 'restart') {
      setRestartingJobId(jobId)
      return
    }

    if (action === 'delete') {
      setDeletingJobId(jobId)
      return
    }

    try {
      // Use Python API for job control (complex business logic)
      const response = await fetch(`http://localhost:8000/scraping-jobs/${jobId}/${action}`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchJobs() // Refresh using Supabase
        await fetchContacts() // Refresh contacts as well
      } else {
        throw new Error(`Failed to ${action} job`)
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error)
      alert(`Failed to ${action} job`)
    }
  }

  const handleRestartJob = async () => {
    if (!restartingJobId) {
      return
    }

    try {
      // Reset job status to pending using Supabase
      const { error } = await supabase
        .from('scraping_job')
        .update({
          status: 'pending',
          processed_companies: 0,
          total_contacts_found: 0,
          error_message: null,
          current_company_id: null,
          current_company_name: null,
          started_at: null,
          completed_at: null
        })
        .eq('id', restartingJobId)

      if (error) throw error

      await fetchJobs()
      await fetchContacts()
      setRestartingJobId(null)
      alert('Job restarted successfully!')
    } catch (error) {
      console.error('Error restarting job:', error)
      alert('Failed to restart job')
    }
  }

  const handleDeleteJob = async () => {
    if (!deletingJobId) return

    try {
      if (deletingJobId === 'all') {
        // Delete all jobs using Supabase
        const { data: jobsData, error: fetchError } = await supabase
          .from('scraping_job')
          .select('id')

        if (fetchError) throw fetchError

        if (jobsData && jobsData.length > 0) {
          const jobIds = jobsData.map(j => j.id)
          const chunkSize = 100
          for (let i = 0; i < jobIds.length; i += chunkSize) {
            const chunk = jobIds.slice(i, i + chunkSize)
            const { error } = await supabase
              .from('scraping_job')
              .delete()
              .in('id', chunk)

            if (error) throw error
          }
        }

        await fetchJobs()
        await fetchContacts()
        setDeletingJobId(null)
        alert('All jobs deleted successfully!')
      } else {
        // Delete single job using Supabase
        const { error } = await supabase
          .from('scraping_job')
          .delete()
          .eq('id', deletingJobId)

        if (error) throw error

        await fetchJobs()
        await fetchContacts()
        setDeletingJobId(null)
        alert('Job deleted successfully!')
      }
    } catch (error) {
      console.error('Error deleting job(s):', error)
      alert(`Failed to delete ${deletingJobId === 'all' ? 'all jobs' : 'job'}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'running': return 'default'
      case 'paused': return 'outline'
      case 'completed': return 'default'
      case 'failed': return 'destructive'
      case 'cancelled': return 'secondary'
      default: return 'secondary'
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Get contacts found by a specific job
  const getJobContacts = (job: ScrapeJob) => {
    const jobCompanyIds = Array.isArray(job.company_ids) ? job.company_ids : JSON.parse(job.company_ids || '[]')
    return contacts.filter(contact => jobCompanyIds.includes(contact.company_id))
  }

  // Get company names for job
  const getJobCompanyNames = (job: ScrapeJob) => {
    const jobCompanyIds = Array.isArray(job.company_ids) ? job.company_ids : JSON.parse(job.company_ids || '[]')
    return companies
      .filter(company => jobCompanyIds.includes(company.id))
      .map(company => company.name)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact Mining</h1>
        <p className="text-gray-600 mt-2">Create and manage LinkedIn scraping jobs to discover contacts at your target companies</p>
      </div>

      {/* Create New Job */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserSearch className="w-5 h-5" />
            <span>Create Contact Mining Job</span>
          </CardTitle>
          <CardDescription>
            Set up a new contact mining job for your companies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="job-name">Job Name</Label>
              <Input
                id="job-name"
                placeholder="e.g., Tech Companies Outreach"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="contacts-per-company">Contacts per Company</Label>
              <Input
                id="contacts-per-company"
                type="number"
                min="1"
                max="50"
                value={contactsPerCompany}
                onChange={(e) => setContactsPerCompany(parseInt(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="group-select">Assign to Group (Optional)</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-group">No Group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: group.color }}
                        />
                        {group.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>


          <div>
            <Label>Select Companies to Scrape</Label>
            <div className="mt-2 max-h-40 overflow-y-auto border rounded p-3 space-y-2">
              {companies.length === 0 ? (
                <p className="text-sm text-gray-500">No companies available. Upload a CSV file first.</p>
              ) : (
                companies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={company.id}
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCompanies([...selectedCompanies, company.id])
                        } else {
                          setSelectedCompanies(selectedCompanies.filter(id => id !== company.id))
                        }
                      }}
                    />
                    <label htmlFor={company.id} className="text-sm cursor-pointer">
                      {company.name}
                      {company.website && (
                        <span className="text-gray-500 ml-2">({company.website})</span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
            {companies.length > 0 && (
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompanies(companies.map(c => c.id))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCompanies([])}
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>

          <Button 
            onClick={createJob} 
            disabled={loading || companies.length === 0}
            className="w-full"
          >
            {loading ? 'Creating Job...' : 'Create Mining Job'}
          </Button>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mining Jobs ({jobs.length})</CardTitle>
            <CardDescription>Manage your contact mining jobs</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchJobs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {jobs.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setDeletingJobId('all')}
                className="text-red-600 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No mining jobs yet. Create one above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const progress = jobProgress[job.id]
                const progressPercent = job.total_companies > 0 
                  ? Math.round((job.processed_companies / job.total_companies) * 100)
                  : 0

                const jobContacts = getJobContacts(job)
                const jobCompanyNames = getJobCompanyNames(job)
                
                return (
                  <div key={job.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{job.name}</h3>
                        <p className="text-sm text-gray-600">
                          {job.total_companies} companies • {job.contacts_per_company} contacts each
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(job.status)}>
                        {job.status.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Company List */}
                    {jobCompanyNames.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Building2 className="w-4 h-4" />
                          Target Companies
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {jobCompanyNames.slice(0, 5).map((companyName, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {companyName}
                            </Badge>
                          ))}
                          {jobCompanyNames.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{jobCompanyNames.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Found Contacts Preview */}
                    {jobContacts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                          <Users className="w-4 h-4" />
                          Found Contacts ({jobContacts.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-24 overflow-y-auto">
                          {jobContacts.slice(0, 6).map((contact) => (
                            <div key={contact.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded p-2">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {contact.first_name} {contact.last_name}
                                </div>
                                {contact.email && (
                                  <div className="text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3" />
                                    {contact.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {jobContacts.length > 6 && (
                            <div className="text-xs text-gray-500 text-center p-2">
                              +{jobContacts.length - 6} more contacts
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress: {job.processed_companies}/{job.total_companies} companies</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      
                      {progress?.current_company && (
                        <p className="text-xs text-gray-500">
                          Currently mining: {progress.current_company}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium">{jobContacts.length}</p>
                        <p className="text-xs text-gray-500">Contacts Found</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{jobContacts.filter(c => c.email).length}</p>
                        <p className="text-xs text-gray-500">With Emails</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {progress?.estimated_remaining_time 
                            ? formatDuration(progress.estimated_remaining_time)
                            : '-'
                          }
                        </p>
                        <p className="text-xs text-gray-500">Est. Time Left</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {job.group_id && groups.find(g => g.id === job.group_id)?.name || 'No Group'}
                        </p>
                        <p className="text-xs text-gray-500">Assigned Group</p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {job.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-sm text-red-600">{job.error_message}</p>
                      </div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {job.status === 'pending' && (
                        <Button size="sm" onClick={() => controlJob(job.id, 'start')}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      
                      {job.status === 'running' && (
                        <Button size="sm" variant="outline" onClick={() => controlJob(job.id, 'pause')}>
                          <PauseCircle className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button size="sm" onClick={() => controlJob(job.id, 'resume')}>
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      
                      {(job.status === 'running' || job.status === 'paused') && (
                        <Button size="sm" variant="destructive" onClick={() => controlJob(job.id, 'stop')}>
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      )}
                      
                      {(job.status === 'failed' || job.status === 'completed' || job.status === 'cancelled') && (
                        <Button size="sm" variant="outline" onClick={() => controlJob(job.id, 'restart')}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restart
                        </Button>
                      )}

                      {/* Delete button - only show for non-running jobs */}
                      {job.status !== 'running' && (
                        <Button size="sm" variant="destructive" onClick={() => controlJob(job.id, 'delete')}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Created: {new Date(job.created_at).toLocaleString()}</p>
                      {job.started_at && (
                        <p>Started: {new Date(job.started_at).toLocaleString()}</p>
                      )}
                      {job.completed_at && (
                        <p>Completed: {new Date(job.completed_at).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restart Job Modal */}
      {restartingJobId && (
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">Restart Job</CardTitle>
            <CardDescription className="text-orange-600">
              Are you sure you want to restart this mining job? The job will start from the beginning and re-mine all companies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleRestartJob}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Job
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setRestartingJobId(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Job Confirmation Modal */}
      {deletingJobId && (
        <Card className="mt-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">
              {deletingJobId === 'all' ? 'Delete All Jobs' : 'Delete Job'}
            </CardTitle>
            <CardDescription className="text-red-600">
              {deletingJobId === 'all' 
                ? `Are you sure you want to delete all ${jobs.length} mining jobs? This action cannot be undone. All job data and progress will be permanently lost.`
                : 'Are you sure you want to delete this mining job? This action cannot be undone. All job data and progress will be permanently lost.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteJob}>
                <Trash2 className="h-4 w-4 mr-2" />
                {deletingJobId === 'all' ? `Delete All ${jobs.length} Jobs` : 'Delete Job'}
              </Button>
              <Button variant="outline" onClick={() => setDeletingJobId(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}