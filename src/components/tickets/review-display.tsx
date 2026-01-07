'use client';

import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useGetReviewByTicketIdQuery,
  useMarkReviewHelpfulMutation,
  useMarkReviewUnhelpfulMutation,
} from '@/store/services/reviewApi';
import { toast } from 'sonner';

interface ReviewDisplayProps {
  ticketId: number;
}

export function ReviewDisplay({ ticketId }: ReviewDisplayProps) {
  const { data: review, isLoading, error } = useGetReviewByTicketIdQuery(ticketId);
  const [markHelpful] = useMarkReviewHelpfulMutation();
  const [markUnhelpful] = useMarkReviewUnhelpfulMutation();

  const handleHelpful = async () => {
    if (!review) return;
    try {
      await markHelpful(review.id).unwrap();
      toast.success('Thank you for your feedback!');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const handleUnhelpful = async () => {
    if (!review) return;
    try {
      await markUnhelpful(review.id).unwrap();
      toast.success('Thank you for your feedback!');
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (error || !review) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      case 'REJECTED':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'PENDING':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      default:
        return '';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              Customer Review
            </h3>
            <div className="flex items-center gap-3">
              {/* Star Rating */}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= review.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {review.rating}.0 out of 5
              </span>
            </div>
          </div>
          <Badge className={getStatusColor(review.status)}>
            {review.status}
          </Badge>
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              "{review.comment}"
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {review.customer_name && (
              <span className="font-medium">{review.customer_name} • </span>
            )}
            {formatDate(review.created_at)}
          </div>

          {/* Helpful/Unhelpful */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">
              Was this helpful?
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleHelpful}
              className="gap-1"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="text-xs">{review.helpful_count}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUnhelpful}
              className="gap-1"
            >
              <ThumbsDown className="w-4 h-4" />
              <span className="text-xs">{review.unhelpful_count}</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
