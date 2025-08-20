'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PlayCircle, PauseCircle, Square, RefreshCw, RotateCcw, Trash2 } from 'lucide-react'

interface Company {
  id: string
  name: string
  website?: string
  place_id: string
}

interface ScrapeJob {
  id: string
  name: string
  company_ids: string[]
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
  total_companies: number
  processed_companies: number
  total_contacts_found: number
  linkedin_username: string
  contacts_per_company: number
  created_at: string
  started_at?: string
  completed_at?: string
  error_message?: string
  current_company_name?: string
}

interface ScrapeProgress {
  job_id: string
  total_companies: number
  processed_companies: number
  current_company?: string
  contacts_found: number
  status: string
  estimated_remaining_time?: number
  errors: string[]
}

export function ScrapingJobManager() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [jobs, setJobs] = useState<ScrapeJob[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [jobProgress, setJobProgress] = useState<Record<string, ScrapeProgress>>({})
  
  // Form state for creating new job
  const [jobName, setJobName] = useState('')
  const [linkedinUsername, setLinkedinUsername] = useState('')
  const [linkedinPassword, setLinkedinPassword] = useState('')
  const [contactsPerCompany, setContactsPerCompany] = useState(20)
  const [loading, setLoading] = useState(false)

  // Restart job state
  const [restartingJobId, setRestartingJobId] = useState<string | null>(null)
  const [restartLinkedinPassword, setRestartLinkedinPassword] = useState('')

  // Delete job state
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies()
    fetchJobs()
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
      const response = await fetch('http://localhost:8000/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const fetchJobs = async () => {
    try {
      const response = await fetch('http://localhost:8000/scraping-jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    }
  }

  const fetchJobProgress = async (jobId: string) => {
    try {
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
    if (!jobName || !linkedinUsername || !linkedinPassword || selectedCompanies.length === 0) {
      alert('Please fill in all fields and select at least one company')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/scraping-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: jobName,
          company_ids: selectedCompanies,
          linkedin_username: linkedinUsername,
          linkedin_password: linkedinPassword,
          contacts_per_company: contactsPerCompany
        }),
      })

      if (response.ok) {
        const newJob = await response.json()
        setJobs(prev => [newJob, ...prev])
        
        // Reset form
        setJobName('')
        setLinkedinUsername('')
        setLinkedinPassword('')
        setSelectedCompanies([])
        setContactsPerCompany(20)
      } else {
        throw new Error('Failed to create job')
      }
    } catch (error) {
      console.error('Error creating job:', error)
      alert('Failed to create scraping job')
    } finally {
      setLoading(false)
    }
  }

  const controlJob = async (jobId: string, action: 'start' | 'pause' | 'resume' | 'stop' | 'restart' | 'delete') => {
    if (action === 'restart') {
      // For restart, we need LinkedIn credentials
      const job = jobs.find(j => j.id === jobId)
      if (!job) return
      
      setRestartingJobId(jobId)
      return
    }

    if (action === 'delete') {
      // For delete, we need confirmation
      setDeletingJobId(jobId)
      return
    }

    try {
      const response = await fetch(`http://localhost:8000/scraping-jobs/${jobId}/${action}`, {
        method: 'POST',
      })

      if (response.ok) {
        fetchJobs() // Refresh jobs list
      } else {
        throw new Error(`Failed to ${action} job`)
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error)
      alert(`Failed to ${action} job`)
    }
  }

  const handleRestartJob = async () => {
    if (!restartingJobId || !restartLinkedinPassword) {
      alert('Please enter your LinkedIn password to restart the job')
      return
    }

    try {
      // First, update the job with new LinkedIn credentials
      const response = await fetch(`http://localhost:8000/scraping-jobs/${restartingJobId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedin_password: restartLinkedinPassword
        }),
      })

      if (response.ok) {
        fetchJobs() // Refresh jobs list
        setRestartingJobId(null)
        setRestartLinkedinPassword('')
        alert('Job restarted successfully!')
      } else {
        throw new Error('Failed to restart job')
      }
    } catch (error) {
      console.error('Error restarting job:', error)
      alert('Failed to restart job')
    }
  }

  const handleDeleteJob = async () => {
    if (!deletingJobId) return

    try {
      const response = await fetch(`http://localhost:8000/scraping-jobs/${deletingJobId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchJobs() // Refresh jobs list
        setDeletingJobId(null)
        alert('Job deleted successfully!')
      } else {
        throw new Error('Failed to delete job')
      }
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('Failed to delete job')
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

  return (
    <div className="space-y-6">
      {/* Create New Job */}
      <Card>
        <CardHeader>
          <CardTitle>Create Scraping Job</CardTitle>
          <CardDescription>
            Set up a new LinkedIn scraping job for your companies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="linkedin-username">LinkedIn Username</Label>
              <Input
                id="linkedin-username"
                type="email"
                placeholder="your.email@example.com"
                value={linkedinUsername}
                onChange={(e) => setLinkedinUsername(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="linkedin-password">LinkedIn Password</Label>
              <Input
                id="linkedin-password"
                type="password"
                placeholder="Your LinkedIn password"
                value={linkedinPassword}
                onChange={(e) => setLinkedinPassword(e.target.value)}
              />
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
            {loading ? 'Creating Job...' : 'Create Scraping Job'}
          </Button>
        </CardContent>
      </Card>

      {/* Jobs List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scraping Jobs</CardTitle>
            <CardDescription>Manage your LinkedIn scraping jobs</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchJobs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No scraping jobs yet. Create one above to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => {
                const progress = jobProgress[job.id]
                const progressPercent = job.total_companies > 0 
                  ? Math.round((job.processed_companies / job.total_companies) * 100)
                  : 0

                return (
                  <div key={job.id} className="border rounded-lg p-4 space-y-3">
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

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress: {job.processed_companies}/{job.total_companies} companies</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                      
                      {progress?.current_company && (
                        <p className="text-xs text-gray-500">
                          Currently scraping: {progress.current_company}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm font-medium">{job.total_contacts_found}</p>
                        <p className="text-xs text-gray-500">Contacts Found</p>
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
                        <p className="text-sm font-medium">{job.linkedin_username}</p>
                        <p className="text-xs text-gray-500">LinkedIn Account</p>
                      </div>
                    </div>

                    {/* Error Message */}
                    {job.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-sm text-red-600">{job.error_message}</p>
                      </div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex gap-2">
                      {job.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => controlJob(job.id, 'start')}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Start
                        </Button>
                      )}
                      
                      {job.status === 'running' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => controlJob(job.id, 'pause')}
                        >
                          <PauseCircle className="h-4 w-4 mr-2" />
                          Pause
                        </Button>
                      )}
                      
                      {job.status === 'paused' && (
                        <Button
                          size="sm"
                          onClick={() => controlJob(job.id, 'resume')}
                        >
                          <PlayCircle className="h-4 w-4 mr-2" />
                          Resume
                        </Button>
                      )}
                      
                      {(job.status === 'running' || job.status === 'paused') && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => controlJob(job.id, 'stop')}
                        >
                          <Square className="h-4 w-4 mr-2" />
                          Stop
                        </Button>
                      )}
                      
                      {(job.status === 'failed' || job.status === 'completed' || job.status === 'cancelled') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => controlJob(job.id, 'restart')}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restart
                        </Button>
                      )}

                      {/* Delete button - only show for non-running jobs */}
                      {job.status !== 'running' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => controlJob(job.id, 'delete')}
                        >
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
              Enter your LinkedIn password to restart this scraping job. The job will start from the beginning and rescrape all companies.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="restart-linkedin-password">LinkedIn Password</Label>
              <Input
                id="restart-linkedin-password"
                type="password"
                placeholder="Your LinkedIn password"
                value={restartLinkedinPassword}
                onChange={(e) => setRestartLinkedinPassword(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRestartJob} disabled={!restartLinkedinPassword}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restart Job
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setRestartingJobId(null)
                  setRestartLinkedinPassword('')
                }}
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
            <CardTitle className="text-red-800">Delete Job</CardTitle>
            <CardDescription className="text-red-600">
              Are you sure you want to delete this scraping job? This action cannot be undone. All job data and progress will be permanently lost.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                onClick={handleDeleteJob}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Job
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDeletingJobId(null)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}