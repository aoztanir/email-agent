'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface UploadResponse {
  message: string
  companies_created: number
  errors: string[]
}

export function UploadCSV() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/companies/upload-csv', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data: UploadResponse = await response.json()
      setResult(data)
      setFile(null)
      
      // Reset the input
      const input = document.getElementById('csv-upload') as HTMLInputElement
      if (input) input.value = ''
      
    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        message: 'Upload failed',
        companies_created: 0,
        errors: ['Failed to upload file']
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Company CSV</CardTitle>
        <CardDescription>
          Upload a CSV file with company data (required columns: name, place_id, optional: website)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
          />
          <Button 
            onClick={handleUpload} 
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-sm mb-2">Upload Result:</h3>
            <p className="text-sm">{result.message}</p>
            <p className="text-sm">Companies created: {result.companies_created}</p>
            
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-red-600">Errors:</p>
                <ul className="text-xs text-red-600">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}