/**
 * 订阅历史记录组件
 * 显示用户的订阅和支付历史
 */

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  FileText,
} from "lucide-react"

interface HistoryRecord {
  id: string
  event_type: string
  tier: string
  billing_cycle: string
  amount: number
  currency: string
  period_start: string
  period_end: string
  description: string
  status: string
  event_date: string
}

interface SubscriptionHistoryProps {
  limit?: number
}

export function SubscriptionHistory({ limit = 10 }: SubscriptionHistoryProps) {
  const [history, setHistory] = useState<HistoryRecord[]>([])
  const [stats, setStats] = useState<{ totalSpent: number; renewalCount: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    fetchHistory()
  }, [offset])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscription/history?limit=${limit}&offset=${offset}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch history")
      }

      const result = await response.json()
      
      if (result.success) {
        setHistory(result.data.history)
        setStats(result.data.stats)
        setHasMore(result.data.pagination.hasMore)
      }
    } catch (error) {
      console.error("[History] Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "subscription_created":
      case "payment_succeeded":
      case "subscription_renewed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case "subscription_upgraded":
        return <TrendingUp className="w-5 h-5 text-blue-500" />
      case "subscription_downgraded":
        return <TrendingDown className="w-5 h-5 text-orange-500" />
      case "subscription_canceled":
      case "subscription_expired":
      case "payment_failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "refund_issued":
        return <RefreshCw className="w-5 h-5 text-purple-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      subscription_created: "Subscription Created",
      subscription_renewed: "Subscription Renewed",
      subscription_upgraded: "Upgraded",
      subscription_downgraded: "Downgraded",
      subscription_canceled: "Canceled",
      subscription_expired: "Expired",
      payment_succeeded: "Payment Successful",
      payment_failed: "Payment Failed",
      refund_issued: "Refund Issued",
    }
    return labels[eventType] || eventType
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Completed</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "refunded":
        return <Badge variant="outline">Refunded</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatAmount = (amount: number, currency: string) => {
    if (!amount) return "-"
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount)
  }

  if (loading && history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
          <CardDescription>Loading your subscription and payment history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">
                    {formatAmount(stats.totalSpent, "USD")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Renewals</p>
                  <p className="text-2xl font-bold">{stats.renewalCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 历史记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your complete subscription and payment history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No history records yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  {/* Icon */}
                  <div className="mt-1">
                    {getEventIcon(record.event_type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div>
                        <h4 className="font-medium">
                          {getEventLabel(record.event_type)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {record.description}
                        </p>
                      </div>
                      {record.amount > 0 && (
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatAmount(record.amount, record.currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.tier.toUpperCase()} · {record.billing_cycle}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(record.event_date)}
                      </span>
                      {record.period_end && (
                        <span className="text-xs text-muted-foreground">
                          Valid until {formatDate(record.period_end)}
                        </span>
                      )}
                      {getStatusBadge(record.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 加载更多 */}
          {hasMore && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setOffset(offset + limit)}
                disabled={loading}
              >
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

