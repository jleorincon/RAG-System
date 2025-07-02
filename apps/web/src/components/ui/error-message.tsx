import React from 'react'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent } from './card'
import { Button } from './button'

interface ErrorMessageProps {
  title?: string
  message: string
  type?: 'error' | 'warning' | 'info'
  showTroubleshooting?: boolean
  onRetry?: () => void
}

export function ErrorMessage({ 
  title = 'Error', 
  message, 
  type = 'error',
  showTroubleshooting = false,
  onRetry 
}: ErrorMessageProps) {
  const isQuotaError = message.includes('quota') || message.includes('429')
  const isApiKeyError = message.includes('API key') || message.includes('401')

  return (
    <Card className={`border-l-4 ${
      type === 'error' ? 'border-l-red-500 bg-red-50' :
      type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
      'border-l-blue-500 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className={`h-5 w-5 mt-0.5 ${
            type === 'error' ? 'text-red-500' :
            type === 'warning' ? 'text-yellow-500' :
            'text-blue-500'
          }`} />
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{title}</h4>
            <p className="text-sm text-gray-700 mb-3">{message}</p>
            
            {showTroubleshooting && (isQuotaError || isApiKeyError) && (
              <div className="space-y-2">
                <h5 className="font-medium text-sm">Troubleshooting:</h5>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  {isQuotaError && (
                    <>
                      <li>Check your OpenAI billing at <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">platform.openai.com <ExternalLink className="h-3 w-3" /></a></li>
                      <li>Add credits to your OpenAI account</li>
                      <li>Verify your usage limits haven't been exceeded</li>
                    </>
                  )}
                  {isApiKeyError && (
                    <>
                      <li>Verify your OPENAI_API_KEY environment variable is set</li>
                      <li>Check that your API key is valid at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">platform.openai.com/api-keys <ExternalLink className="h-3 w-3" /></a></li>
                      <li>Restart your development server after updating environment variables</li>
                    </>
                  )}
                </ul>
              </div>
            )}
            
            {onRetry && (
              <div className="mt-3">
                <Button size="sm" variant="outline" onClick={onRetry}>
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 