'use client'

import React from 'react'
import { X, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Source } from './ChatMessage'

interface SourcePreviewProps {
  source: Source
  onClose: () => void
}

export function SourcePreview({ source, onClose }: SourcePreviewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <CardTitle className="text-lg">Source Document</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              <strong>Document:</strong> {source.documentTitle || 'Untitled Document'}
            </div>
            <div className="text-sm text-muted-foreground">
              <strong>Chunk:</strong> {source.chunkIndex + 1}
              {source.similarity !== undefined && (
                <>
                  {' • '}
                  <strong>Similarity:</strong> {Math.round(source.similarity * 100)}%
                </>
              )}
            </div>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto">
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {source.content}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 