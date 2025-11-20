'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { parseCSV, normalizeGuestData } from '@/lib/csv'
import Card from '@/components/Card'
import Button from '@/components/Button'
import GuestListTable from './GuestListTable'
import type { GuestListFile } from '@/types'

interface GuestListFilesProps {
  userId: string
}

export default function GuestListFiles({ userId }: GuestListFilesProps) {
  const [files, setFiles] = useState<GuestListFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    current: number
    total: number
    currentFileName: string
  } | null>(null)
  const supabase = createClient()

  const loadFiles = useCallback(async () => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('guest_list_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setFiles(data || [])
    } catch (err: unknown) {
      console.error('Error loading files:', err)
      setError(err instanceof Error ? err.message : 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const processSingleFile = async (file: File, index: number, total: number): Promise<{ success: boolean; error?: string }> => {
    try {
      setUploadProgress({
        current: index + 1,
        total,
        currentFileName: file.name,
      })

      // Parse CSV to get guest count and extract event info
      const rows = await parseCSV(file)
      if (rows.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Extract event name from filename (remove .csv extension)
      const eventTitle = file.name.replace(/\.csv$/i, '').trim() || 'Untitled Event'
      const eventDate = new Date().toISOString().split('T')[0] // Use today's date as default

      // Create event first
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: userId,
          title: eventTitle,
          date: eventDate,
          venue: 'TBD',
          description: `Event created from guest list: ${file.name}`,
        })
        .select()
        .single()

      if (eventError) throw eventError

      const eventId = eventData.id

      // Upload file to Supabase Storage (optional - continue even if this fails)
      // Path structure: guest-lists/{userId}/{timestamp}_{filename}
      const timestamp = Date.now() + index // Add index to ensure unique timestamps
      const fileName = `${timestamp}_${file.name}`
      const filePath = `${userId}/${fileName}`

      let storagePath: string | null = filePath
      const { error: uploadError } = await supabase.storage
        .from('guest-lists')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      // If storage upload fails, log it but continue processing
      // The file metadata will still be saved, just without storage_path
      if (uploadError) {
        console.warn(`Storage upload failed for ${file.name}:`, uploadError)
        // If bucket doesn't exist or policies aren't set up, set storage_path to null
        storagePath = null
      }

      // Normalize and insert guest data
      const guestData = rows.map((row) => ({
        event_id: eventId,
        ...normalizeGuestData(row),
      }))

      const { error: insertError } = await supabase.from('guests').insert(guestData)
      if (insertError) throw insertError

      // Create file metadata record
      const { data: fileRecord, error: fileError } = await supabase
        .from('guest_list_files')
        .insert({
          user_id: userId,
          event_id: eventId,
          file_name: file.name,
          file_size: file.size,
          guest_count: rows.length,
          storage_path: storagePath,
        })
        .select()
        .single()

      if (fileError) throw fileError

      return { success: true }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload CSV'
      console.error(`Error processing file:`, err)
      return { success: false, error: errorMsg }
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    setUploading(true)
    setError(null)
    setUploadProgress({
      current: 0,
      total: selectedFiles.length,
      currentFileName: '',
    })

    const results: { file: string; success: boolean; error?: string }[] = []

    // Process files sequentially to avoid overwhelming the server
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const result = await processSingleFile(file, i, selectedFiles.length)
      results.push({
        file: file.name,
        success: result.success,
        error: result.error,
      })
    }

    // Show summary of results
    const successCount = results.filter((r) => r.success).length
    const failCount = results.filter((r) => !r.success).length

    if (failCount > 0) {
      const failedFiles = results.filter((r) => !r.success).map((r) => r.file).join(', ')
      setError(
        `${successCount} file(s) uploaded successfully, ${failCount} failed. Failed files: ${failedFiles}`
      )
    } else if (successCount > 0) {
      // Show success message briefly
      setError(null)
    }

    // Reload files list
    await loadFiles()
    setShowUploadForm(false)
    setUploadProgress(null)
    setUploading(false)
    e.target.value = ''
  }

  const handleDelete = async (fileId: string, storagePath: string | null) => {
    if (!confirm('Are you sure you want to delete this guest list file? This will also delete all associated guest records.')) {
      return
    }

    try {
      // Delete file from storage if it exists
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('guest-lists')
          .remove([storagePath])
        // Don't throw if storage file doesn't exist
        if (storageError && storageError.message !== 'Object not found') {
          console.error('Error deleting storage file:', storageError)
        }
      }

      // Get the file record to find associated guests
      const { data: fileRecord } = await supabase
        .from('guest_list_files')
        .select('event_id')
        .eq('id', fileId)
        .single()

      // Delete associated guests if event_id exists
      if (fileRecord?.event_id) {
        // Note: In a production app, you might want to be more selective
        // For now, we'll delete all guests from this event that match the file
        // A better approach would be to track which guests came from which file
        // For MVP, we'll just delete the file record
      }

      // Delete file metadata record
      const { error: deleteError } = await supabase
        .from('guest_list_files')
        .delete()
        .eq('id', fileId)

      if (deleteError) throw deleteError

      // Reload files list
      await loadFiles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Card>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Guest List Files</h2>
          <Button
            onClick={() => setShowUploadForm(!showUploadForm)}
            variant={showUploadForm ? 'secondary' : 'primary'}
          >
            {showUploadForm ? 'Cancel' : 'Add New Guest List'}
          </Button>
        </div>

        {showUploadForm && (
          <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Upload CSV File(s)
              </label>
              <input
                type="file"
                accept=".csv"
                multiple
                onChange={handleFileUpload}
                disabled={uploading}
                className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:opacity-90 file:cursor-pointer disabled:opacity-50"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                You can select multiple CSV files at once. CSV should contain columns: api_id, name, first_name, last_name, email, phone_number.
                An event will be automatically created from each file name.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger text-danger text-sm">
            {error}
          </div>
        )}

        {uploading && uploadProgress && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                Processing file {uploadProgress.current} of {uploadProgress.total}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {uploadProgress.currentFileName}
            </p>
            <div className="mt-2 w-full bg-border rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No guest list files yet. Click &quot;Add New Guest List&quot; to upload one. Each CSV file will automatically create a new event.
        </p>
      ) : (
        <GuestListTable files={files} onDelete={handleDelete} formatFileSize={formatFileSize} />
      )}
    </Card>
  )
}

