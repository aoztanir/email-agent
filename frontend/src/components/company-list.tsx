'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface Company {
  id: string
  place_id: string
  name: string
  website?: string
  created_at: string
  updated_at: string
}

export function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/companies')
      
      if (!response.ok) {
        throw new Error('Failed to fetch companies')
      }

      const data: Company[] = await response.json()
      setCompanies(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading companies...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchCompanies} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company List</CardTitle>
        <CardDescription>
          {companies.length} companies in database
        </CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <p className="text-gray-500">No companies found. Upload a CSV file to get started.</p>
        ) : (
          <div className="overflow-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Place ID</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      {company.website ? (
                        <a 
                          href={company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {company.website}
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{company.place_id}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(company.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="mt-4">
          <Button onClick={fetchCompanies} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}