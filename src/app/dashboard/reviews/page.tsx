'use client';

import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { hasPermission } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, ThumbsUp, ThumbsDown, Filter, Trash2, Edit, TrendingUp } from 'lucide-react';
import {
  useGetReviewsQuery,
  useGetReviewsByCustomerQuery,
  useGetReviewsByRatingQuery,
  useGetReviewsByStatusQuery,
  useGetReviewStatsQuery,
  useMarkReviewHelpfulMutation,
  useMarkReviewUnhelpfulMutation,
  useDeleteReviewMutation,
} from '@/store/services/reviewApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ReviewsPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // Check permissions
  const canViewAllReviews = hasPermission('view all reviews');
  
  // Set default view mode based on permissions
  const defaultViewMode = canViewAllReviews ? 'all' : 'my';
  
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteReviewId, setDeleteReviewId] = useState<number | null>(null);
  const limit = 10;

  // Fetch reviews based on filters
  const { data: allReviewsData, isLoading: isLoadingAll, refetch: refetchAll } = useGetReviewsQuery(
    { page, limit },
    { skip: defaultViewMode !== 'all' || ratingFilter !== 'all' || statusFilter !== 'all' }
  );

  const { data: myReviewsData, isLoading: isLoadingMy, refetch: refetchMy } = useGetReviewsByCustomerQuery(
    { customerId: user?.id || 0, page, limit },
    { skip: defaultViewMode !== 'my' || !user?.id || ratingFilter !== 'all' || statusFilter !== 'all' }
  );

  const { data: ratingFilteredData, isLoading: isLoadingRating } = useGetReviewsByRatingQuery(
    { rating: parseInt(ratingFilter) as 1 | 2 | 3 | 4 | 5, page, limit },
    { skip: ratingFilter === 'all' || statusFilter !== 'all' }
  );

  const { data: statusFilteredData, isLoading: isLoadingStatus } = useGetReviewsByStatusQuery(
    { status: statusFilter, page, limit },
    { skip: statusFilter === 'all' || ratingFilter !== 'all' }
  );

  const { data: stats } = useGetReviewStatsQuery();
  const [markHelpful] = useMarkReviewHelpfulMutation();
  const [markUnhelpful] = useMarkReviewUnhelpfulMutation();
  const [deleteReview, { isLoading: isDeleting }] = useDeleteReviewMutation();

  // Determine which data to use
  const reviewsData = 
    ratingFilter !== 'all' ? ratingFilteredData :
    statusFilter !== 'all' ? statusFilteredData :
    defaultViewMode === 'my' ? myReviewsData :
    allReviewsData;

  const isLoading = isLoadingAll || isLoadingMy || isLoadingRating || isLoadingStatus;
  const reviews = reviewsData?.reviews || [];
  const totalPages = reviewsData?.totalPages || 1;

  const handleHelpful = async (id: number) => {
    try {
      await markHelpful(id).unwrap();
      toast.success('Marked as helpful!');
    } catch (error) {
      toast.error('Failed to mark as helpful');
    }
  };

  const handleUnhelpful = async (id: number) => {
    try {
      await markUnhelpful(id).unwrap();
      toast.success('Marked as unhelpful!');
    } catch (error) {
      toast.error('Failed to mark as unhelpful');
    }
  };

  const handleDelete = async () => {
    if (!deleteReviewId) return;
    try {
      await deleteReview(deleteReviewId).unwrap();
      toast.success('Review deleted successfully!');
      setDeleteReviewId(null);
      if (defaultViewMode === 'all') refetchAll();
      else refetchMy();
    } catch (error) {
      toast.error('Failed to delete review');
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Customer Reviews
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          View and manage customer feedback on resolved tickets
        </p>
      </div>

      {/* Statistics Card */}
      {stats && stats.average_rating !== undefined && (
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Review Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Average Rating */}
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">
                    {stats.average_rating?.toFixed(1) || '0.0'}
                  </span>
                  <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Average Rating
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                  Based on {stats.total_reviews || 0} reviews
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Rating Distribution
                </p>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.rating_distribution?.[rating as keyof typeof stats.rating_distribution] || 0;
                  const percentage = stats.total_reviews && stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm font-medium">{rating}</span>
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Show:
            </span>
            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
              >
                {canViewAllReviews ? 'All Reviews' : 'My Reviews'}
              </Button>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rating Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Filter by Rating
              </label>
              <Select value={ratingFilter} onValueChange={(value) => {
                setRatingFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Ratings</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Filter by Status
              </label>
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Clear Filters */}
          {(ratingFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRatingFilter('all');
                setStatusFilter('all');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle>
            {canViewAllReviews ? 'All Reviews' : 'My Reviews'}
            {reviewsData && (
              <span className="text-sm font-normal text-slate-500 ml-2">
                ({reviewsData.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="text-lg font-medium">No reviews found</p>
              <p className="text-sm mt-1">
                {!canViewAllReviews 
                  ? "You haven't submitted any reviews yet" 
                  : "No reviews match your filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border-slate-200 dark:border-slate-700">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
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
                              {review.rating}.0
                            </span>
                          </div>
                          
                          {/* Customer & Ticket Info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {review.customer_name && (
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {review.customer_name}
                              </span>
                            )}
                            {review.ticket_title && (
                              <>
                                <span className="text-slate-400">•</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                  Ticket: {review.ticket_title}
                                </span>
                              </>
                            )}
                            <span className="text-slate-400">•</span>
                            <span className="text-sm text-slate-500 dark:text-slate-500">
                              {formatDate(review.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(review.status)}>
                            {review.status}
                          </Badge>
                          {!canViewAllReviews && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteReviewId(review.id)}
                              className="hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Comment */}
                      {review.comment && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                            "{review.comment}"
                          </p>
                        </div>
                      )}

                      {/* Footer - Helpful/Unhelpful */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Was this helpful?
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHelpful(review.id)}
                            className="gap-1"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            <span className="text-xs">{review.helpful_count}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnhelpful(review.id)}
                            className="gap-1"
                          >
                            <ThumbsDown className="w-4 h-4" />
                            <span className="text-xs">{review.unhelpful_count}</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && reviews.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteReviewId} onOpenChange={() => setDeleteReviewId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteReviewId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
