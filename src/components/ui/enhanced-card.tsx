import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface EnhancedCardProps {
  title: string
  description?: string
  value?: string | number
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  gradient?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function EnhancedCard({
  title,
  description,
  value,
  icon: Icon,
  trend,
  gradient = 'from-blue-500 to-cyan-500',
  children,
  footer,
  className = ''
}: EnhancedCardProps) {
  return (
    <Card className={`overflow-hidden hover:shadow-soft transition-all duration-300 border-gray-200/50 bg-white/80 backdrop-blur-sm ${className}`}>
      {Icon && (
        <div className={`h-1 bg-gradient-to-r ${gradient}`} />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm">{description}</CardDescription>
            )}
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-md`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {value !== undefined && (
          <div className="space-y-1">
            <div className="text-3xl font-bold tracking-tight">{value}</div>
            {trend && (
              <div className={`text-sm flex items-center ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <span className="font-medium">
                  {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="text-gray-500 ml-2">{trend.label}</span>
              </div>
            )}
          </div>
        )}
        {children}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}
