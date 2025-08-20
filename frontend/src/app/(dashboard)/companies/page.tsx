'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, Building2, ExternalLink, Trash2 } from 'lucide-react'
import { supabase, type Company } from '@/lib/supabase'

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadStats, setUploadStats] = useState<{
    total: number
    created: number
    errors: string[]
  } | null>(null)

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setCompanies(data || [])
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    setLoading(true)
    setUploadStats(null)

    try {
      // Use the Python API for CSV processing since it has pandas logic
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('http://localhost:8000/companies/upload-csv', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload CSV')
      }

      const result = await response.json()
      setUploadStats(result)

      // Refresh companies list using Supabase
      await fetchCompanies()

      // Reset file input
      event.target.value = ''
      
    } catch (error) {
      console.error('Error uploading CSV:', error)
      alert('Failed to upload CSV file')
    } finally {
      setLoading(false)
    }
  }

  const deleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This will also delete all associated contacts.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('company')
        .delete()
        .eq('id', companyId)

      if (error) throw error

      // Remove from local state
      setCompanies(companies.filter(c => c.id !== companyId))
    } catch (error) {
      console.error('Error deleting company:', error)
      alert('Failed to delete company')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Company Data</h1>
        <p className="text-gray-600 mt-2">Upload and manage your company database for LinkedIn contact mining</p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Company CSV</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file with company names and websites. Required columns: name, website (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-upload">Choose CSV File</Label>
              <Input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {loading && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Processing CSV file...</span>
                </div>
              </div>
            )}

            {uploadStats && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800">Upload Complete!</h4>
                <div className="mt-2 space-y-1 text-sm text-green-700">
                  <p>• Total companies processed: {uploadStats.total}</p>
                  <p>• New companies created: {uploadStats.created}</p>
                  {uploadStats.errors.length > 0 && (
                    <div>
                      <p className="text-red-700">• Errors:</p>
                      <ul className="list-disc list-inside ml-4 text-red-600">
                        {uploadStats.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Companies List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Companies ({companies.length})</span>
            </CardTitle>
            <CardDescription>Your uploaded company database</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchCompanies}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No companies uploaded yet</p>
              <p className="text-sm">Upload a CSV file to get started</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {companies.map((company) => (
                <div key={company.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{company.name}</h4>
                        {company.website && (
                          <div className="flex items-center space-x-1 mt-1">
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              {company.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="text-xs">
                      {new Date(company.created_at).toLocaleDateString()}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCompany(company.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}